<?php

namespace App\Services;

use App\Models\Payment;
use Illuminate\Support\Facades\Http;

class PaymentService
{
    /**
     * Crea una solicitud de pago (Preferencia en MercadoPago o Transacción en Webpay)
     * Por ahora implementamos un "Mock" que simula la respuesta exitosa.
     */
    public function createPaymentRequest(Payment $payment, string $gateway = 'mercadopago')
    {
        // En el futuro aquí llamaremos a las SDKs reales usando las llaves del .env

        $mockUrl = "https://www.google.com/search?q=simulated+payment+gateway+for+" . $payment->id;

        return [
            'payment_url' => $mockUrl,
            'transaction_id' => 'MOCK-' . uniqid(),
            'gateway' => $gateway,
        ];
    }

    /**
     * Maneja el retorno del gateway (Webhook / Callback)
     */
    public function handleCallback(array $data, string $gateway)
    {
    // Lógica para marcar como pagado, enviar notificaciones, etc.
    }
}