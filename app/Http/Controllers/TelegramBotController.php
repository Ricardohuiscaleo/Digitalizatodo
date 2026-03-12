<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Models\TelegramConversation;

class TelegramBotController extends Controller
{
    /**
     * Endpoint para recibir Webhooks desde Resend (Correos entrantes)
     */
    public function handleResendInbound(Request $request)
    {
        try {
            $payload = $request->all();
            Log::info('Resend Inbound Webhook Received', $payload);

            $data = $payload['data'] ?? $payload;

            $from = $data['from'] ?? 'Desconocido';
            $subject = $data['subject'] ?? 'Sin Asunto';
            $text = $data['text'] ?? ($data['html'] ?? null);
            $emailId = $data['email_id'] ?? null;

            // Si no tenemos el texto pero tenemos un email_id, lo pedimos a Resend
            if (!$text && $emailId) {
                try {
                    $resend = \Resend::client(env('RESEND_API_KEY'));
                    $email = $resend->emails->receiving->get($emailId);
                    $text = $email->text ?? ($email->html ?? null);
                    $from = $email->from ?? $from;
                    $subject = $email->subject ?? $subject;
                }
                catch (\Exception $e) {
                    Log::error('Error recuperando email desde Resend API: ' . $e->getMessage());
                }
            }

            $text = $text ? strip_tags($text) : "(sin cuerpo — email_id: {$emailId})";

            $token = env('TELEGRAM_BOT_TOKEN');
            $chatId = env('TELEGRAM_ADMIN_ID');

            if (!$token || !$chatId) {
                Log::error('Telegram Token o Admin ID no configurado en .env');
                return response()->json(['status' => 'config_error']);
            }

            $message = "*Nuevo Correo Recibido*\n\n";
            $message .= "*De:* {$from}\n";
            $message .= "*Asunto:* {$subject}\n\n";
            $message .= "```\n" . substr($text, 0, 3000) . "\n```\n\n";
            $message .= "_Responde a este mensaje para contestar el correo._";

            $response = Http::post("https://api.telegram.org/bot{$token}/sendMessage", [
                'chat_id' => $chatId,
                'text' => $message,
                'parse_mode' => 'Markdown',
            ]);

            Log::info('Telegram sendMessage response', ['status' => $response->status(), 'body' => $response->json()]);

            if ($response->successful()) {
                $tgMessageId = $response->json('result.message_id');
                TelegramConversation::create([
                    'chat_id' => $chatId,
                    'message_id' => $tgMessageId,
                    'from_email' => $from,
                    'subject' => $subject,
                ]);
            }
        }
        catch (\Exception $e) {
            Log::error('handleResendInbound fatal: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
        }

        // Siempre 200 para que Resend no reintente
        return response()->json(['status' => 'ok']);
    }

    /**
     * Endpoint para recibir Webhooks desde Coolify (Notificaciones de Deploy)
     * POST /api/webhooks/coolify-deploy
     */
    public function handleCoolifyDeploy(Request $request)
    {
        // ... (existing code remains identical)
        $payload = $request->all();
        Log::info('Coolify Webhook Received', $payload);

        // Seguridad: Validar token secreto si existe en el .env
        $secretToken = env('COOLIFY_WEBHOOK_SECRET');
        $providedToken = $request->header('X-Coolify-Token') ?? $request->query('token');

        if ($secretToken && $secretToken !== $providedToken) {
            Log::warning('Coolify Webhook: Unauthorized', ['provided' => $providedToken]);
            return response()->json(['status' => 'unauthorized'], 401);
        }

        // Consolidar toda la información posible del payload
        $status = strtolower($payload['status'] ?? ($payload['state'] ?? 'unknown'));
        $rawMsg = $payload['message'] ?? null;
        $subject = $payload['subject'] ?? null;
        $appName = $payload['name'] ?? ($payload['application_name'] ?? 'Aplicación');
        $url = $payload['url'] ?? ($payload['deployment_url'] ?? null);
        $commitMessage = $payload['commit_message'] ?? ($payload['commit_subject'] ?? ($payload['commit_message_body'] ?? ($payload['message'] ?? null)));
        $commitHash = $payload['commit'] ?? ($payload['commit_hash'] ?? ($payload['hash'] ?? ($payload['sha'] ?? null)));
        $author = $payload['commit_author'] ?? ($payload['author_name'] ?? ($payload['pusher_name'] ?? ($payload['pusher']['name'] ?? null)));
        $branch = $payload['branch'] ?? ($payload['vcs_branch'] ?? ($payload['ref'] ?? ($payload['branch_name'] ?? null)));

        // Determinar el título basado en el estado o mensaje
        $title = "🔔 <b>Notificación de Sistema</b>";
        $emoji = "❓";

        // Intentar detectar si es Producción o Staging basado en nombre o URL
        $envSuffix = "";
        if (str_contains(strtolower($appName), 'prod') || str_contains(strtolower($url ?? ''), 'app.digitalizatodo')) {
            $envSuffix = " [PROD]";
        }
        elseif (str_contains(strtolower($appName), 'stage') || str_contains(strtolower($url ?? ''), 'staging')) {
            $envSuffix = " [STAGING]";
        }

        if ($status === 'finished' || $status === 'success' || str_contains($rawMsg, 'successfully deployed')) {
            $title = "✅ <b>¡Despliegue Exitoso!</b>" . $envSuffix;
            $emoji = "✅";
        }
        elseif ($status === 'failed' || $status === 'error' || str_contains($rawMsg, 'failed')) {
            $title = "❌ <b>Error en el Despliegue</b>" . $envSuffix;
            $emoji = "❌";
        }
        elseif ($status === 'started' || str_contains($rawMsg, 'started')) {
            $title = "🚀 <b>Despliegue Iniciado</b>";
            $emoji = "🚀";
        }
        elseif (str_contains($rawMsg, 'restarted')) {
            $title = "♻️ <b>Recurso Reiniciado</b>";
            $emoji = "♻️";
        }

        $message = "{$emoji} {$title}\n\n";
        $message .= "<b>📦 App:</b> " . htmlspecialchars($appName) . "\n";

        if ($branch) {
            $message .= "<b>🌿 Rama:</b> <code>" . htmlspecialchars($branch) . "</code>\n";
        }

        if ($commitMessage) {
            $message .= "<b>📝 Commit:</b> " . htmlspecialchars($commitMessage) . "\n";
        }
        elseif ($rawMsg && !str_contains($rawMsg, 'successfully deployed')) {
            $message .= "<b>💬 Msg:</b> " . htmlspecialchars($rawMsg) . "\n";
        }

        if ($author) {
            $message .= "<b>👤 Autor:</b> " . htmlspecialchars($author) . "\n";
        }

        if ($commitHash) {
            $message .= "<b>🔗 Hash:</b> <code>" . substr($commitHash, 0, 7) . "</code>\n";
        }

        if ($url) {
            $message .= "<b>🌐 URL:</b> <a href=\"" . htmlspecialchars($url) . "\">Ver Cambios</a>\n";
        }

        if ($subject && $subject !== 'Coolify Notification') {
            $message .= "\n📌 <i>" . htmlspecialchars($subject) . "</i>";
        }

        $message .= "\n\n<i>Digitaliza Todo BOT</i>";

        \App\Services\TelegramService::sendMessage($message);

        return response()->json(['status' => 'ok']);
    }

    /**
     * Recibir datos desde el formulario de contacto de la landing
     * POST /api/webhooks/contact
     */
    public function handleContactForm(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email',
            'service' => 'required|string',
            'message' => 'required|string',
        ]);

