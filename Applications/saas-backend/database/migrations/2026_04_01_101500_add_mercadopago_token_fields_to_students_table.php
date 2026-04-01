<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('students', function (Blueprint $col) {
            $col->string('mercadopago_customer_id')->nullable()->after('active');
            $col->string('mercadopago_card_id')->nullable()->after('mercadopago_customer_id');
            $col->string('mercadopago_last_four', 4)->nullable()->after('mercadopago_card_id');
            $col->string('mercadopago_payment_method_id')->nullable()->after('mercadopago_last_four');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $col) {
            $col->dropColumn([
                'mercadopago_customer_id',
                'mercadopago_card_id',
                'mercadopago_last_four',
                'mercadopago_payment_method_id'
            ]);
        });
    }
};
