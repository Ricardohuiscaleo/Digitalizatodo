<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\MercadoPagoService;
use App\Models\FeePayment;
use App\Models\Tenant;
use App\Models\Plan; // 🥋 Importamos Plan para validar precios
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class MercadoPagoController extends Controller
{
    protected $mpService;

    public function __construct(MercadoPagoService $mpService)
    {
        $this->mpService = $mpService;
    }

    /**
     * Inicia el flujo de pago para un alumno (Suscripción o Pago Único)
     */
    public function initiateSubscription(Request $request, $tenantSlug)
    {
        $request->validate([
            'plan_id' => 'required',
            'student_id' => 'required',
            'email' => 'required|email',
            'amount' => 'required|numeric',
            'fee_payment_id' => 'nullable|integer' // 🛡️ ID para rastreo
        ]);

        // 🛡️ SEGURIDAD: Bloquear si la academia no ha vinculado sus datos
        $tenant = Tenant::where('slug', $tenantSlug)->firstOrFail();
        if ($tenant->mercadopago_auth_status !== 'connected' || !$tenant->mercadopago_access_token) {
            return response()->json([
                'success' => false,
                'message' => 'Esta academia aún no ha configurado Digitalizatodo Pay. Por favor, contacta al administrador del Dojo.'
            ], 400);
        }

        try {
            // 🔍 1. Buscar el Plan en la base de datos local
            $localPlan = Plan::where('tenant_id', $tenant->id)->find($request->plan_id);
            $planPrice = $localPlan ? (float) $localPlan->price : 0;
            $requestAmount = (float) $request->amount;

            // 🕵️‍♂️ DETECTOR DE PROPORCIONAL: 
            // Si el monto a pagar no coincide con el precio del plan, es un prorrateo.
            // En ese caso, forzamos un Pago Único para no crear una suscripción errónea.
            $isProportional = $planPrice > 0 && abs($planPrice - $requestAmount) > 1;
            
            // Si el plan_id enviado es un string largo de MP, es suscripción.
            $isMPPlan = strlen($request->plan_id) > 10;

            if ($isMPPlan && !$isProportional) {
                // 🔄 Flujo Suscripción Clásico (Solo si el monto es el completo del plan)
                $subscription = $this->mpService->createSubscription(
                    $request->email,
                    $request->plan_id, 
                    $request->amount,
                    $request->fee_payment_id
                );
                $initPoint = $subscription->init_point;
            } else {
                // ⚡ Flujo de Pago Único (Para Clases Sueltas O Pagos Proporcionales)
                $title = $isProportional ? "Pago Proporcional - " . ($localPlan->name ?? "Mensualidad") : "Pago Digitaliza Todo Pay";
                
                $preference = $this->mpService->createOneTimePayment(
                    $title,
                    $request->amount,
                    $request->fee_payment_id,
                    $request->email
                );
                $initPoint = $preference->init_point;
            }

            return response()->json([
                'success' => true,
                'init_point' => $initPoint,
                'is_proportional' => $isProportional
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
        $topic = $request->query('topic') ?? $request->input('type') ?? null;
        $id = $request->query('id') ?? $request->input('data.id') ?? null;

        Log::info("Mercado Pago Webhook:", ['topic' => $topic, 'id' => $id]);

        if (!$id || !$topic) {
            return response()->json(['status' => 'error', 'message' => 'Missing data'], 400);
        }

        try {
            // 🔍 1. Consultar detalles a Mercado Pago (según el tipo de notificación)
            $externalReference = null;
            $status = null;

            if ($topic === 'payment') {
                $response = Http::withToken(env('MERCADOPAGO_ACCESS_TOKEN'))
                    ->get("https://api.mercadopago.com/v1/payments/{$id}");
                
                if ($response->successful()) {
                    $paymentData = $response->json();
                    $externalReference = $paymentData['external_reference'] ?? null;
                    $status = $paymentData['status'];
                }
            } elseif ($topic === 'subscription_preapproval' || $topic === 'preapproval') {
                $response = Http::withToken(env('MERCADOPAGO_ACCESS_TOKEN'))
                    ->get("https://api.mercadopago.com/preapproval/{$id}");
                
                if ($response->successful()) {
                    $subData = $response->json();
                    $externalReference = $subData['external_reference'] ?? null;
                    $status = $subData['status'];
                }
            }

            // 🛡️ 2. Si tenemos la referencia, actualizamos la base de datos local
            if ($externalReference && strpos($externalReference, 'FP_') === 0) {
                $feePaymentId = str_replace('FP_', '', $externalReference);
                $feePayment = FeePayment::find($feePaymentId);

                if ($feePayment && ($status === 'approved' || $status === 'authorized')) {
                    $feePayment->update([
                        'status' => 'paid', // 🟢 MARCAR COMO PAGADO
                        'paid_at' => now(),
                        'payment_method' => 'mercadopago',
                        'notes' => ($feePayment->notes ? $feePayment->notes . "\n" : "") . "MP Transaction: $id"
                    ]);
                    Log::info("Cuota Digitaliza Todo Pay actualizada con éxito: FP_{$feePaymentId}");
                }
            }

            return response()->json(['status' => 'ok'], 200);

        } catch (\Exception $e) {
            Log::error("Error procesando Webhook MP: " . $e->getMessage());
            return response()->json(['status' => 'error'], 500);
        }
    }
}
