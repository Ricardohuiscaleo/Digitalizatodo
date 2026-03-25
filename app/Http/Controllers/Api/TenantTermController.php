<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TenantTerm;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TenantTermController extends Controller
{
    /**
     * Display the active terms for the tenant.
     */
    public function index(Request $request)
    {
        $tenantId = $request->attributes->get('tenant_id');

        $terms = TenantTerm::where('tenant_id', $tenantId)
            ->where('active', true)
            ->orderBy('version', 'desc')
            ->first();

        return response()->json([
            'terms' => $terms
        ]);
    }

    /**
     * Store a new version of the terms.
     */
    public function store(Request $request)
    {
        $tenantId = $request->attributes->get('tenant_id');

        $request->validate([
            'content' => 'required|string',
        ]);

        return DB::transaction(function () use ($request, $tenantId) {
            // Deactivate old terms
            TenantTerm::where('tenant_id', $tenantId)->update(['active' => false]);

            $lastVersion = TenantTerm::where('tenant_id', $tenantId)->max('version') ?? 0;

            $terms = TenantTerm::create([
                'tenant_id' => $tenantId,
                'content' => $request->content,
                'active' => true,
                'version' => $lastVersion + 1,
            ]);

            return response()->json([
                'message' => 'Términos actualizados correctamente',
                'terms' => $terms
            ]);
        });
    }
}
