<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Recordatorios de cuotas: corre diariamente a las 9am
Schedule::command('fees:send-reminders')->dailyAt('09:00');

// Recordatorios de clases: corre cada minuto (verifica clases en T+30m)
Schedule::command('classes:send-reminders')->everyMinute();

// Cobros automáticos de Mercado Pago: corre diariamente a las 3am
Schedule::command('mercadopago:process-recurring')->dailyAt('03:00');
