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
        Schema::table('saas_timer_states', function (Blueprint $table) {
            $table->string('view')->default('clock')->after('status'); // clock, menu, timer
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('saas_timer_states', function (Blueprint $table) {
            $table->dropColumn('view');
        });
    }
};
