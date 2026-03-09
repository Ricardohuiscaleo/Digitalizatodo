<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // 1. Desactivar checks de llaves foráneas para poder maniobrar
        Schema::disableForeignKeyConstraints();

        // 2. Preparar tabla TENANTS
        Schema::table('tenants', function (Blueprint $table) {
            // Agregar slug temporalmente
            $table->string('slug')->nullable()->after('id');
        });

        // Copiar id actual (texto) al nuevo campo slug
        DB::table('tenants')->update(['slug' => DB::raw('id')]);

        // Cambiar la llave primaria: Esto es delicado en SQL
        // Agregamos el nuevo ID numérico
        Schema::table('tenants', function (Blueprint $table) {
            $table->bigIncrements('new_id')->first();
        });

        // 3. Actualizar tablas relacionadas
        $tables = [
            'users',
            'students',
            'payments',
            'attendances',
            'plans',
            'guardians',
            'enrollments',
            'registration_pages',
            'domains'
        ];

        foreach ($tables as $tableName) {
            if (!Schema::hasTable($tableName))
                continue;

            Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                $table->unsignedBigInteger('temp_tenant_id')->nullable()->after('tenant_id');
            });

            // Mapear el viejo tenant_id (texto) al nuevo ID numérico
            DB::table($tableName)
                ->join('tenants', $tableName . '.tenant_id', '=', 'tenants.slug')
                ->update([$tableName . '.temp_tenant_id' => DB::raw('tenants.new_id')]);

            Schema::table($tableName, function (Blueprint $table) {
                $table->dropColumn('tenant_id');
            });

            Schema::table($tableName, function (Blueprint $table) {
                $table->renameColumn('temp_tenant_id', 'tenant_id');
            });

        // Re-aplicar restricción de no nulo si es necesario
        // DB::statement("ALTER TABLE $tableName MODIFY tenant_id BIGINT UNSIGNED NOT NULL");
        }

        // 4. Limpieza final de tabla TENANTS
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropPrimary(['id']);
            $table->dropColumn('id');
        });

        Schema::table('tenants', function (Blueprint $table) {
            $table->renameColumn('new_id', 'id');
            $table->primary('id');
            $table->string('slug')->unique()->change();
        });

        Schema::enableForeignKeyConstraints();
    }

    public function down(): void
    {
    // El rollback de esto sería extremadamente complejo y arriesgado.
    // En este punto, el cambio es estructural y definitivo.
    }
};
