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

    public function initiateSubscription(Request $request, $tenantSlug)
    {
        // Lógica existente...
    }

    public function handleWebhook(Request $request)
    {
        $data = $request->all();
        $topic = $data['type'] ?? $data['topic'] ?? null;
        $id = $data['data']['id'] ?? $data['id'] ?? null;

        Log::info("Mercado Pago Webhook: " . json_encode($data));

        if ($topic === 'payment' && $id) {
            try {
                $payment = $this->mpService->getPayment($id);
                $status = $payment->status;
                $externalReference = $payment->external_reference;

                Log::info("Procesando pago webhook ID {$id} | Status: {$status} | Ref: {$externalReference}");

                // 🔍 AUTO-RESCATE: Si no hay registro previo, lo creamos desde la referencia externa
                if ($externalReference && str_contains($externalReference, ':')) {
                    $parts = explode(':', $externalReference);
                    if (count($parts) === 5) {
                        $tId = $parts[0];
                        $sId = $parts[1];
                        $fId = $parts[2];
                        $pM = $parts[3];
                        $pY = $parts[4];

                        $feePayment = FeePayment::updateOrCreate(
                            [
                                'tenant_id' => $tId,
                                'student_id' => $sId,
                                'fee_id' => $fId,
                                'period_month' => $pM,
                                'period_year' => $pY
                            ],
                            ['payment_id' => $id]
                        );

                        if ($status === 'approved') {
                            $feePayment->update([
                                'status' => 'paid',
                                'payment_method' => 'mercadopago',
                                'paid_at' => now(),
                            ]);

                            // Activar alumno
                            $student = Student::find($sId);
                            if ($student) {
                                $student->update(['status' => 'active']);
                            }
                            
                            Log::info("Pago y Alumno {$sId} activados vía Auto-Rescate Webhook.");
                        }
                    }
                }
                
                return response()->json(['status' => 'ok'], 200);

            } catch (\Exception $e) {
                Log::error("Error procesando webhook: " . $e->getMessage());
                return response()->json(['error' => $e->getMessage()], 500);
            }
        }

        return response()->json(['status' => 'ok'], 200);
    }

    public function subscribeWithCard(Request $request, $tenantSlug)
    {
        $tenant = Tenant::where('slug', $tenantSlug)->firstOrFail();
        $student = Student::findOrFail($request->student_id);

        try {
            DB::beginTransaction();

            // Lógica de cliente y tarjeta...
            $customer = $this->mpService->getOrCreateCustomer($student->email, $student->name);
            
            if (!$customer) {
                 return response()->json(['success' => false, 'message' => 'No se pudo vincular el cliente en Mercado Pago.'], 500);
            }

            $this->mpService->addCardToCustomer($customer->id, $request->token);

            // Crear registro de pago PENDIENTE
            $feePayment = FeePayment::updateOrCreate(
                [
                    'fee_id' => $request->fee_id,
                    'student_id' => $student->id,
                    'period_month' => $request->period_month,
                    'period_year' => $request->period_year,
                ],
                [
                    'tenant_id' => $tenant->id,
                    'status' => 'pending',
                ]
            );

            // 🛡️ INDUSTRIAL: Incluir device_id, payer.id e items detallados para calidad 73+
            $payment = $this->mpService->createSubscriptionPayment([
                'transaction_amount' => (float)$request->amount,
                'token' => $request->token,
                'description' => "Pago de Cuota - " . $student->name,
                'installments' => 1,
                'payment_method_id' => $request->payment_method_id,
                'issuer_id' => $request->issuer_id, // ✅ CALIDAD 73+
                'payer' => [
                    'email' => $student->email,
                    'id'    => $customer->id,  // ✅ OBLIGATORIO para calidad 73+
                    'first_name' => $request->first_name, // ✅ CALIDAD 73+
                    'last_name'  => $request->last_name,  // ✅ CALIDAD 73+
                ],
                'device_id' => $request->device_id, // ✅ SEGURIDAD para pagos reales
                'items' => [
                    [
                        'id' => $request->fee_id,
                        'title' => "Cuota Mensual - " . $student->name,
                        'description' => "Pago de mensualidad industrializada para el Alumno " . $student->id,
                        'category_id' => 'services',
                        'quantity' => 1,
                        'unit_price' => (float)$request->amount
                    ]
                ],
                'external_reference' => "{$tenant->id}:{$student->id}:{$request->fee_id}:{$request->period_month}:{$request->period_year}"
            ]);

            $feePayment->update(['payment_id' => $payment->id]);

            if ($payment->status === 'approved') {
                $feePayment->update(['status' => 'paid', 'paid_at' => now()]);
                $student->update(['status' => 'active']);
                DB::commit();
                return response()->json(['success' => true, 'message' => 'Pago aprobado.']);
            }

            if ($payment->status === 'in_process') {
                // ✅ RESCATE: Guardamos el registro aunque esté en revisión
                DB::commit(); 
                return response()->json([
                    'success' => true,
                    'status' => 'in_process',
                    'message' => 'Estamos procesando tu pago. Ricardo se activará en cuanto MP apruebe la revisión.'
                ], 200); // 200 OK — NO BLOQUEAMOS NADA
            }

            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Pago rechazado.'], 400);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Error: " . $e->getMessage());
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
