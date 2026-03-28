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
        // 1. Columnas técnicas para alumnos de Artes Marciales
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

        // 2. Columna de ciclo de facturación para Cuotas (Fees)
        Schema::table('fees', function (Blueprint $table) {
            if (!Schema::hasColumn('fees', 'billing_cycle')) {
                $table->string('billing_cycle')->nullable()->default('monthly_fixed')->after('type');
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

        Schema::table('fees', function (Blueprint $table) {
            $table->dropColumn('billing_cycle');
        });
    }
};
