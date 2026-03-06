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
            ->get(['id', 'name', 'price', 'description', 'family_discount_percent']);

        return response()->json($plans);
    }
}