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
        Schema::create('saas_timer_states', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
            $table->string('status')->default('idle'); // idle, running, paused, finished
            $table->integer('initial_seconds')->default(0);
            $table->integer('remaining_seconds')->default(0);
            $table->timestamp('started_at')->nullable(); // Server timestamp when started/resumed
            $table->timestamp('last_synced_at')->nullable();
            $table->timestamps();
            
            $table->unique('tenant_id'); // Solo un estado por academia
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('saas_timer_states');
    }
};
