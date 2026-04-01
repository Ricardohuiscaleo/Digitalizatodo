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
            // 1. Obtener datos del plan
            $plan = SaasPlan::findOrFail($request->plan_id);
            
            // Actualizar intención preliminar del tenant
            $tenant->update([
                'saas_plan_id' => $plan->id,
                'saas_plan' => $plan->slug,
                'billing_interval' => $request->interval,
                'mercadopago_terms_accepted_at' => now(),
            ]);

            // CASO 1: Plan Gratuito ($0) -> Activar YA
            $isFreePlan = ($request->interval === 'yearly' && $plan->price_yearly <= 0) || 
                          ($request->interval === 'monthly' && $plan->price_monthly <= 0);

            if ($isFreePlan) {
                $tenant->update(['active' => true]);
                return response()->json([
                    'success' => true,
                    'is_free' => true,
                    'message' => 'Plan gratuito activado automáticamente.'
                ]);
            }

            // CASO 2: Plan de Pago -> Validar o Crear Plan en Mercado Pago
            $mpPlanId = ($request->interval === 'yearly') ? $plan->mp_plan_yearly : $plan->mp_plan_monthly;
            if (!$mpPlanId) {
                $mpPlanId = $plan->mercadopago_plan_id;
            }

            // ¡AUTOMATIZACIÓN! Si no hay ID en la DB, lo creamos en MP ahora mismo
            if (!$mpPlanId) {
                Log::info("SaaS: Plan '{$plan->name}' no existe en MP. Creándolo automáticamente...");
                $newPlanResult = $this->mpService->createPreapprovalPlan($plan, ($request->interval === 'yearly' ? 'years' : 'months'));
                
                if (isset($newPlanResult['id'])) {
                    $mpPlanId = $newPlanResult['id'];
                    // Guardar el nuevo ID en la DB para la próxima vez
                    $columnToUpdate = ($request->interval === 'yearly') ? 'mp_plan_yearly' : 'mp_plan_monthly';
                    $plan->update([$columnToUpdate => $mpPlanId]);
                    Log::info("SaaS: Plan creado exitosamente con ID: {$mpPlanId}");
                } else {
                    return response()->json([
                        'success' => false,
                        'message' => 'No se pudo crear el plan en Mercado Pago de forma automática.',
                        'details' => $newPlanResult
                    ], 400);
                }
            }

            // 2. Generar la Suscripción (Preapproval) final
            $mpResult = $this->mpService->createPreapproval($tenant);

            if (isset($mpResult['init_point'])) {
                return response()->json([
                    'success' => true,
                    'init_point' => $mpResult['init_point'],
                    'message' => 'Suscripción iniciada correctamente.'
                ]);
            }

            Log::error("SaaS: Falló suscripción en MP p/ Tenant {$tenant->id}:", $mpResult);
            return response()->json([
                'success' => false,
                'message' => 'Error al conectar con la pasarela de pago.',
                'details' => $mpResult
            ], 400);

        } catch (\Exception $e) {
            Log::error("Exception en SaaSManagementController::initiate: " . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
