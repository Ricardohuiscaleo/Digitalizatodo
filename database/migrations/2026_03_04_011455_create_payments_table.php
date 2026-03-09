<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->foreignId('enrollment_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 10, 2);
            $table->date('due_date'); // fecha de vencimiento
            $table->date('paid_at')->nullable(); // fecha de pago efectivo
            $table->enum('status', ['pending', 'proof_uploaded', 'approved', 'rejected', 'overdue'])->default('pending');
            $table->enum('payment_method', ['transfer', 'webpay', 'mercadopago', 'cash', 'other'])->nullable();
            $table->string('proof_image')->nullable(); // foto del comprobante
            $table->text('rejection_reason')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete(); // admin que aprobó
            $table->string('transaction_id')->nullable(); // ID de pasarela de pago
            $table->json('gateway_response')->nullable(); // respuesta raw de la pasarela
            $table->timestamps();
            $table->softDeletes();

            $table->index('tenant_id');
            $table->index(['enrollment_id', 'status']);
            $table->index('due_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};