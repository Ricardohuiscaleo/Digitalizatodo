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
        $tenant = app('currentTenant');

        $terms = TenantTerm::where('tenant_id', $tenant->id)
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
        $tenant = app('currentTenant');

        $request->validate([
            'content' => 'required|string',
        ]);

        return DB::transaction(function () use ($request, $tenant) {
            // Deactivate old terms
            TenantTerm::where('tenant_id', $tenant->id)->update(['active' => false]);

            $lastVersion = TenantTerm::where('tenant_id', $tenant->id)->max('version') ?: 0;
            $nextVersion = $lastVersion + 1;
            $contentHash = hash('sha256', $tenant->id . $request->content . $nextVersion);

            $terms = TenantTerm::create([
                'tenant_id' => $tenant->id,
                'content' => $request->content,
                'active' => true,
                'version' => $nextVersion,
                'hash' => $contentHash,
            ]);

            return response()->json([
                'message' => 'Términos actualizados correctamente',
                'terms' => $terms
            ]);
        });
    }
}
