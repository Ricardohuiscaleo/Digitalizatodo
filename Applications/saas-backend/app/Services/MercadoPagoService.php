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

    public function getPayment($paymentId)
    {
        $client = new PaymentClient();
        try {
            return $client->get($paymentId);
        } catch (MPApiException $e) {
            Log::error("Error MP getPayment: " . json_encode($e->getApiResponse()->getContent()));
            throw new Exception("No se pudo obtener el pago MP: " . $paymentId);
        }
    }

    public function getOrCreateCustomer($email, $name = 'Student')
    {
        $client = new CustomerClient();
        try {
            $searchRequest = new \MercadoPago\Net\MPSearchRequest(0, 1, ["email" => $email]);
            $search = $client->search($searchRequest);
            if (!empty($search->results)) {
                return $search->results[0];
            }

            $nameParts = explode(' ', trim($name));
            $firstName = $nameParts[0] ?? 'Student';
            $lastName = (count($nameParts) > 1) ? implode(' ', array_slice($nameParts, 1)) : '---';

            return $client->create([
                "email" => $email,
                "first_name" => $firstName,
                "last_name" => $lastName
            ]);
        } catch (Exception $e) {
            return null;
        }
    }

    public function addCardToCustomer($customerId, $cardToken)
    {
        $client = new CustomerCardClient();
        return $client->create($customerId, ["token" => $cardToken]);
    }

    public function createDirectPayment($amount, $feeAmount, $customerId, $cardId, $collectorId, $description, $externalReference, $student = null)
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
                    "email" => $student->email ?? null,
                    "first_name" => $student->name ?? null,
                ],
                "token" => null,
                "application_fee" => (float) $feeAmount,
                "additional_info" => [
                    "items" => [[
                        "id" => "fee_" . $externalReference,
                        "title" => $description,
                        "quantity" => 1,
                        "unit_price" => (float) $amount,
                        "category_id" => "others",
                    ]]
                ]
            ];

            $payment = $client->create($paymentRequest);

            if (env('MERCADOPAGO_MODE') === 'production' && $payment->live_mode === false) {
                throw new Exception("Error de seguridad: Las tarjetas de prueba no están permitidas.");
            }

            return $payment;
        } catch (MPApiException $e) {
            throw new Exception("Error al procesar cobro automático.");
        }
    }

    public function createSubscriptionPayment($data)
    {
        $client = new PaymentClient();
        try {
            $paymentRequest = [
                "transaction_amount" => (float) ($data['transaction_amount'] ?? 0),
                "token" => $data['token'] ?? null,
                "description" => $data['description'] ?? 'Pago de Cuota',
                "installments" => (int) ($data['installments'] ?? 1),
                'payment_method_id' => $data['payment_method_id'],
                'issuer_id' => $data['issuer_id'] ?? null,
                'payer' => array_merge([
                    'email' => $data['payer']['email'] ?? null,
                    'first_name' => $data['payer']['first_name'] ?? null,
                    'last_name' => $data['payer']['last_name'] ?? null,
                    'identification' => [
                        'type' => $data['payer']['identification_type'] ?? 'RUT',
                        'number' => $data['payer']['identification_number'] ?? null,
                    ],
                    'address' => [
                        'zip_code' => '8320000',
                        'street_name' => 'Alameda',
                        'street_number' => 100,
                    ],
                ], isset($data['payer']['id']) ? ['id' => $data['payer']['id']] : []),
                "external_reference" => $data['external_reference'] ?? null,
                "application_fee" => (float) ($data['application_fee'] ?? 0),
                "binary_mode" => true,
                "statement_descriptor" => "DIGITALIZA",
                "metadata" => $data['metadata'] ?? [],
                "additional_info" => [
                    "items" => [[
                        "id" => "sub_" . ($data['external_reference'] ?? '0'),
                        "title" => $data['description'] ?? 'Pago de Cuota',
                        "description" => $data['description'] ?? 'Pago de cuota mensual de servicio - ID Alumno: ' . ($data['metadata']['student_id'] ?? 'unknown'),
                        "quantity" => 1,
                        "unit_price" => (float) ($data['transaction_amount'] ?? 0),
                        "category_id" => "others",
                    ]],
                    "payer" => [
                        "first_name" => $data['payer']['first_name'] ?? null,
                        "last_name" => $data['payer']['last_name'] ?? null,
                        "phone" => [
                            "area_code" => "56", // Chile area code for improved scoring
                            "number" => (string) ($data['payer']['phone_number'] ?? null),
                        ],
                        "address" => [
                            "zip_code" => $data['payer']['address']['zip_code'] ?? "8320000",
                            "street_name" => $data['payer']['address']['street_name'] ?? "Alameda",
                            "street_number" => (int) ($data['payer']['address']['street_number'] ?? 100)
                        ],
                        "registration_date" => now()->toIso8601String(),
                    ]
                ]
            ];

            $options = new RequestOptions();
            if (isset($data['device_id'])) {
                $options->setCustomHeaders(["X-Meli-Session-Id: " . $data['device_id']]);
            }

            $payment = $client->create($paymentRequest, $options);

            // 🔍 SUPER LOG DE EVIDENCIA: Esto guardará la respuesta REAL de Mercado Pago
            Log::debug("RAW MP RESPONSE: " . json_encode($payment));

            if (env('MERCADOPAGO_MODE') === 'production' && $payment->live_mode === false) {
                throw new Exception("Error: No se permiten tarjetas de prueba en este entorno real.");
            }

            return $payment;
        } catch (MPApiException $e) {
            $content = $e->getApiResponse()->getContent();
            Log::error("Error MP Global Payment: " . json_encode($content));
            $msg = is_array($content) ? ($content['message'] ?? json_encode($content)) : $content;
            throw new Exception("MP: " . $msg);
        }
    }

    public function createOneTimePayment($title, $amount, $feePaymentId, $payerEmail, $tenantAccessToken = null)
    {
        try {
            $tokenToUse = $tenantAccessToken ?: $this->accessToken;
            MercadoPagoConfig::setAccessToken($tokenToUse);
            $client = new PreferenceClient();
            $feeAmount = ($amount * $this->platformFeePercent) / 100;
            $preferenceRequest = [
                "items" => [[
                    "title" => $title,
                    "quantity" => 1,
                    "unit_price" => (float) $amount,
                    "currency_id" => "CLP"
                ]],
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
        } catch (Exception $e) {
            throw new Exception("Error al crear preferencia de pago.");
        } finally {
            MercadoPagoConfig::setAccessToken($this->accessToken);
        }
    }
}
