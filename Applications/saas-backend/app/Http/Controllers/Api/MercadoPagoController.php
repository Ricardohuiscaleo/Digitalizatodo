<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\MercadoPagoService;
use App\Models\FeePayment;
use App\Models\Guardian;
use App\Models\Notification;
use App\Models\Tenant;
use App\Models\Plan;
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
                        'status'         => 'paid',
                        'paid_at'        => now(),
                        'payment_method' => 'mercadopago',
                        'notes'          => ($feePayment->notes ? $feePayment->notes . "\n" : "") . "MP Transaction: $id"
                    ]);
                    Log::info("Cuota Digitaliza Todo Pay actualizada con éxito: FP_{$feePaymentId}");

                    // Notificar al staff
                    $tenantObj = Tenant::find($feePayment->tenant_id);
                    if ($tenantObj) {
                        $guardian = $feePayment->guardian_id ? \App\Models\Guardian::find($feePayment->guardian_id) : null;
                        $amount = $feePayment->fee?->amount ?? 0;

                        \App\Models\User::where('tenant_id', $tenantObj->id)->each(function ($staff) use ($tenantObj, $guardian, $amount, $id) {
                            \App\Models\Notification::send(
                                $tenantObj->id,
                                $staff->id,
                                '💳 Pago MP Confirmado',
                                ($guardian ? $guardian->name : 'Un apoderado') . " pagó $" . number_format($amount, 0, ',', '.') . " vía Mercado Pago.",
                                'payment',
                                $tenantObj->slug
                            );
                        });

                        // Notificar al apoderado
                        if ($guardian) {
                            \App\Models\Notification::send(
                                $tenantObj->id,
                                $guardian->id,
                                '✅ Pago Confirmado',
                                "Tu pago de $" . number_format($amount, 0, ',', '.') . " fue confirmado por Mercado Pago.",
                                'payment',
                                $tenantObj->slug
                            );
                        }

                        // Emitir evento realtime
                        event(new \App\Events\FeeUpdated($tenantObj->slug, $feePayment->guardian_id));
                    }
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
            'fee_id' => 'nullable|integer',
            'period_month' => 'nullable|integer',
            'period_year' => 'nullable|integer',
        ]);

        $tenant = Tenant::where('slug', $tenantSlug)->firstOrFail();
        if ($tenant->mercadopago_auth_status !== 'connected' || !$tenant->mercadopago_access_token) {
            return response()->json(['success' => false, 'message' => 'Academia no vinculada'], 400);
        }

        try {
            $student = \App\Models\Student::findOrFail($request->student_id);

            // 💰 1. Split
            $feeAmount = round(($request->amount * (env('MERCADOPAGO_PLATFORM_FEE', 1.81))) / 100);

            // 🏦 2. Vaulting
            $customer = $this->mpService->getOrCreateCustomer($request->email, $student->name);
            if (!$customer) throw new \Exception("No se pudo crear el cliente en Mercado Pago");

            // 💳 3. Guardar tarjeta
            $card = $this->mpService->addCardToCustomer($customer->id, $request->token);

            // 📝 4. Crear o buscar fee_payment para este período
            $feePayment = null;
            if ($request->fee_id && $request->period_month && $request->period_year) {
                $guardian = $student->guardians()->first();
                $feePayment = FeePayment::updateOrCreate(
                    [
                        'fee_id'       => $request->fee_id,
                        'student_id'   => $student->id,
                        'period_month' => $request->period_month,
                        'period_year'  => $request->period_year,
                    ],
                    [
                        'tenant_id'   => $tenant->id,
                        'guardian_id' => $guardian?->id,
                        'status'      => 'pending',
                    ]
                );
            }

            // 💸 5. Procesar Pago con token del tenant (split correcto)
            \MercadoPago\MercadoPagoConfig::setAccessToken($tenant->mercadopago_access_token);
            $payment = $this->mpService->createPaymentWithToken(
                $request->amount,
                $feeAmount,
                $request->email,
                $request->token,
                $request->payment_method_id,
                $tenant->mercadopago_user_id,
                "Mensualidad - " . ($student->name ?? "Alumno"),
                "FP_" . ($feePayment?->id ?? 'new')
            );
            \MercadoPago\MercadoPagoConfig::setAccessToken(env('MERCADOPAGO_ACCESS_TOKEN'));

            if ($payment->status === 'approved' || $payment->status === 'authorized') {
                // ✅ 6. Guardar tarjeta en alumno
                $student->update([
                    'mercadopago_customer_id'    => $customer->id,
                    'mercadopago_card_id'        => $card->id,
                    'mercadopago_last_four'      => $card->last_four_digits,
                    'mercadopago_payment_method_id' => $request->payment_method_id,
                ]);

                // ✅ 7. Marcar cuota como pagada
                if ($feePayment) {
                    $feePayment->update([
                        'status'         => 'paid',
                        'paid_at'        => now(),
                        'payment_method' => 'mercadopago',
                        'notes'          => 'MP ID: ' . $payment->id,
                    ]);
                }

                // ✅ 8. Notificar al staff
                $guardian = $student->guardians()->first();
                \App\Models\User::where('tenant_id', $tenant->id)->each(function ($staff) use ($tenant, $student, $guardian, $request, $payment) {
                    \App\Models\Notification::send(
                        $tenant->id,
                        $staff->id,
                        '💳 Pago con Tarjeta Aprobado',
                        "{$student->name} pagó $" . number_format($request->amount, 0, ',', '.') . " con tarjeta (MP). Cobro automático activado.",
                        'payment',
                        $tenant->slug
                    );
                });

                // ✅ 9. Notificar al apoderado
                if ($guardian) {
                    \App\Models\Notification::send(
                        $tenant->id,
                        $guardian->id,
                        '✅ Pago Aprobado',
                        "Tu pago de $" . number_format($request->amount, 0, ',', '.') . " fue aprobado. El cobro automático está activo para los próximos meses.",
                        'payment',
                        $tenant->slug
                    );
                }

                // ✅ 10. Emitir evento realtime
                event(new \App\Events\FeeUpdated($tenant->slug, $guardian?->id));

                return response()->json([
                    'success' => true,
                    'status' => $payment->status,
                    'message' => 'Pago procesado y suscripción activada correctamente.'
                ]);
            }

            // ❌ Pago rechazado — notificar al apoderado
            $guardian = $student->guardians()->first();
            if ($guardian) {
                \App\Models\Notification::send(
                    $tenant->id,
                    $guardian->id,
                    '❌ Pago Rechazado',
                    "Tu pago de $" . number_format($request->amount, 0, ',', '.') . " fue rechazado. Verifica los datos de tu tarjeta e intenta nuevamente.",
                    'payment',
                    $tenant->slug
                );
            }

            // 🚀 10. Respuesta final amigable
            if ($payment->status !== 'approved') {
                $friendlyMessages = [
                    'cc_rejected_insufficient_amount' => 'Tu tarjeta no tiene saldo suficiente.',
                    'cc_rejected_bad_filled_security_code' => 'El código de seguridad (CVV) es incorrecto.',
                    'cc_rejected_bad_filled_date' => 'La fecha de vencimiento es incorrecta.',
                    'cc_rejected_call_for_authorize' => 'Debes autorizar el pago con tu banco.',
                    'cc_rejected_card_disabled' => 'Tu tarjeta está desactivada o bloqueada.',
                    'cc_rejected_invalid_installments' => 'Tu tarjeta no permite pagos en 1 cuota.',
                    'cc_rejected_duplicated_payment' => 'Ya hiciste un pago idéntico recientemente.',
                    'cc_rejected_high_risk' => 'El pago fue rechazado por seguridad (Riesgo alto).',
                    'pending_review_manual' => 'Estamos procesando tu pago. Mercado Pago lo está revisando por seguridad.',
                    'pending_contingency' => 'Estamos procesando tu pago. Te avisaremos en breve.',
                ];

                $errorMessage = $friendlyMessages[$payment->status_detail] ?? 'El pago fue rechazado por tu banco (' . $payment->status_detail . ').';

                return response()->json([
                    'success' => false,
                    'status' => $payment->status,
                    'message' => $errorMessage
                ], 400);
            }

        } catch (\Exception $e) {
            Log::error("Error en subscribeWithCard: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}

