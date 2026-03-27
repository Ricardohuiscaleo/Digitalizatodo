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
            'saas_plan_id' => 'sometimes|numeric|exists:saas_plans,id',
            'billing_interval' => 'sometimes|string|in:monthly,yearly',
            'mp_token' => 'sometimes|string|nullable'
        ]);

        try {
            return \Illuminate\Support\Facades\DB::transaction(function () use ($validated) {
                // 1. Crear Empresa
                $tenant = Tenant::create([
                    'name' => $validated['tenant_name'],
                    'slug' => $validated['tenant_slug'],
                    'industry' => $validated['industry'],
                    'email' => $validated['email'], // Contacto empresa
                    'saas_plan_id' => $validated['saas_plan_id'] ?? null,
                    'billing_interval' => $validated['billing_interval'] ?? 'monthly',
                    'active' => false, // Pendiente de habilitación por Digitaliza Todo
                ]);

                // 2. Crear Dueño
                $user = User::create([
                    'name' => $validated['user_name'],
                    'email' => $validated['email'],
                    'password' => Hash::make($validated['password']),
                    'tenant_id' => $tenant->id,
                    'accepted_terms_at' => $validated['accepted_terms_at'],
                ]);

                // 3. Procesar suscripción en Mercado Pago si hay token
                $subscriptionMessage = "No se configuró pago automático";
                if (isset($validated['mp_token']) && $validated['mp_token']) {
                    $mpService = new \App\Services\MPService();
                    $mpResult = $mpService->createPreapproval($tenant, $validated['mp_token']);
                    
                    if (isset($mpResult['id'])) {
                        $subscriptionMessage = "Suscripción MP creada: " . $mpResult['id'];
                    } else {
                        $subscriptionMessage = "Error al crear suscripción: " . json_encode($mpResult);
                    }
                }

                // 4. Notificar por Telegram
                $msg = "<b>🚀 ¡NUEVO REGISTRO DIGITALIZA APP!</b>\n\n"
                    . "🏢 <b>Empresa:</b> {$tenant->name} ({$tenant->industry})\n"
                    . "🔗 <b>Slug:</b> {$tenant->slug}\n"
                    . "👤 <b>Dueño:</b> {$user->name}\n"
                    . "💳 <b>Plan:</b> " . ($tenant->saasPlan->name ?? 'N/A') . " ({$tenant->billing_interval})\n"
                    . "📝 <b>Estado Pago:</b> {$subscriptionMessage}\n"
                    . "📧 <b>Email:</b> {$user->email}\n\n"
                    . "⏳ <b>Estado:</b> PENDIENTE DE APROBACIÓN";

                \App\Services\TelegramService::sendMessage($msg);

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