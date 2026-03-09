<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        Schema::disableForeignKeyConstraints();

        // 1. Asegurar columna 'slug'
        if (!Schema::hasColumn('tenants', 'slug')) {
            Schema::table('tenants', function (Blueprint $table) {
                $table->string('slug')->nullable()->after('id');
            });
            DB::table('tenants')->update(['slug' => DB::raw('id')]);
        }

        // 2. Manejar el cambio de ID a numérico
        // Si 'id' sigue siendo string (ej: 'integracao'), procedemos a la cirugía
        $firstTenant = DB::table('tenants')->first();
        if ($firstTenant && !is_numeric($firstTenant->id)) {

            // Creamos una columna temporal para el nuevo ID
            if (!Schema::hasColumn('tenants', 'new_id')) {
                Schema::table('tenants', function (Blueprint $table) {
                    $table->unsignedBigInteger('new_id')->nullable()->first();
                });

                // Poblar new_id manualmente
                $i = 1;
                $tenants = DB::table('tenants')->orderBy('created_at')->get();
                foreach ($tenants as $tenant) {
                    DB::table('tenants')->where('slug', $tenant->id)->update(['new_id' => $i++]);
                }
            }

            // 3. Actualizar tablas relacionadas
            $tables = [
                'users', 'students', 'payments', 'attendances',
                'plans', 'guardians', 'enrollments',
                'registration_pages', 'domains'
            ];

            foreach ($tables as $tableName) {
                if (!Schema::hasTable($tableName))
                    continue;

                if (!Schema::hasColumn($tableName, 'temp_tenant_id')) {
                    Schema::table($tableName, function (Blueprint $table) {
                        $table->unsignedBigInteger('temp_tenant_id')->nullable()->after('tenant_id');
                    });
                }

                // Mapear viejo ID de texto al nuevo ID numérico
                DB::table($tableName)
                    ->join('tenants', $tableName . '.tenant_id', '=', 'tenants.slug')
                    ->update([$tableName . '.temp_tenant_id' => DB::raw('tenants.new_id')]);

                // Reemplazar columna
                if (Schema::hasColumn($tableName, 'tenant_id')) {
                    Schema::table($tableName, function (Blueprint $table) {
                        $table->dropColumn('tenant_id');
                    });
                }

                Schema::table($tableName, function (Blueprint $table) {
                    $table->renameColumn('temp_tenant_id', 'tenant_id');
                });
            }

            // 4. Finalizar tabla TENANTS
            Schema::table('tenants', function (Blueprint $table) {
                // En MySQL, para cambiar la PK, a veces es mejor soltarla por nombre
                // o simplemente soltarla si es la única primaria definida.
                $table->dropPrimary();
                $table->dropColumn('id');
            });

            Schema::table('tenants', function (Blueprint $table) {
                $table->renameColumn('new_id', 'id');
            });

            // Convertir 'id' en autoincremental y primaria
            DB::statement('ALTER TABLE tenants MODIFY id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY');

            Schema::table('tenants', function (Blueprint $table) {
                $table->string('slug')->unique()->change();
            });
        }

        Schema::enableForeignKeyConstraints();
    }

    public function down(): void
    {
    // Operación destructiva y estructural. No hay rollback automático seguro.
    }
};
