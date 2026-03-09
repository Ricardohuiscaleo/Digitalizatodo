<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->string('name'); // ej: "Mensualidad Kids", "Mensualidad Adultos"
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2); // precio en CLP
            $table->enum('billing_cycle', ['monthly_fixed', 'monthly_from_enrollment'])->default('monthly_fixed');
            $table->integer('billing_day')->nullable(); // si es fixed: día del mes (1-28)
            $table->decimal('family_discount_percent', 5, 2)->default(0); // ej: 15.00
            $table->integer('family_discount_min_students')->default(2); // mínimo de alumnos para el descuento
            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('tenant_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};