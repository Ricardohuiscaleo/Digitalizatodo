<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // En MySQL, para cambiar un ENUM debemos usar DB::statement
        DB::statement("ALTER TABLE tenants MODIFY COLUMN saas_plan ENUM('free', 'starter', 'pro', 'business') DEFAULT 'starter'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE tenants MODIFY COLUMN saas_plan ENUM('starter', 'pro', 'business') DEFAULT 'starter'");
    }
};
