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
            ->get(['id', 'name', 'category', 'target_audience', 'price', 'description', 'family_discount_percent', 'family_discount_min_students', 'billing_cycle', 'is_recurring', 'active']);

        return response()->json($plans);
    }

    public function store(\Illuminate\Http\Request $request): JsonResponse
    {
        $tenant = app('currentTenant');
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'nullable|string|in:dojo,vip',
            'target_audience' => 'nullable|string|in:adults,kids,all',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'billing_cycle' => 'required|string|in:monthly_fixed,monthly_from_enrollment,quarterly,semi_annual,annual',
            'is_recurring' => 'nullable|boolean',
            'family_discount_percent' => 'nullable|numeric|min:0|max:100',
            'family_discount_min_students' => 'nullable|integer|min:1',
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
            'category' => 'sometimes|string|in:dojo,vip',
            'target_audience' => 'sometimes|string|in:adults,kids,all',
            'description' => 'nullable|string',
            'price' => 'sometimes|numeric|min:0',
            'billing_cycle' => 'sometimes|string|in:monthly_fixed,monthly_from_enrollment,quarterly,semi_annual,annual',
            'is_recurring' => 'sometimes|boolean',
            'family_discount_percent' => 'sometimes|numeric|min:0|max:100',
            'family_discount_min_students' => 'sometimes|integer|min:1',
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