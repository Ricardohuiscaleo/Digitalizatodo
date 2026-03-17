<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('app_updates')->insert([
            'version' => '1.5.0',
            'title' => 'Sincronización de Notificaciones',
            'description' => "### Mejoras en Notificaciones PWA\n\n- **Sincronización en tiempo real**: Las notificaciones ahora aparecen instantáneamente en el panel superior sin necesidad de reiniciar la app.\n- **Corrección de contador**: El globo del icono de la app (Badge) ahora se mantiene sincronizado correctamente con las notificaciones no leídas.\n- **Gestión de lectura**: Corregido error que impedía marcar todas las notificaciones como leídas en algunos dispositivos.",
            'target' => 'all',
            'published_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        DB::table('app_updates')->where('version', '1.5.0')->delete();
    }
};
