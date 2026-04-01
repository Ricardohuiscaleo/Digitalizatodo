<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\MercadoPagoService;

class TestMPSandbox extends Command
{
    protected $signature = 'mp:test-sandbox';
    protected $description = 'Prueba la conexión con Mercado Pago Sandbox';

    public function handle(MercadoPagoService $mpService)
    {
        $this->info("Iniciando prueba de conexión con Mercado Pago Sandbox...");
        $this->info("ACCESS_TOKEN (start...end): " . substr(env('MERCADOPAGO_ACCESS_TOKEN'), 0, 8) . "..." . substr(env('MERCADOPAGO_ACCESS_TOKEN'), -4));
        $this->info("PUBLIC_KEY (start...end): " . substr(env('MERCADOPAGO_PUBLIC_KEY'), 0, 8) . "..." . substr(env('MERCADOPAGO_PUBLIC_KEY'), -4));
        $this->info("MODE: " . env('MERCADOPAGO_MODE'));
        
        try {
            // Intentamos crear un plan de prueba de 10 CLP
            $plan = $mpService->createSubscriptionPlan(null, "Test Antigravity Sandbox Plan", 10);
            
            $this->info("¡ÉXITO! Conexión establecida.");
            $this->info("Plan ID: " . $plan->id);
            $this->info("Reason: " . $plan->reason);
            $this->info("URL: " . $plan->init_point);
            
        } catch (\MercadoPago\Exceptions\MPApiException $e) {
            $this->error("ERROR de API: " . $e->getApiResponse()->getContent());
        } catch (\Exception $e) {
            $this->error("ERROR General: " . $e->getMessage());
        }
    }
}
