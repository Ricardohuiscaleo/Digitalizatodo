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
            'tenant_slug' => 'required|string|max:50|unique:tenants,id',
            'industry' => 'required|string|max:50',
            'user_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:8|confirmed',
        ]);

        // Crear Empresa
        $tenant = Tenant::create([
            'id' => $validated['tenant_slug'], // Slug es el ID en nuestro caso
            'name' => $validated['tenant_name'],
            'industry' => $validated['industry'],
            'email' => $validated['email'], // Contacto empresa
            'saas_plan' => 'free',
            'active' => true,
        ]);

        // Crear Dueño
        $user = User::create([
            'name' => $validated['user_name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'tenant_id' => $tenant->id,
        ]);

        // Notificar por Telegram
        $msg = "<b>🚀 ¡NUEVO REGISTRO DE EMPRESA!</b>\n\n"
            . "🏢 <b>Empresa:</b> {$tenant->name} ({$tenant->industry})\n"
            . "🔗 <b>Slug:</b> {$tenant->id}\n"
            . "👤 <b>Dueño:</b> {$user->name}\n"
            . "📧 <b>Email:</b> {$user->email}\n\n"
            . "📱 <a href='https://app.digitalizatodo.cl/{$tenant->id}'>Abrir App de Gestión</a>\n"
            . "🌍 <a href='https://admin.digitalizatodo.cl/{$tenant->id}'>Ver Panel admin.digitalizatodo.cl</a>";

        TelegramService::sendMessage($msg);

        return response()->json([
            'message' => '¡Empresa registrada con éxito!',
            'tenant' => $tenant,
            'user' => $user,
            'admin_url' => "https://admin.digitalizatodo.cl/{$tenant->id}",
            'instructions' => 'Ya puedes ingresar a tu panel de administración privado y comenzar a configurar tu negocio.'
        ], 201);
 