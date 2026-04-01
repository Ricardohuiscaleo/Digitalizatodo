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
        if (Schema::hasTable('saas_plans')) {
            Schema::table('saas_plans', function (Blueprint $table) {
                if (!Schema::hasColumn('saas_plans', 'mp_plan_monthly')) {
                    $table->string('mp_plan_monthly')->nullable()->after('mercadopago_plan_id');
                }
                if (!Schema::hasColumn('saas_plans', 'mp_plan_yearly')) {
                    $table->string('mp_plan_yearly')->nullable()->after('mp_plan_monthly');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('saas_plans', function (Blueprint $table) {
            $table->dropColumn(['mp_plan_monthly', 'mp_plan_yearly']);
        });
    }
};
