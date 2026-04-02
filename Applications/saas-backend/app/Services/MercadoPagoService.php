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

            // 🛡️ INDUSTRIAL: Fragmentamos el nombre para cumplir calidad 73+
            $nameParts = explode(' ', trim($name));
            $firstName = $nameParts[0] ?? 'Student';
            $lastName = (count($nameParts) > 1) ? implode(' ', array_slice($nameParts, 1)) : '---';

            // Si no existe, lo creamos
            return $client->create([
                "email" => $email,
                "first_name" => $firstName,
                "last_name" => $lastName
            ]);
        } catch (MPApiException $e) {
            $content = $e->getApiResponse()->getContent();
            Log::error("Error MP Customer (API): " . json_encode($content));
            
            // Si el error es "Email ya existe", intentamos buscarlo de nuevo (doble check)
            if (isset($content['message']) && str_contains($content['message'], 'already exists')) {
                 $searchRequest = new \MercadoPago\Net\MPSearchRequest(0, 1, ["email" => $email]);
                 $search = $client->search($searchRequest);
                 if (!empty($search->results)) return $search->results[0];
            }
            return null;
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
                "installments" => 1,
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
            Log::error("Error MP Direct Payment: " . json_encode($e->getApiResponse()->getContent()));
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
                "installments" => 1,
                "payer" => [
                    "email" => $payerEmail,
                ],
                "token" => $token,
                "application_fee" => (float) $feeAmount, // 💰 SPLIT
            ];

            $payment = $client->create($paymentRequest);
            return $payment;

        } catch (MPApiException $e) {
            Log::error("Error MP Payment Token: " . json_encode($e->getApiResponse()->getContent()));
            throw new Exception("Error al procesar pago con tarjeta.");
        }
    }

    /**
     * 💳 Cobro Industrial: Genera el pago usando token de tarjeta y cliente
     */
    public function createSubscriptionPayment($data)
    {
        $client = new PaymentClient();

        try {
            $paymentRequest = [
                "transaction_amount" => (float) ($data['transaction_amount'] ?? 0),
                "token" => $data['token'] ?? null,
                "description" => $data['description'] ?? 'Pago de Cuota',
                "installments" => (int) ($data['installments'] ?? 1),
                "payment_method_id" => $data['payment_method_id'] ?? null,
                "issuer_id" => $data['issuer_id'] ?? null, // ✅ CALIDAD 73+
                "statement_descriptor" => "DIGITALIZATODO", // ✅ CALIDAD 73+ (Aparece en el resumen de tarjeta)
                "payer" => [
                    "email" => $data['payer']['email'] ?? null,
                    "first_name" => $data['payer']['first_name'] ?? null, // ✅ CALIDAD 73+
                    "last_name" => $data['payer']['last_name'] ?? null,   // ✅ CALIDAD 73+
                    // Si tenemos el payer.id del cliente, lo incluimos para calidad 73+
                    "id" => $data['payer']['id'] ?? null,
                ],
                "items" => $data['items'] ?? [], // ✅ INDUSTRIAL: Detalle de productos/servicios
                "external_reference" => $data['external_reference'] ?? null,
            ];

            // 🛡️ SEGURIDAD: Inyectar Device ID si está disponible
            $options = new RequestOptions();
            if (isset($data['device_id'])) {
                $options->setCustomHeaders(["X-Meli-Session-Id: " . $data['device_id']]);
            }

            return $client->create($paymentRequest, $options);

        } catch (MPApiException $e) {
            Log::error("Error MP Global Payment: " . json_encode($e->getApiResponse()->getContent()));
            throw new Exception("Error al procesar el pago con Mercado Pago.");
        }
    }

    /**
     * Generar un Preference (Checkout Pro) si el usuario prefiere redirección
     */
    public function createOneTimePayment($title, $amount, $feePaymentId, $payerEmail, $tenantAccessToken = null)
    {
        try {
            // Usar el token del tenant (dojo) para que MP aplique el marketplace_fee correctamente
            $tokenToUse = $tenantAccessToken ?: $this->accessToken;
            MercadoPagoConfig::setAccessToken($tokenToUse);

            $client = new PreferenceClient();
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
                    "success" => "https://app.digitalizatodo.cl/dashboard/student?payment=success",
                    "failure" => "https://app.digitalizatodo.cl/dashboard/student?payment=failure",
                ],
                "auto_return" => "approved",
            ];

            return $client->create($preferenceRequest);
        } catch (MPApiException $e) {
            Log::error("Error MP Preference API: " . json_encode($e->getApiResponse()->getContent()));
            throw new Exception("Error al crear preferencia de pago.");
        } catch (Exception $e) {
            Log::error("Error MP Preference: " . $e->getMessage());
            throw new Exception("Error al crear preferencia de pago.");
        } finally {
            // Restaurar token de plataforma
            MercadoPagoConfig::setAccessToken($this->accessToken);
        }
    }
}
