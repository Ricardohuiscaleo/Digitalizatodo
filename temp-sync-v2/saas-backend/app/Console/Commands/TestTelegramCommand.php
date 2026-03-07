<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class TestTelegramCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'telegram:test';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Simula la llegada de un correo y lo envía a Telegram';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("Simulando llegada de correo para Telegram...");

        try {
            $response = \Illuminate\Support\Facades\Http::post(url('/api/webhooks/resend-inbound'), [
                'type' => 'email.received',
                'data' => [
                    'from' => 'cliente-prueba@ejemplo.com',
                    'subject' => 'Consulta Real de Resend (Simulada)',
                    'text' => 'Hola Ricardo, esta es una simulación exacta de cómo Resend envía el correo a tu servidor. Si ves esto en Telegram, el puente está perfecto.'
                ]
            ]);

            if ($response->successful()) {
                $this->info('¡Webhook disparado! Revisa tu Telegram.');
            }
            else {
                $this->error('Error al disparar el webhook local: ' . $response->status());
            }
        }
        catch (\Exception $e) {
            $this->error('Error: ' . $e->getMessage());
        }
    }
}