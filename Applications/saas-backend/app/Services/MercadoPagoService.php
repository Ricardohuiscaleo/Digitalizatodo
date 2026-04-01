<?php

namespace App\Services;

use MercadoPago\MercadoPagoConfig;
use MercadoPago\Client\Common\RequestOptions;
use MercadoPago\Client\Customer\CustomerClient;
use MercadoPago\Client\Customer\CustomerCardClient;
use MercadoPago\Client\Payment\PaymentClient;
use MercadoPago\Client\Preference\PreferenceClient;
use MercadoPago\Exceptions\MPApiException;
use Illuminate\Support\Facades\Log;
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
     * 🏦 Vaulting: Crea o busca un Cliente en Mercado Pago
     */
    public function getOrCreateCustomer($email, $name = 'Student')
    {
        $client = new CustomerClient();
        
        try {
            // Buscamos si ya existe por email
            $searchRequest = new \MercadoPago\Net\MPSearchRequest(0, 1, ["email" => $email]);
            $search = $client->search($searchRequest);
            if (!empty($search->results)) {
                return $search->results[0];
            }

            // Si no existe, lo creamos
            return $client->create([
                "email" => $email,
                "first_name" => $name
            ]);
        } catch (Exception $e) {
            Log::error("Error MP Customer: " . $e->getMessage());
            return null;
        }
    }

    /**
     * 💳 Vaulting: Asocia una tarjeta tokenizada a un cliente
     */
    public function addCardToCustomer($customerId, $cardToken)
    {
        $client = new CustomerCardClient();
        try {
            return $client->create($customerId, ["token" => $cardToken]);
        } catch (Exception $e) {
            Log::error("Error MP Card Vault: " . $e->getMessage());
            throw new Exception("No se pudo guardar la tarjeta segura.");
        }
    }

    /**
     * 💰 Checkout API: Pago Directo con Split Automático (application_fee)
     * Utilizado para cobros RECURRENTES desde el Cron.
     */
    public function createDirectPayment($amount, $feeAmount, $customerId, $cardId, $collectorId, $description, $externalReference)
    {
        $client = new PaymentClient();

        try {
            $paymentRequest = [
                "transaction_amount" => (float) $amount,
                "description" => $description,
                "external_reference" => $externalReference,
                "payment_method_id" => "credit_card",
                "payer" => [
                    "type" => "customer",
                    "id" => $customerId,
                ],
                "token" => null, 
                "metadata" => [
                    "collector_id" => $collectorId
                ],
                "application_fee" => (float) $feeAmount, // 💰 EL SPLIT
            ];

            // Para el split en cobros indirectos, usamos el token del vendedor como contexto
            // pero el fee se descuenta si la App está vinculada vía OAuth.
            $payment = $client->create($paymentRequest);
            return $payment;

        } catch (MPApiException $e) {
            Log::error("Error MP Direct Payment: " . $e->getApiResponse()->getContent());
            throw new Exception("Error al procesar cobro automático.");
        }
    }

    /**
     * Versión para el primer pago (usando token directo del formulario)
     */
    public function createPaymentWithToken($amount, $feeAmount, $payerEmail, $token, $paymentMethodId, $collectorId, $description, $externalReference)
    {
        $client = new PaymentClient();

        try {
            $paymentRequest = [
                "transaction_amount" => (float) $amount,
                "description" => $description,
                "external_reference" => $externalReference,
                "payment_method_id" => $paymentMethodId,
                "payer" => [
                    "email" => $payerEmail,
                ],
                "token" => $token,
                "application_fee" => (float) $feeAmount, // 💰 SPLIT
            ];

            $payment = $client->create($paymentRequest);
            return $payment;

        } catch (MPApiException $e) {
            Log::error("Error MP Payment Token: " . $e->getApiResponse()->getContent());
            throw new Exception("Error al procesar pago con tarjeta.");
        }
    }

    /**
     * Generar un Preference (Checkout Pro) si el usuario prefiere redirección
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
                "payer" => ["email" => $payerEmail],
                "external_reference" => "FP_" . $feePaymentId,
                "marketplace_fee" => (float) $feeAmount,
                "back_urls" => [
                    "success" => "https://admin.digitalizatodo.cl/dashboard?payment=success",
                    "failure" => "https://admin.digitalizatodo.cl/dashboard?payment=failure",
                ],
                "auto_return" => "approved",
            ];

            if ($collectorId) {
                $preferenceRequest["collector_id"] = (int) $collectorId;
            }

            return $client->create($preferenceRequest);
        } catch (Exception $e) {
            Log::error("Error MP Preference: " . $e->getMessage());
            throw new Exception("Error al crear preferencia de pago.");
        }
    }
}
