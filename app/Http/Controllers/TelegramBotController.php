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
                // Para correos recibidos (inbound), se usa el método receiving
                $email = $resend->emails->receiving->get($emailId);
                $text = $email->text ?? ($email->html ?? 'Contenido no disponible');
                $from = $email->from ?? $from;
                $subject = $email->subject ?? $subject;
            }
            catch (\Exception $e) {
                Log::error('Error recuperando email desde Resend API (Receiving): ' . $e->getMessage());
                $text = 'Error al recuperar contenido: ' . $emailId;
            }
        }

        $text = $text ?? 'Sin contenido';

        $token = env('TELEGRAM_BOT_TOKEN');
        $chatId = env('TELEGRAM_ADMIN_ID');

        if (!$token || !$chatId) {
            Log::error('Telegram Token o Admin ID no configurado en .env');
            return response()->json(['status' => 'config_error'], 500);
        }

        $message = "*Nuevo Correo Recibido*\n\n";
        $message .= "*De:* {$from}\n";
        $message .= "*Asunto:* {$subject}\n\n";
        $message .= "```\n" . substr(strip_tags($text), 0, 3000) . "\n```\n\n";
        $message .= "_Responde a este mensaje para contestar el correo._";

        $response = Http::post("https://api.telegram.org/bot{$token}/sendMessage", [
            'chat_id' => $chatId,
            'text' => $message,
            'parse_mode' => 'Markdown',
        ]);

        if ($response->successful()) {
            $msgData = $response->json();
            $tgMessageId = $msgData['result']['message_id'];

            TelegramConversation::create([
                'chat_id' => $chatId,
                'message_id' => $tgMessageId,
                'from_email' => $from,
                'subject' => $subject,
            ]);
        }

        return response()->json(['status' => 'ok']);
    }

    /**
     * Endpoint para recibir Webhooks desde Coolify (Notificaciones de Deploy)
     * POST /api/webhooks/coolify-deploy
     */
    public function handleCoolifyDeploy(Request $request)
    {
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
        $commitMessage = $payload['commit_message'] ?? ($payload['commit_subject'] ?? ($payload['commit_message_body'] ?? null));
        $commitHash = $payload['commit'] ?? ($payload['commit_hash'] ?? ($payload['hash'] ?? null));
        $author = $payload['commit_author'] ?? ($payload['author_name'] ?? ($payload['pusher_name'] ?? null));
        $branch = $payload['branch'] ?? ($payload['vcs_branch'] ?? ($payload['ref'] ?? null));

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
            $message .= "<b>🌐 URL:</b> <a href=\"{$url}\">Ver Cambios</a>\n";
        }

        if ($subject && $subject !== 'Coolify Notification') {
            $message .= "\n📌 <i>" . htmlspecialchars($subject) . "</i>";
        }

        $message .= "\n\n<i>Digitaliza Todo BOT</i>";

        \App\Services\TelegramService::sendMessage($message);

        return response()->json(['status' => 'ok']);
    }

    /**
     * Endpoint para recibir Webhooks desde Telegram (Tus respuestas)
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
                Log::error('Error al responder correo desde Telegram: ' . $e->getMessage());
            }
        }

        return response()->json(['status' => 'ok']);
    }
} // Test deploy Sat Mar  7 16:46:41 -03 2026
// Final fix trigger Sat Mar  7 16:50:06 -03 2026