<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use MercadoPago\MercadoPagoConfig;
use MercadoPago\Client\Payment\PaymentClient;

MercadoPagoConfig::setAccessToken(env('MERCADOPAGO_ACCESS_TOKEN'));
$client = new PaymentClient();

try {
    $payment = $client->get("153258761748");
    print_r([
        'status' => $payment->status,
        'payer' => $payment->payer,
        'payment_method_id' => $payment->payment_method_id,
        'card' => clone $payment->card, 
        'additional_info' => clone $payment->additional_info,
        'metadata' => clone $payment->metadata
    ]);
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage();
}
