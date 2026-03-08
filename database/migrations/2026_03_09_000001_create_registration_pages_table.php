<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('registration_pages', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->unsignedBigInteger('tenant_id');
            $table->string('tenant_name');
            $table->string('tenant_logo')->nullable();
            $table->string('tenant_primary_color')->default('#6366f1');
            $table->string('tenant_industry')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('registration_pages');
    }
};
