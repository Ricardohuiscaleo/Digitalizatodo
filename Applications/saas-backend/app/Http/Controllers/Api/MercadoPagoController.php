<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FeePayment;
use App\Models\Student;
use App\Models\Tenant;
use App\Models\Guardian;
use App\Services\MercadoPagoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class MercadoPagoController extends Controller
{
    protected $mpService;

    public function __construct(MercadoPagoService $mpService)
    {
        $this->mpService = $mpService;
    }

    public function handleWebhook(Request $request)
    {
        $data = $request->all();
        $topic = $data['type'] ?? $data['topic'] ?? null;
        $id = $data['data']['id'] ?? $data['id'] ?? null;

        Log::info("Mercado Pago Webhook Recibido: " . json_encode($data));

        if ($topic === 'payment' && $id) {
            try {
                $payment = $this->mpService->getPayment($id);
                $status = $payment->status;
                $externalReference = $payment->external_reference;

                // 🛡️ SEGURIDAD: Bloquear Webhooks de prueba en Producción
                if (env('MERCADOPAGO_MODE') === 'production' && $payment->live_mode === false) {
                    Log::warning("⚠️ Webhook Ignorado: Intento de pago Sandbox en Producción ID {$id}");
                    return response()->json(['status' => 'ignored_test'], 200);
                }

                $feePayment = null;

                if ($externalReference && str_contains($externalReference, ':')) {
                    $parts = explode(':', $externalReference);
                    if (count($parts) === 5) {
                        [$tId, $sId, $fId, $pM, $pY] = $parts;
                        $feePayment = FeePayment::where('tenant_id', $tId)
                            ->where('student_id', $sId)
                            ->where('fee_id', $fId)
                            ->where('period_month', $pM)
                            ->where('period_year', $pY)
                            ->first();
                    }
                }

                if (!$feePayment) {
                    $feePayment = FeePayment::where('payment_id', (string) $id)->first();
                }

                if ($feePayment && ($status === 'approved' || $status === 'authorized')) {
                    $feePayment->update([
                        'status' => 'paid',
                        'paid_at' => $feePayment->paid_at ?? now(),
                        'payment_method' => 'mercadopago',
                        'payment_id' => (string) $id,
                        'payment_amount' => $payment->transaction_amount,
                    ]);

                    $student = Student::find($feePayment->student_id);
                    if ($student)
                        $student->update(['status' => 'active']);

                    Log::info("Cuota {$feePayment->id} pagada vía Webhook.");
                }

                return response()->json(['status' => 'ok']);

            } catch (\Exception $e) {
                Log::error("Error Webhook: " . $e->getMessage());
                return response()->json(['error' => $e->getMessage()], 500);
            }
        }

        return response()->json(['status' => 'ok']);
    }

    public function subscribeWithCard(Request $request, $tenantSlug)
    {
        $tenant = Tenant::where('slug', $tenantSlug)->firstOrFail();
        $student = Student::findOrFail($request->student_id);
        $platformFee = ($request->amount * (float) env('MERCADOPAGO_PLATFORM_FEE', 1.81)) / 100;
        $card = null;

        try {
            DB::beginTransaction();

            $customer = $this->mpService->getOrCreateCustomer($student->email, $student->name);
            if (!$customer)
                throw new \Exception("Error al vincular cliente en Mercado Pago.");

            // ✅ CORRECCIÓN: Asignar variable $card
            $card = $this->mpService->addCardToCustomer($customer->id, $request->token);

            $guardianId = $student->guardians()->wherePivot('primary', true)->first()?->id
                ?? $student->guardians()->first()?->id;

            if (!$guardianId) {
                return response()->json(['success' => false, 'message' => "El alumno no tiene un tutor asignado."], 422);
            }

            $feePayment = FeePayment::updateOrCreate(
                ['fee_id' => $request->fee_id, 'student_id' => $student->id, 'period_month' => $request->period_month, 'period_year' => $request->period_year],
                ['tenant_id' => $tenant->id, 'guardian_id' => $guardianId, 'status' => 'pending']
            );

            $guardian = Guardian::find($guardianId);
            $payerEmail = $student->email ?? $guardian?->email ?? $request->payer_email;

            \MercadoPago\MercadoPagoConfig::setAccessToken($tenant->mercadopago_access_token);

            $payment = $this->mpService->createSubscriptionPayment([
                'transaction_amount' => (float) $request->amount,
                'token' => $request->token,
                'description' => "Cuota " . $request->period_month . "/" . $request->period_year . " - " . $student->name,
                'installments' => 1,
                'payment_method_id' => $request->payment_method_id,
                'issuer_id' => $request->issuer_id,
                'payer' => [
                    'email' => $payerEmail,
                    'id' => $customer->id,
                    'first_name' => $request->first_name ?? $student->name,
                    'last_name' => $request->last_name ?? '---',
                ],
                'device_id' => $request->device_id,
                'external_reference' => "{$tenant->id}:{$student->id}:{$request->fee_id}:{$request->period_month}:{$request->period_year}",
                'application_fee' => $platformFee,
            ]);

            \MercadoPago\MercadoPagoConfig::setAccessToken(env('MERCADOPAGO_ACCESS_TOKEN'));

            $feePayment->update(['payment_id' => (string) $payment->id]);

            if ($payment->status === 'approved' || $payment->status === 'authorized') {
                $feePayment->update([
                    'status' => 'paid',
                    'paid_at' => now(),
                    'payment_method' => 'mercadopago',
                    'payment_amount' => $request->amount,
                ]);

                $student->update([
                    'status' => 'active',
                    'mercadopago_customer_id' => $customer->id,
                    'mercadopago_card_id' => $card->id,
                    'mercadopago_last_four' => $card->last_four_digits ?? null,
                    'mercadopago_payment_method_id' => $request->payment_method_id,
                ]);

                DB::commit();
                return response()->json(['success' => true, 'status' => 'approved']);
            }

            if ($payment->status === 'in_process') {
                DB::commit();
                return response()->json([
                    'success' => true,
                    'status' => 'in_process',
                    'message' => 'Pago en revisión. Se activará automáticamente al ser aprobado.'
                ]);
            }

            throw new \Exception("Pago rechazado: " . ($payment->status_detail ?? $payment->status));

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Error Pago: " . $e->getMessage());
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function cancelAutoBilling(Request $request, $tenantSlug)
    {
        $student = Student::where('id', $request->student_id)
            ->where('tenant_id', Tenant::where('slug', $tenantSlug)->value('id'))
            ->firstOrFail();

        $student->update([
            'mercadopago_customer_id' => null,
            'mercadopago_card_id' => null,
            'mercadopago_last_four' => null,
            'mercadopago_payment_method_id' => null,
        ]);

        return response()->json(['success' => true, 'message' => 'Cobro automático desactivado.']);
    }
}
