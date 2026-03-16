<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('app_updates', function (Blueprint $table) {
            $table->id();
            $table->string('version');          // "1.4.0"
            $table->string('title');            // "Asistencia en tiempo real"
            $table->text('description');        // Markdown o texto plano
            $table->enum('target', ['all', 'staff', 'student'])->default('all');
            $table->timestamp('published_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('app_updates');
    }
};
