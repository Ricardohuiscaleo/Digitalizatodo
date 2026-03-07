<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guardian;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TenantDiscoveryController extends Controller
{
    /**
     * Identifica los tenants asociados a un correo electrónico.
     * POST /api/identify-tenant
     */
    public function identify(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $email = $request->email;

        // 1. Buscar Guardianes
        $guardianTenants = \App\Models\Guardian::with('tenant')
            ->where('email', $email)
            ->where('active', true)
            ->get()
            ->map(fn($g) => $g->tenant);

        // 2. Buscar Staff/Owners (User)
        // Se elimina la restricción whereNotNull('tenant_id') para permitir la identificación de SuperAdmins.
        $userTenants = \App\Models\User::with('tenant')
            ->where('email', $email)
            ->get()
            ->map(fn($u) => $u->tenant);

        // Combinar y filtrar nulos/inactivos
        $allTenants = $guardianTenants->concat($userTenants)
            ->filter(fn($t) => $t && $t->active)
            ->unique('id')
            ->values();

        if ($allTenants->isEmpty()) {
            return response()->json([
                'found' => false,
                'message' => 'No se encontraron academias asociadas a este correo.',
            ], 404);
        }

        $tenants = $allTenants->map(fn($t) => [
        'id' => $t->id,
        'name' => $t->name,
        'industry' => $t->industry,
        'logo' => $t->logo ?\Illuminate\Support\Facades\Storage::disk('public')->url($t->logo) : '/icon.webp',
        'primary_color' => $t->primary_color ?? '#f59e0b',
        ]);

        return response()->json([
            'found' => true,
            'tenants' => $tenants,
        ]);
    }

    /**
     * Retorna información pública del tenant (branding).
     * GET /api/{tenant}/info
     */
    public function show(): JsonResponse
    {
        /** @var \App\Models\Tenant $tenant */
        $tenant = app('currentTenant');

        if (!$tenant || !$tenant->active) {
            return response()->json(['message' => 'Academia no encontrada o inactiva.'], 404);
        }

        return response()->json([
            'id' => $tenant->id,
            'name' => $tenant->name,
            'industry' => $tenant->industry,
            'logo' => $tenant->logo ?\Illuminate\Support\Facades\Storage::disk('public')->url($tenant->logo) : '/icon.webp',
            'primary_color' => $tenant->primary_color ?? '#f59e0b',
        ]);
    }
}