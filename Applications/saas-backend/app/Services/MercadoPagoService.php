<?php

namespace App\Services;

use MercadoPago\MercadoPagoConfig;
use MercadoPago\Client\PreApprovalPlan\PreApprovalPlanClient;
use MercadoPago\Client\PreApproval\PreApprovalClient;
use MercadoPago\Exceptions\MPApiException;
use Exception;

class MercadoPagoService
{
    protected $accessToken;
    protected $publicKey;
    protected $isSandbox;
    protected $platformFeePercent;

    public function __construct()
    {
        $this->accessToken = env('MERCADOPAGO_ACCESS_TOKEN');
        $this->publicKey = env('MERCADOPAGO_PUBLIC_KEY');
        // Forzamos sandbox temporalmente si no está definido para seguridad en pruebas
        $this->isSandbox = env('MERCADOPAGO_MODE', 'sandbox') === 'sandbox';
        $this->platformFeePercent = env('MERCADOPAGO_PLATFORM_FEE', 5);

        if ($this->accessToken) {
            MercadoPagoConfig::setAccessToken($this->accessToken);
            MercadoPagoConfig::setRuntimeEnviroment(MercadoPagoConfig::LOCAL); // O según corresponda
        }
    }

    /**
     * Crea un Plan de Suscripción en Mercado Pago
     * Útil para academias que tienen precios fijos mensuales.
     */
    public function createSubscriptionPlan($tenant, $title, $amount)
    {
        $client = new PreApprovalPlanClient();

        try {
            $planRequest = [
                "reason" => $title,
                "auto_setup" => true,
                "payment_methods_allowed" => [
                    "payment_types" => [
                        ["id" => "credit_card"],
                        ["id" => "debit_card"]
                    ]
                ],
                "back_url" => "https://digitalizatodo.cl/pago-exitoso",
                "status" => "active",
                "auto_recurring" => [
                    "frequency" => 1,
                    "frequency_type" => "months",
                    "transaction_amount" => (float) $amount,
                    "currency_id" => "CLP"
                ]
            ];

            // Si es Marketplace, aquí se podría configurar el reparto o usar el modo checkout pro
            $plan = $client->create($planRequest);
            return $plan;

        } catch (MPApiException $e) {
            throw new Exception("Error MP: " . $e->getMessage());
        }
    }

    /**
     * Inicia una suscripción para un alumno específico
     * Retorna el init_point para redirigir al usuario
     */
    public function createSubscription($studentEmail, $planId, $amount, $feeAmount = 0)
    {
        $client = new PreApprovalClient();

        try {
            // Cálculo de comisión de Digitaliza Todo (Marketplace)
            if ($feeAmount == 0) {
                $feeAmount = ($amount * $this->platformFeePercent) / 100;
            }

            $subscriptionRequest = [
                "preapproval_plan_id" => $planId,
                "payer_email" => $studentEmail,
                "status" => "pending",
                "external_reference" => "SUBS-" . time(),
                // Nota: Para split payments avanzado en suscripciones se suele usar Checkout Pro 
                // o capturar el payment_id en el webhook y realizar el split.
            ];

            // En modo Sandbox, Mercado Pago usa usuarios de prueba
            $subscription = $client->create($subscriptionRequest);
            
            return $subscription;

        } catch (MPApiException $e) {
            throw new Exception("Error al crear suscripción: " . $e->getApiResponse()->getContent());
        }
    }
    
    /**
     * Generar un cobro puntual con Split Payment (Marketplace)
     * Este es el flujo recomendado para Checkout API con comisión.
     */
    public function createMarketplacePayment($amount, $token, $description, $payerEmail, $collectorId)
    {
        // Lógica para Payment API con application_fee
        // Requerido para repartir el dinero entre Digitaliza Todo y la Academia
    }
}
