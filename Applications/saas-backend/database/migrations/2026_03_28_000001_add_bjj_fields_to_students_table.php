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
        Schema::table('students', function (Blueprint $table) {
            if (!Schema::hasColumn('students', 'gender')) {
                $table->string('gender')->nullable()->after('belt_rank');
            }
            if (!Schema::hasColumn('students', 'weight')) {
                $table->decimal('weight', 5, 2)->nullable()->after('gender');
            }
            if (!Schema::hasColumn('students', 'height')) {
                $table->integer('height')->nullable()->after('weight');
            }
            if (!Schema::hasColumn('students', 'degrees')) {
                $table->integer('degrees')->default(0)->after('height');
            }
            if (!Schema::hasColumn('students', 'modality')) {
                $table->string('modality')->nullable()->after('degrees');
            }
            if (!Schema::hasColumn('students', 'previous_classes')) {
                $table->integer('previous_classes')->default(0)->after('modality');
            }
            if (!Schema::hasColumn('students', 'belt_classes_at_promotion')) {
                $table->integer('belt_classes_at_promotion')->default(0)->after('previous_classes');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn([
                'gender', 'weight', 'height', 'degrees', 'modality', 'previous_classes', 'belt_classes_at_promotion'
            ]);
        });
    }
};
