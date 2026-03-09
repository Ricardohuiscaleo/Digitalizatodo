<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateTenantsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up(): void
    {
        Schema::create('tenants', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique(); // "gimbox", "taekwondo-norte"

            // Información básica
            $table->string('name'); // "Gimbox Academia"
            $table->string('industry')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('logo')->nullable();
            $table->string('primary_color', 7)->default('#6366f1'); // color hex del tenant
            $table->string('address')->nullable();
            $table->string('city')->nullable();

            // SaaS billing
            $table->enum('saas_plan', ['starter', 'pro', 'business'])->default('starter');
            $table->date('saas_trial_ends_at')->nullable();
            $table->boolean('active')->default(true);

            // Datos bancarios (para que alumnos puedan transferir)
            $table->string('bank_name')->nullable();
            $table->string('bank_account_type')->nullable(); // "Cuenta Corriente", "Cuenta Vista"
            $table->string('bank_account_number')->nullable();
            $table->string('bank_account_holder')->nullable();
            $table->string('bank_rut')->nullable();
            $table->string('bank_email')->nullable(); // email para notificación de transferencia

            $table->timestamps();
            $table->json('data')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
}