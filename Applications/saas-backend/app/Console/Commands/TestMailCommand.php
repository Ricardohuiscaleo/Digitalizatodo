<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class TestMailCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'mail:test {email}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Evía un correo de prueba usando Resend';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');
        $this->info("Enviando correo de prueba a: {$email}...");

        try {
            \Illuminate\Support\Facades\Mail::to($email)->send(new \App\Mail\TestResendMail());
            $this->info('¡Correo enviado con éxito!');
        }
        catch (\Exception $e) {
            $this->error('Error al enviar el correo: ' . $e->getMessage());
        }
    }
}