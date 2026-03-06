<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('enrollments', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('plan_id')->constrained()->cascadeOnDelete();
            $table->date('start_date');
            $table->date('end_date')->nullable(); // null = activo
            $table->decimal('custom_price', 10, 2)->nullable(); // override precio del plan
            $table->decimal('discount_applied', 5, 2)->default(0); // % descuento aplicado
            $table->string('discount_reason')->nullable();
            $table->enum('status', ['active', 'paused', 'cancelled'])->default('active');
            $table->timestamps();
            $table->softDeletes();

            $table->index('tenant_id');
            $table->index('student_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('enrollments');
    }
};