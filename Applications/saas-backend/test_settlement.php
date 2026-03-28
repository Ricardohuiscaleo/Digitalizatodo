<?php
use App\Models\Guardian;
use App\Models\FeePayment;
use Illuminate\Http\Request;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$guardianId = 3;
$guardian = Guardian::find($guardianId);

if (!$guardian) {
    echo "Guardian 3 not found\n";
    exit;
}

$controller = app(App\Http\Controllers\Api\GuardianController::class);
$response = $controller->settlement(new Request(), 'dummy-tenant', $guardianId);

file_put_contents('/tmp/settlement_test.json', json_encode($response->getData(), JSON_PRETTY_PRINT));
echo "Test completed. Check /tmp/settlement_test.json\n";
