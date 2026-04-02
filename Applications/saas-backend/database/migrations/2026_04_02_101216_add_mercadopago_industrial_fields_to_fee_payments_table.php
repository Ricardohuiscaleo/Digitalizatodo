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
        Schema::table('fee_payments', function (Blueprint $table) {
            if (!Schema::hasColumn('fee_payments', 'payment_id')) {
                $table->string('payment_id')->nullable()->after('status');
            }
            if (!Schema::hasColumn('fee_payments', 'payment_amount')) {
                $table->decimal('payment_amount', 10, 2)->nullable()->after('payment_id');
            }
            if (!Schema::hasColumn('fee_payments', 'external_reference')) {
                $table->string('external_reference')->nullable()->after('payment_amount');
            }
            if (!Schema::hasColumn('fee_payments', 'subscription_id')) {
                $table->string('subscription_id')->nullable()->after('external_reference');
            }
            if (!Schema::hasColumn('fee_payments', 'authorized_payment_id')) {
                $table->string('authorized_payment_id')->nullable()->after('subscription_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('fee_payments', function (Blueprint $table) {
            $table->dropColumn([
                'payment_id',
                'payment_amount',
                'external_reference',
                'subscription_id',
                'authorized_payment_id'
            ]);
        });
    }
};
