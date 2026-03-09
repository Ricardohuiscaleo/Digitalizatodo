<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        Schema::disableForeignKeyConstraints();

        // 1. Limpiar llaves foráneas que bloquean el cambio en 'tenants'
        if (Schema::hasTable('domains')) {
            Schema::table('domains', function (Blueprint $table) {
                // Intentar soltar por nombre estándar de Laravel
                try {
                    $table->dropForeign(['tenant_id']);
                }
                catch (\Exception $e) {
                }
            });
        }
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                try {
                    $table->dropForeign(['tenant_id']);
                }
                catch (\Exception $e) {
                }
            });
        }

        // 2. Asegurar 'slug' en tenants
        if (!Schema::hasColumn('tenants', 'slug')) {
            Schema::table('tenants', function (Blueprint $table) {
                $table->string('slug')->nullable()->after('id');
            });
            DB::table('tenants')->update(['slug' => DB::raw('id')]);
        }

        // 3. Evaluar estado de 'id'
        $firstTenant = DB::table('tenants')->first();

        // Si el ID sigue siendo string, hacemos la transición
        if ($firstTenant && !is_numeric($firstTenant->id)) {

            // Agregar columna temporal para el nuevo ID (sin PK ni Autoincrement aún)
            if (!Schema::hasColumn('tenants', 'new_id')) {
                Schema::table('tenants', function (Blueprint $table) {
                    $table->unsignedBigInteger('new_id')->nullable()->first();
                });

                $i = 1;
                $tenants = DB::table('tenants')->orderBy('created_at')->get();
                foreach ($tenants as $tenant) {
                    DB::table('tenants')->where('slug', $tenant->id)->update(['new_id' => $i++]);
                }
            }

            // Actualizar todas las tablas relacionadas
            $tables = [
                'users', 'students', 'payments', 'attendances',
                'plans', 'guardians', 'enrollments',
                'registration_pages', 'domains'
            ];

            foreach ($tables as $tableName) {
                if (!Schema::hasTable($tableName))
                    continue;

                // Crear columna temporal si no existe
                if (!Schema::hasColumn($tableName, 'temp_tenant_id')) {
                    Schema::table($tableName, function (Blueprint $table) {
                        $table->unsignedBigInteger('temp_tenant_id')->nullable()->after('tenant_id');
                    });
                }

                // Mapear por slug
                DB::table($tableName)
                    ->join('tenants', $tableName . '.tenant_id', '=', 'tenants.slug')
                    ->update([$tableName . '.temp_tenant_id' => DB::raw('tenants.new_id')]);

                // Sustituir columna
                if (Schema::hasColumn($tableName, 'tenant_id')) {
                    Schema::table($tableName, function (Blueprint $table) {
                        $table->dropColumn('tenant_id');
                    });
                }

                Schema::table($tableName, function (Blueprint $table) {
                    $table->renameColumn('temp_tenant_id', 'tenant_id');
                });
            }

            // Limpiar tabla Tenants
            Schema::table('tenants', function (Blueprint $table) {
                try {
                    $table->dropPrimary();
                }
                catch (\Exception $e) {
                }
                $table->dropColumn('id');
            });

            Schema::table('tenants', function (Blueprint $table) {
                $table->renameColumn('new_id', 'id');
            });

            // Establecer como PK y Auto-increment Real
            DB::statement('ALTER TABLE tenants MODIFY id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY');

            Schema::table('tenants', function (Blueprint $table) {
                $table->string('slug')->unique()->change();
            });
        }

        // 4. Restaurar llaves foráneas
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            });
        }
        if (Schema::hasTable('domains')) {
            Schema::table('domains', function (Blueprint $table) {
                $table->foreign('tenant_id')->references('id')->on('tenants')->onUpdate('cascade')->onDelete('cascade');
            });
        }

        Schema::enableForeignKeyConstraints();
    }

    public function down(): void
    {
    // Estructural.
    }
};