        Log::info('Website Contact Form Received', $data);

        $message = "📬 <b>Nueva Consulta - Digitaliza Todo</b>\n\n";
        $message .= "👤 <b>Nombre:</b> " . htmlspecialchars($data['name']) . "\n";
        $message .= "📧 <b>Email:</b> " . htmlspecialchars($data['email']) . "\n";
        $message .= "🛠 <b>Servicio:</b> " . htmlspecialchars($data['service']) . "\n\n";
        $message .= "💬 <b>Mensaje:</b>\n" . htmlspecialchars($data['message']) . "\n\n";
        $message .= "<i>Enviado desde Landing Page</i>";

        \App\Services\TelegramService::sendMessage($message);

        return response()->json(['status' => 'ok', 'message' => 'Notification sent to Telegram']);
    }

    /**
     * Notificar visita a la página (Tráfico en vivo)
     * POST /api/webhooks/visit
     */
    public function handleVisitPing(Request $request)
    {
        $data = $request->validate([
            'session_id' => 'required|string',
            'url' => 'required|string',
            'metadata' => 'nullable|array',
        ]);

        $token = config('services.telegram_chat.bot_token');
        $chatId = config('services.telegram_chat.admin_id');

        $device = str_contains(strtolower($data['metadata']['userAgent'] ?? ''), 'mobile') ? '📱 Móvil' : '💻 Desktop';
        
        $message = "👀 <b>Nuevo Visitante en Vivo</b>\n\n";
        $message .= "🌐 <b>Página:</b> " . ($data['url'] ?? 'N/A') . "\n";
        $message .= "🖥️ <b>Disp:</b> {$device}\n";
        $message .= "🆔 <b>Sesión:</b> <code>" . $data['session_id'] . "</code>\n\n";
        $message .= "<i>Esperando para ver si inicia un chat...</i>";

        Http::post("https://api.telegram.org/bot{$token}/sendMessage", [
            'chat_id' => $chatId,
            'text' => $message,
            'parse_mode' => 'HTML',
            'disable_notification' => true 
        ]);

        return response()->json(['status' => 'ok']);
    }

    /**
     * Enviar mensaje desde el Chat en Tiempo Real de la Landing a Telegram
     * POST /api/webhooks/chat/send
     */
    public function handleChatSend(Request $request)
    {
        $data = $request->validate([
            'session_id' => 'required|string',
            'message' => 'required|string',
            'metadata' => 'nullable|array',
        ]);

        $chatMsg = \App\Models\ChatMessage::create([
            'session_id' => $data['session_id'],
            'sender' => 'user',
            'message' => $data['message'],
        ]);

        $token = config('services.telegram_chat.bot_token');
        $chatId = config('services.telegram_chat.admin_id');

        $message = "💬 <b>Nuevo Chat en Vivo</b>\n\n";
        $message .= "🆔 <b>Sesión:</b> <code>" . $data['session_id'] . "</code>\n";
        
        if (isset($data['metadata'])) {
            $m = $data['metadata'];
            $device = str_contains(strtolower($m['userAgent'] ?? ''), 'mobile') ? '📱 Móvil' : '💻 Desktop';
            $message .= "🌐 <b>URL:</b> " . ($m['url'] ?? 'N/A') . "\n";
            $message .= "🖥️ <b>Disp:</b> {$device} (" . ($m['screen'] ?? '?') . ")\n";
        }
        
        $message .= "\n<b>Mensaje:</b>\n" . htmlspecialchars($data['message']) . "\n\n";
        $message .= "<i>Responde directamente para contestar al cliente.</i>";

        $response = Http::post("https://api.telegram.org/bot{$token}/sendMessage", [
            'chat_id' => $chatId,
            'text' => $message,
            'parse_mode' => 'HTML',
        ]);

        if ($response->successful()) {
            $chatMsg->update(['telegram_message_id' => $response->json('result.message_id')]);
        }

        return response()->json(['status' => 'ok']);
    }

    /**
     * Obtener historial de mensajes para una sesión (Polling)
     * GET /api/webhooks/chat/messages?session_id=...
     */
    public function getChatMessages(Request $request)
    {
        $sessionId = $request->query('session_id');
        if (!$sessionId) return response()->json([]);

        $messages = \App\Models\ChatMessage::where('session_id', $sessionId)
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json($messages);
    }

    /**
     * Webhook del Bot de Chat (Dtodochat_bot)
     * POST /api/webhooks/telegram/chat
     */
    public function handleChatBotWebhook(Request $request)
    {
        $update = $request->all();
        if (!isset($update['message']['reply_to_message'])) return response()->json(['ignored']);

        $replyToId = $update['message']['reply_to_message']['message_id'];
        $responseText = $update['message']['text'];

        $originalMsg = \App\Models\ChatMessage::where('telegram_message_id', $replyToId)->first();

        if ($originalMsg) {
            \App\Models\ChatMessage::create([
                'session_id' => $originalMsg->session_id,
                'sender' => 'admin',
                'message' => $responseText,
            ]);
            return response()->json(['status' => 'ok']);
        }

        return response()->json(['status' => 'not_found']);
    }

    /**
     * Endpoint para recibir Webhooks desde Telegram (Tus respuestas del Mail Bot)
     */
    public function handleTelegramWebhook(Request $request)
    {
        $update = $request->all();
        Log::info('Telegram Webhook Received', $update);

        if (!isset($update['message']['reply_to_message'])) {
            return response()->json(['status' => 'ignored']);
        }

        $replyTo = $update['message']['reply_to_message']['message_id'];
        $responseText = $update['message']['text'];

        $convo = TelegramConversation::where('message_id', $replyTo)->first();

        if ($convo) {
            // ENVIAMOS EL CORREO DE VUELTA USANDO RESEND
            try {
                Mail::raw($responseText, function ($message) use ($convo) {
                    $message->to($convo->from_email)
                        ->subject("Re: " . ($convo->subject ?? 'Respuesta'));
                });

                // Confirmar en Telegram
                $token = env('TELEGRAM_BOT_TOKEN');
                Http::post("https://api.telegram.org/bot{$token}/sendMessage", [
                    'chat_id' => $convo->chat_id,
                    'text' => "Enviado a {$convo->from_email}",
                    'reply_to_message_id' => $update['message']['message_id']
                ]);

            }
            catch (\Exception $e) {
                Log::error('Error al responder con email: ' . $e->getMessage());
            }

            return response()->json(['status' => 'ok']);
        }

        return response()->json(['status' => 'ignored']);
    }
}