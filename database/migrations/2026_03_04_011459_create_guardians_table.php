<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('guardians', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('password')->nullable(); // para login portal alumno
            $table->string('remember_token', 100)->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('tenant_id');
            $table->unique(['tenant_id', 'email']);
        });

        // Tabla pivote guardian <-> student
        Schema::create('guardian_student', function (Blueprint $table) {
            $table->id();
            $table->foreignId('guardian_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->boolean('primary')->default(false); // apoderado principal
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('guardian_student');
        Schema::dropIfExists('guardians');
    }
};