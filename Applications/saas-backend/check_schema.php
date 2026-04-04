<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Schema;

$hasEmail = Schema::hasColumn('students', 'email');
echo "Students table HAS email: " . ($hasEmail ? 'YES' : 'NO') . "\n";
