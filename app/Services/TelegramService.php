<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TelegramService
{
    /**
     * Envía un mensaje a través del Bot de Telegram configurado.
     */
    public static function sendMessage(string $message): void
    {
        $token = config('services.telegram.bot_token');
        $chatId = config('services.telegram.admin_id');

        if (!$token || !$chatId) {
            Log::warning('Telegram: Token o Admin ID no configurado en config/services.php');
            return;
        }

        try {
            $response = Http::post("https://api.telegram.org/bot{$token}/sendMessage", [
                'chat_id' => $chatId,
                'text' => $message,
                'parse_mode' => 'HTML',
            ]);

            if (!$response->successful()) {
                Log::error('Telegram: API retornó error: ' . $response->body());
            }
        }
        catch (\Exception $e) {
            Log::error('Telegram: Error al enviar mensaje: ' . $e->getMessage());
        }
    }
}