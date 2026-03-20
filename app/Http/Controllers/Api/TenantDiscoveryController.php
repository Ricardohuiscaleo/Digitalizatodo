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

        \Log::info("Identifying tenant for email: [{$email}]");

        // 1. Buscar Guardianes
        $guardianTenants = \App\Models\Guardian::with('tenant')
            ->where('email', trim($email))
            ->get();
            
        \Log::info("Found " . $guardianTenants->count() . " guardian records.");

        // 2. Buscar Staff/Owners (User) — via tenant_user (multi-tenant)
        $users = \App\Models\User::with(['tenantUsers.tenant'])
            ->where('email', trim($email))
            ->get();

        \Log::info("Found " . $users->count() . " user records.");

        // Extraer tenants y prepararlos
        $allTenantsMap = [];

        foreach ($guardianTenants as $g) {
            if ($g->tenant) {
                $tid = $g->tenant->id;
                if (!isset($allTenantsMap[$tid])) {
                    $allTenantsMap[$tid] = ['tenant' => $g->tenant, 'roles' => []];
                }
                $allTenantsMap[$tid]['roles'][] = 'guardian';
            }
        }

        foreach ($users as $u) {
            foreach ($u->tenantUsers as $tu) {
                if ($tu->tenant && $tu->tenant->active) {
                    $tid = $tu->tenant->id;
                    if (!isset($allTenantsMap[$tid])) {
                        $allTenantsMap[$tid] = ['tenant' => $tu->tenant, 'roles' => []];
                    }
                    if (!in_array('staff', $allTenantsMap[$tid]['roles'])) {
                        $allTenantsMap[$tid]['roles'][] = 'staff';
                    }
                }
            }
        }

        if (empty($allTenantsMap)) {
            return response()->json([
                'found' => false,
                'message' => 'No se encontraron academias asociadas a este correo.',
            ], 200);
        }

        $tenants = collect(array_values($allTenantsMap))->map(function ($data) {
            $t = $data['tenant'];
            return [
            'id' => $t->id,
            'slug' => $t->slug,
            'name' => $t->name,
            'industry' => $t->industry,
            'logo' => $t->logo ? (str_starts_with($t->logo, 'http') ? $t->logo : \Illuminate\Support\Facades\Storage::disk('public')->url($t->logo)) : '/icon.webp',
            'primary_color' => $t->primary_color ?? '#f59e0b',
            'detected_roles' => $data['roles']
            ];
        });

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
            'slug' => $tenant->slug,
            'name' => $tenant->name,
            'industry' => $tenant->industry,
            'logo' => $tenant->logo ? (str_starts_with($tenant->logo, 'http') ? $tenant->logo : \Illuminate\Support\Facades\Storage::disk('public')->url($tenant->logo)) : '/icon.webp',
            'primary_color' => $tenant->primary_color ?? '#f59e0b',
        ]);
    }
}