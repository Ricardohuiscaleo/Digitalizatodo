<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\TelegramService;
use App\Models\Tenant;
use App\Models\User;

class TestRegistrationNotification extends Command
{
    protected $signature = 'telegram:test-reg';
    protected $description = 'Prueba el envío de notificación de Telegram para registros';

    public function handle()
    {
        $this->info("Simulando notificación de registro...");

        $tgMessage = "*¡Simulación de Nueva Empresa!*\n\n";
        $tgMessage .= "*Empresa:* Dojo Prueba AI\n";
        $tgMessage .= "*Industria:* Escuela de Artes Marciales\n";
        $tgMessage .= "*Admin:* Ricardo (admin@prueba.cl)\n";
        $tgMessage .= "*Trial:* Vence el " . now()->addDays(7)->format('d/m/Y') . "\n\n";
        $tgMessage .= "🔗 [admin.digitalizatodo.cl/dojo-prueba](https://admin.digitalizatodo.cl/dojo-prueba)";

        TelegramService::sendMessage($tgMessage);

        $this->info("Mensaje enviado. Revisa tu Telegram.");
    }
}