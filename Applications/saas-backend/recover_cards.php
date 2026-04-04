<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\FeePayment;
use App\Models\Student;
use App\Services\MercadoPagoService;
use MercadoPago\Client\Payment\PaymentClient;
use MercadoPago\Client\Customer\CustomerClient;
use MercadoPago\MercadoPagoConfig;

MercadoPagoConfig::setAccessToken(env('MERCADOPAGO_ACCESS_TOKEN'));

$client = new PaymentClient();
$customerClient = new CustomerClient();

// IDs of Juan (48), Gabriela (49), Lucas (51), Mateo (29)
$students = Student::whereIn('id', [29, 48, 49, 51])->get();

foreach ($students as $student) {
    echo "Revisando estudiante ID: {$student->id} - {$student->name}\n";
    $email = $student->email;
    if (!$email) {
        $primaryGuardian = $student->guardians()->first();
        if ($primaryGuardian) $email = $primaryGuardian->email;
    }
    
    if (!$email) {
        echo "  -> Sin email para buscar en MP.\n";
        continue;
    }

    try {
        $searchRequest = new \MercadoPago\Net\MPSearchRequest(0, 1, ["email" => $email]);
        $search = $customerClient->search($searchRequest);
        
        if (!empty($search->results)) {
            $customer = $search->results[0];
            echo "  -> Customer encontrado! ID: {$customer->id}\n";
            
            if (!empty($customer->cards)) {
                echo "  -> ¡Tarjetas encontradas: " . count($customer->cards) . "!\n";
                foreach ($customer->cards as $c) {
                    echo "     - Tarjeta: {$c->id} | Últimos 4: {$c->last_four_digits} | Método: {$c->payment_method->id}\n";
                }
            } else {
                echo "  -> Customer no tiene tarjetas guardadas.\n";
            }
        } else {
            echo "  -> No se encontró Customer en MP con el email {$email}.\n";
        }
    } catch (\Exception $e) {
        echo "  -> Error buscando en MP: " . $e->getMessage() . "\n";
    }
    echo "--------------------------\n";
}
