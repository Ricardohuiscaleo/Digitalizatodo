<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\MPService;
use App\Models\Tenant;
use App\Models\SaasPlan;
use Illuminate\Support\Facades\Log;

class SaaSManagementController extends Controller
{
    protected $mpService;

    public function __construct(MPService $mpService)
    {
        $this->mpService = $mpService;
    }

    /**
     * Inicia una suscripción SaaS para el tenant actual.
     */
    public function initiate(Request $request)
    {
        /** @var Tenant $tenant */
        $tenant = app('currentTenant');

        $request->validate([
            'plan_id' => 'required|exists:saas_plans,id',
            'interval' => 'required|in:monthly,yearly',
        ]);

        try {
            // 1. Actualizar el plan deseado en el tenant (esto no lo activa aún, el webhook lo hará)
            $plan = SaasPlan::findOrFail($request->plan_id);
            
            $tenant->update([
                'saas_plan_id' => $plan->id,
                'saas_plan' => $plan->slug,
                'billing_interval' => $request->interval,
                'mercadopago_terms_accepted_at' => now(),
            ]);

            // 2. Generar el Preapproval (Suscripción) en Mercado Pago
            // Nota: MPService::createPreapproval devuelve la respuesta de MP
            $mpResult = $this->mpService->createPreapproval($tenant);

            if (isset($mpResult['init_point'])) {
                return response()->json([
                    'success' => true,
                    'init_point' => $mpResult['init_point'],
                    'message' => 'Suscripción iniciada correctamente.'
                ]);
            }

            Log::error("Error registrando suscripción SaaS en MP:", $mpResult);

            return response()->json([
                'success' => false,
                'message' => 'No se pudo generar el link de pago. ' . ($mpResult['message'] ?? ''),
                'details' => $mpResult
            ], 400);

        } catch (\Exception $e) {
            Log::error("Exception en SaaSManagementController::initiate: " . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
