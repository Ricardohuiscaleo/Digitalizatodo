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
            $localPlan = Plan::where('tenant_id', $tenant->id)->find($request->plan_id);
            $isProportional = false;
            if ($localPlan) {
                $planPrice = (float) $localPlan->price;
                $requestAmount = (float) $request->amount;
                $isProportional = $planPrice > 0 && abs($planPrice - $requestAmount) > 1;
            }

            $title = $isProportional ? "Pago Proporcional - " . ($localPlan->name ?? "Mensualidad") : ($localPlan->name ?? "Mensualidad");

            // Usar el access_token del dojo (OAuth) para que MP aplique marketplace_fee correctamente
            $preference = $this->mpService->createOneTimePayment(
                $title,
                $request->amount,
                $request->fee_payment_id,
                $request->email,
                $tenant->mercadopago_access_token
            );
            $initPoint = $preference->init_point;

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
            // 🔍 0. Manejar vinculación de cuenta (mp-connect)
            if ($topic === 'mp-connect' || (isset($payload['type']) && $payload['type'] === 'mp-connect')) {
                $userId = $id; // EL ID en mp-connect es el user_id de MP
                $tenant = Tenant::where('mercadopago_user_id', $userId)->first();
                if ($tenant) {
                    $tenant->update(['mercadopago_auth_status' => 'connected']);
                    Log::info("Tenant {$tenant->name} vinculado/actualizado vía webhook (mp-connect).");
                }
                return response()->json(['status' => 'ok'], 200);
            }

            // 🔍 1. Consultar detalles a Mercado Pago (según el tipo de notificación)
            $externalReference = null;
            $status = null;
            $tenant = null;

            // Determinar qué token usar para consultar el pago
            // Si viene de una academia, necesitamos su token.
            // Para simplificar, intentamos buscar el tenant por el ID de recurso si es posible, 
            // pero MP en pagos no siempre envía el collector_id en el webhook simple.
            // Usaremos el token de la plataforma por ahora para la consulta inicial si tiene permisos, 
            // o mejor, el flujo Marketplace.
            
            $accessToken = env('MERCADOPAGO_ACCESS_TOKEN');

            if ($topic === 'payment') {
                $response = Http::withToken($accessToken)
                    ->get("https://api.mercadopago.com/v1/payments/{$id}");
                
                if ($response->successful()) {
                    $paymentData = $response->json();
                    $externalReference = $paymentData['external_reference'] ?? null;
                    $status = $paymentData['status'];
                }
            } elseif ($topic === 'subscription_preapproval' || $topic === 'preapproval') {
                $response = Http::withToken($accessToken)
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

    /**
     * Procesa el primer pago y guarda la tarjeta para cobros recurrentes (Custom Engine)
     */
    public function subscribeWithCard(Request $request, $tenantSlug)
    {
        $request->validate([
            'token' => 'required|string',
            'payment_method_id' => 'required|string',
            'plan_id' => 'required',
            'student_id' => 'required',
            'email' => 'required|email',
            'amount' => 'required|numeric',
            'fee_payment_id' => 'nullable|integer'
        ]);

        $tenant = Tenant::where('slug', $tenantSlug)->firstOrFail();
        if ($tenant->mercadopago_auth_status !== 'connected' || !$tenant->mercadopago_access_token) {
            return response()->json(['success' => false, 'message' => 'Academia no vinculada'], 400);
        }

        try {
            $student = \App\Models\Student::findOrFail($request->student_id);
            $collectorId = $tenant->mercadopago_user_id;
            
            // 💰 1. Cálculo de split (1.81%)
            $feeAmount = ($request->amount * (env('MERCADOPAGO_PLATFORM_FEE', 1.81))) / 100;

            // 🏦 2. Vaulting: Buscar o Crear Cliente
            $customer = $this->mpService->getOrCreateCustomer($request->email, $student->name);
            if (!$customer) throw new \Exception("No se pudo crear el cliente en Mercado Pago");

            // 💳 3. Guardar tarjeta en MP
            $card = $this->mpService->addCardToCustomer($customer->id, $request->token);

            // 💸 4. Procesar Pago Inicial (Checkout API con Split)
            $payment = $this->mpService->createPaymentWithToken(
                $request->amount,
                $feeAmount,
                $request->email,
                $request->token,
                $request->payment_method_id,
                $collectorId,
                "Primer Pago - " . ($student->name ?? "Plan"),
                "FP_" . $request->fee_payment_id
            );

            if ($payment->status === 'approved' || $payment->status === 'authorized') {
                // ✅ 5. Actualizar Alumno con sus Tokens
                $student->update([
                    'mercadopago_customer_id' => $customer->id,
                    'mercadopago_card_id' => $card->id,
                    'mercadopago_last_four' => $card->last_four_digits,
                    'mercadopago_payment_method_id' => $request->payment_method_id,
                ]);

                // ✅ 6. Actualizar Cuota como pagada
                if ($request->fee_payment_id) {
                    $feePayment = FeePayment::find($request->fee_payment_id);
                    if ($feePayment) {
                        $feePayment->update([
                            'status' => 'paid',
                            'paid_at' => now(),
                            'payment_method' => 'mercadopago'
                        ]);
                    }
                }

                return response()->json([
                    'success' => true,
                    'status' => $payment->status,
                    'message' => 'Pago procesado y suscripción activada correctamente.'
                ]);
            }

            return response()->json([
                'success' => false,
                'status' => $payment->status,
                'message' => 'El pago fue rechazado o está pendiente: ' . $payment->status_detail
            ], 400);

        } catch (\Exception $e) {
            Log::error("Error en subscribeWithCard: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}

