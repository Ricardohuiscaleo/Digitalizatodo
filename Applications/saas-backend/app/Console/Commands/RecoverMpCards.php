<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Student;
use MercadoPago\MercadoPagoConfig;
use MercadoPago\Client\Customer\CustomerClient;
use Illuminate\Support\Facades\Log;

class RecoverMpCards extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:recover-mp-cards';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Recover missing tokenized cards from MercadoPago Vault linking them back to students';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("Iniciando recuperación de Tarjetas de Mercado Pago...");

        MercadoPagoConfig::setAccessToken(env('MERCADOPAGO_ACCESS_TOKEN'));
        $customerClient = new CustomerClient();

        // Obtener estudiantes activos que todavía no tengan su tarjeta configurada
        $students = Student::whereNull('mercadopago_card_id')
                            ->whereNotNull('email')
                            ->orWhereHas('guardians', function ($q) {
                                $q->whereNotNull('email');
                            })
                            ->get();

        $recoveredCount = 0;

        foreach ($students as $student) {
            // Priority: Student email, then primary guardian email
            $email = $student->email;
            if (!$email) {
                $guardian = $student->guardians()->wherePivot('primary', true)->first() ?? $student->guardians()->first();
                $email = $guardian?->email;
            }

            if (!$email) {
                continue;
            }

            try {
                // Search for customer vault in MP by email
                $searchRequest = new \MercadoPago\Net\MPSearchRequest(0, 1, ["email" => $email]);
                $search = $customerClient->search($searchRequest);
                
                if (!empty($search->results)) {
                    $customer = $search->results[0];
                    
                    if (!empty($customer->cards)) {
                        $card = $customer->cards[0]; // Take the most recent/first card
                        
                        $student->update([
                            'mercadopago_customer_id' => $customer->id,
                            'mercadopago_card_id' => $card->id,
                            'mercadopago_last_four' => $card->last_four_digits ?? null,
                            'mercadopago_payment_method_id' => $card->payment_method->id ?? null,
                        ]);

                        $this->info("✅ Tarjeta recuperada para {$student->name} (Customer: {$customer->id}, Card: {$card->last_four_digits})");
                        $recoveredCount++;
                    }
                }
            } catch (\Exception $e) {
                $this->error("Error buscando en MP para el email {$email}: " . $e->getMessage());
                Log::error("Error en recovery de cards MP: " . $e->getMessage());
            }
        }

        $this->info("🎉 Proceso finalizado. Se recuperaron exitosamente {$recoveredCount} tarjetas.");
    }
}
