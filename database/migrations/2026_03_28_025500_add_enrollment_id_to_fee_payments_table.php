<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('fee_payments', function (Blueprint $table) {
            $table->foreignId('enrollment_id')->nullable()->after('student_id')->constrained()->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('fee_payments', function (Blueprint $table) {
            $table->dropForeign(['enrollment_id']);
            $table->dropColumn('enrollment_id');
        });
    }
};
