<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use Illuminate\Http\JsonResponse;

class PlanController extends Controller
{
    /**
     * Lista los planes disponibles del tenant.
     * GET /api/{tenant}/plans
     */
    public function index(): JsonResponse
    {
        $tenant = app('currentTenant');
        $plans = Plan::where('tenant_id', $tenant->id)
            ->where('active', true)
            ->get(['id', 'name', 'price', 'description', 'family_discount_percent', 'billing_cycle']);

        return response()->json($plans);
    }

    public function store(\Illuminate\Http\Request $request): JsonResponse
    {
        $tenant = app('currentTenant');
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'billing_cycle' => 'required|string|in:monthly_fixed,monthly_from_enrollment,quarterly,semi_annual,annual',
        ]);

        $plan = Plan::create(array_merge($validated, ['tenant_id' => $tenant->id]));

        return response()->json($plan, 201);
    }

    public function update(\Illuminate\Http\Request $request, $tenantSlug, $id): JsonResponse
    {
        $tenant = app('currentTenant');
        $plan = Plan::where('tenant_id', $tenant->id)->findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'price' => 'sometimes|numeric|min:0',
            'billing_cycle' => 'sometimes|string|in:monthly_fixed,monthly_from_enrollment,quarterly,semi_annual,annual',
            'active' => 'sometimes|boolean',
        ]);

        $plan->update($validated);

        return response()->json($plan);
    }

    public function destroy($tenantSlug, $id): JsonResponse
    {
        $tenant = app('currentTenant');
        $plan = Plan::where('tenant_id', $tenant->id)->findOrFail($id);
        
        $plan->delete();

        return response()->json(['message' => 'Plan deleted']);
    }
}