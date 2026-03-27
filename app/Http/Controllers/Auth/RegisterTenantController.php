<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use App\Services\TelegramService;

class RegisterTenantController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'tenant_name' => 'required|string|max:255',
            'tenant_slug' => 'required|string|max:50|unique:tenants,slug',
            'industry' => 'required|string|max:50',
            'user_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:8|confirmed',
            'accepted_terms_at' => 'required|date',
        ]);

        try {
            return \Illuminate\Support\Facades\DB::transaction(function () use ($validated) {
                // 1. Crear Empresa
                $tenant = Tenant::create([
                    'name' => $validated['tenant_name'],
                    'slug' => $validated['tenant_slug'],
                    'industry' => $validated['industry'],
                    'email' => $validated['email'], // Contacto empresa
                    'saas_plan' => 'starter',
                    'active' => false, // Pendiente de habilitación por Digitaliza Todo
                ]);

                // 2. Crear Dueño
                $user = User::create([
                    'name' => $validated['user_name'],
                    'email' => $validated['email'],
                    'password' => Hash::make($validated['password']),
                    'tenant_id' => $tenant->id,
                    // Si existe la columna la guardará, si no, se ignorará (Laravel no falla si no está en fillable, pero falla si está en fillable y no en DB)
                    // Como el modelo tiene el campo en fillable, fallará si no hay columna.
                    // Si tienes problemas, corre: php artisan migrate
                    'accepted_terms_at' => $validated['accepted_terms_at'],
                ]);

                // 3. Notificar por Telegram
                $msg = "<b>🚀 ¡SOLICITUD DE NUEVA EMPRESA!</b>\n\n"
                    . "🏢 <b>Empresa:</b> {$tenant->name} ({$tenant->industry})\n"
                    . "🔗 <b>Slug:</b> {$tenant->slug}\n"
                    . "👤 <b>Dueño:</b> {$user->name}\n"
                    . "📧 <b>Email:</b> {$user->email}\n\n"
                    . "⏳ <b>Estado:</b> PENDIENTE DE APROBACIÓN\n\n"
                    . "📱 <a href='https://app.digitalizatodo.cl/{$tenant->slug}'>Abrir App de Gestión</a>\n"
                    . "🌍 <a href='https://admin.digitalizatodo.cl/{$tenant->slug}'>Ver Panel admin.digitalizatodo.cl</a>";

                TelegramService::sendMessage($msg);

                return response()->json([
                    'status' => 'success',
                    'message' => '¡Solicitud recibida con éxito!',
                    'tenant' => $tenant,
                    'user' => $user,
                    'is_pending' => true,
                    'instructions' => 'Tu solicitud está siendo revisada por el equipo de Digitaliza Todo. Te notificaremos por email una vez que tu panel esté activo.'
                ], 201);
            });
        } catch (\Exception $e) {
            \Log::error("Error en Registro de Tenant: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al procesar el registro: ' . $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTrace() : null
            ], 500);
        }
    }
}