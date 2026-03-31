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
        Schema::table('tenants', function (Blueprint $table) {
            $table->string('mercadopago_access_token')->nullable()->after('id');
            $table->string('mercadopago_refresh_token')->nullable()->after('mercadopago_access_token');
            $table->string('mercadopago_user_id')->nullable()->after('mercadopago_refresh_token');
            $table->string('mercadopago_auth_status')->default('disconnected')->after('mercadopago_user_id');
            $table->timestamp('mercadopago_terms_accepted_at')->nullable()->after('mercadopago_auth_status');
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn([
                'mercadopago_access_token',
                'mercadopago_refresh_token',
                'mercadopago_user_id',
                'mercadopago_auth_status',
                'mercadopago_terms_accepted_at'
            ]);
        });
    }
};
