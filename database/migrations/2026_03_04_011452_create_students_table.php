<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id'); // slug del tenant
            $table->string('name');
            $table->string('photo')->nullable();
            $table->date('birth_date')->nullable();
            $table->enum('category', ['kids', 'adults', 'senior'])->default('adults');
            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('tenant_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};