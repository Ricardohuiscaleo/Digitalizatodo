<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_terms', function (Blueprint $blueprint) {
            $blueprint->id();
            $blueprint->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $blueprint->longText('content')->nullable();
            $blueprint->boolean('active')->default(true);
            $blueprint->integer('version')->default(1);
            $blueprint->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_terms');
    }
};
