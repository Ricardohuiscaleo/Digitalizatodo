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
        $token = env('TELEGRAM_BOT_TOKEN');
        $chatId = env('TELEGRAM_ADMIN_ID');

        if (!$token || !$chatId) {
            Log::warning('Telegram: Token o Admin ID no configurado en .env');
            return;
        }

        try {
            Http::post("https://api.telegram.org/bot{$token}/sendMessage", [
                'chat_id' => $chatId,
                'text' => $message,
                'parse_mode' => 'HTML',
            ]);
        }
        catch (\Exception $e) {
            Log::error('Telegram: Error al enviar mensaje: ' . $e->getMessage());
        }
    }
}