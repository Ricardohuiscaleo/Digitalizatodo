<?php

namespace App\Services;

use MercadoPago\MercadoPagoConfig;
use MercadoPago\Client\PreApprovalPlan\PreApprovalPlanClient;
use MercadoPago\Client\PreApproval\PreApprovalClient;
use MercadoPago\Client\Preference\PreferenceClient;
use MercadoPago\Exceptions\MPApiException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
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
        $this->platformFeePercent = env('MERCADOPAGO_PLATFORM_FEE', 1.81);

        if ($this->accessToken) {
            $this->applyConfig();
        }
    }

    protected function applyConfig()
    {
        if ($this->accessToken) {
            MercadoPagoConfig::setAccessToken($this->accessToken);
            MercadoPagoConfig::setRuntimeEnviroment(MercadoPagoConfig::LOCAL); 
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
     * Inicia una suscripción para un alumno específico (Marketplace Split)
     * @param string $collectorId ID de Mercado Pago de la Academia
     */
    public function createSubscription($studentEmail, $planId, $amount, $feePaymentId, $collectorId = null, $feeAmount = 0)
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
                "external_reference" => "FP_" . $feePaymentId,
                "back_url" => "https://admin.digitalizatodo.cl/dashboard?payment=success",
                "marketplace_fee" => (float) $feeAmount, // 💰 SPLIT AUTOMÁTICO
            ];

            // En modo Marketplace, el collector_id es quien recibe el dinero
            if ($collectorId) {
                $subscriptionRequest["collector_id"] = (int) $collectorId;
            }

            $subscription = $client->create($subscriptionRequest);
            return $subscription;

        } catch (MPApiException $e) {
            Log::error("Error MP Subscription (FP: $feePaymentId): " . $e->getApiResponse()->getContent());
            throw new Exception("Error al crear suscripción: " . $e->getApiResponse()->getContent());
        }
    }
    
    /**
     * Generar un cobro puntual para Clases Sueltas o Packs (Marketplace Split)
     * @param string $collectorId ID de Mercado Pago de la Academia
     */
    public function createOneTimePayment($title, $amount, $feePaymentId, $payerEmail, $collectorId = null)
    {
        $client = new PreferenceClient();

        try {
            $feeAmount = ($amount * $this->platformFeePercent) / 100;

            $preferenceRequest = [
                "items" => [
                    [
                        "title" => $title,
                        "quantity" => 1,
                        "unit_price" => (float) $amount,
                        "currency_id" => "CLP"
                    ]
                ],
                "payer" => [
                    "email" => $payerEmail
                ],
                "external_reference" => "FP_" . $feePaymentId,
                "marketplace_fee" => (float) $feeAmount, // 💰 SPLIT AUTOMÁTICO
                "back_urls" => [
                    "success" => "https://admin.digitalizatodo.cl/dashboard?payment=success",
                    "failure" => "https://admin.digitalizatodo.cl/dashboard?payment=failure",
                ],
                "auto_return" => "approved",
                "notification_url" => "https://admin.digitalizatodo.cl/api/mercadopago/webhook"
            ];

            if ($collectorId) {
                $preferenceRequest["collector_id"] = (int) $collectorId;
            }

            $preference = $client->create($preferenceRequest);
            return $preference;

        } catch (MPApiException $e) {
            Log::error("Error MP Preference (FP: $feePaymentId): " . $e->getApiResponse()->getContent());
            throw new Exception("Error al crear cobro puntual: " . $e->getApiResponse()->getContent());
        }
    }
}
