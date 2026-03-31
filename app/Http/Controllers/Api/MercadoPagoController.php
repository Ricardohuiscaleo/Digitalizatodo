<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\MercadoPagoService;
use App\Models\FeePayment;
use App\Models\Tenant;
use Illuminate\Support\Facades\Log;

class MercadoPagoController extends Controller
{
    protected $mpService;

    public function __construct(MercadoPagoService $mpService)
    {
        $this->mpService = $mpService;
    }

    /**
     * Inicia el proceso de suscripción para un alumno
     */
    public function initiateSubscription(Request $request, $tenantSlug)
    {
        $request->validate([
            'plan_id' => 'required',
            'student_id' => 'required',
            'email' => 'required|email',
            'amount' => 'required|numeric'
        ]);

        try {
            // 1. Obtener o crear el Plan en Mercado Pago si no existe (opcional)
            // Aquí podríamos buscar si el plan local ya tiene un mp_plan_id
            
            // 2. Crear la suscripción (Preapproval)
            $subscription = $this->mpService->createSubscription(
                $request->email,
                $request->plan_id, // ID del plan en MP
                $request->amount
            );

            return response()->json([
                'success' => true,
                'init_point' => $subscription->init_point, // URL para redirigir al alumno
                'subscription_id' => $subscription->id
            ]);

        } catch (\Exception $e) {
            Log::error("Error en initiateSubscription: " . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Recibe notificaciones (Webhooks) de Mercado Pago
     */
    public function handleWebhook(Request $request)
    {
        $payload = $request->all();
        Log::info("Mercado Pago Webhook Received", $payload);

        // Lógica de procesamiento de notificación
        // 1. Identificar el tipo de evento (subscription_preapproval, payment, etc.)
        // 2. Si el pago es exitoso, buscar la cuota correspondiente y marcar como PAGADA.
        
        $topic = $request->query('topic') ?? $payload['type'] ?? null;
        $id = $request->query('id') ?? $payload['data']['id'] ?? null;

        if ($topic === 'subscription_preapproval') {
            // Manejar cobro recurrente automático
            // Actualizar status en base de datos
        }

        return response()->json(['status' => 'ok'], 200);
    }
}
