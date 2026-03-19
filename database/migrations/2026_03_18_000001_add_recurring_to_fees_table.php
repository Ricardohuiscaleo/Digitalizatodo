<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('fees', function (Blueprint $table) {
            $table->enum('type', ['once', 'recurring'])->default('once')->after('target');
            $table->unsignedTinyInteger('recurring_day')->nullable()->after('type'); // 1-31
        });
    }

    public function down(): void
    {
        Schema::table('fees', function (Blueprint $table) {
            $table->dropColumn(['type', 'recurring_day']);
        });
    }
};
