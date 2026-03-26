<?php

use App\Models\Tenant;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$tenants = Tenant::all();
$count = 0;

foreach ($tenants as $tenant) {
    if (isset($tenant->data['pricing'])) {
        $data = $tenant->data;
        $pricing = $data['pricing'];
        
        if (isset($pricing['adult']) || isset($pricing['kids'])) {
            unset($pricing['adult'], $pricing['kids']);
            $data['pricing'] = $pricing;
            $tenant->update(['data' => $data]);
            echo "Tenant ID {$tenant->id} ({$tenant->slug}): Pricing purgado.\n";
            $count++;
        }
    }
}

echo "\n--- Limpieza terminada. Se actualizaron {$count} tenants. ---\n";
