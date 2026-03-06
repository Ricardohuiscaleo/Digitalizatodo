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

        $guardians = Guardian::with('tenant')
            ->where('email', $request->email)
            ->where('active', true)
            ->get();

        if ($guardians->isEmpty()) {
            return response()->json([
                'found' => false,
                'message' => 'No se encontraron academias asociadas a este correo.',
            ], 404);
        }

        $tenants = $guardians->map(fn($g) => [
        'id' => $g->tenant->id,
        'name' => $g->tenant->name,
        'industry' => $g->tenant->industry,
        'logo' => $g->tenant->logo_url ?? '/icon.webp', // Asumimos logo_url o fallback
        'primary_color' => $g->tenant->primary_color ?? '#f59e0b',
        ])->unique('id')->values();

        return response()->json([
            'found' => true,
            'tenants' => $tenants,
        ]);
    }
}