<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Services\TelegramService;

echo "Enviando mensaje de prueba...\n";
TelegramService::sendMessage("🚀 TEST MANUAL DIGITALIZATODO - SI ESTAS LEYENDO ESTO EL BOT FUNCIONA");
echo "Listo.\n";
