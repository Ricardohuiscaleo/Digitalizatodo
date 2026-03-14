<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Enrollment;
use App\Services\PaymentService;
use App\Services\ImageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    protected $paymentService;
    protected $imageService;

    public function __construct(PaymentService $paymentService, ImageService $imageService)
    {
        $this->paymentService = $paymentService;
        $this->imageService = $imageService;
    }

    /**
     * Lista los pagos pendientes del tutor/alumnos.
     */
    public function index(Request $request): JsonResponse
    {
        $guardian = $request->user();
        
        $studentIds = $guardian->students->pluck('id');
        $enrollmentIds = Enrollment::whereIn('student_id', $studentIds)->pluck('id');

        $payments = Payment::whereIn('enrollment_id', $enrollmentIds)
            ->where('status', 'pending')
            ->orderBy('due_date', 'asc')
            ->get();

        return response()->json([
            'payments' => $payments,
            'total_due' => $payments->sum('amount')
        ]);
    }

    /**
     * Upload payment proof.
     */
    public function uploadProof(Request $request, $tenant, Payment $payment): JsonResponse
    {
        $guardian = $request->user();
        
        // Verificar que el pago pertenece a un alumno del apoderado
        $studentIds = $guardian->students->pluck('id');
        $isOwner = Enrollment::whereIn('student_id', $studentIds)
            ->where('id', $payment->enrollment_id)
            ->exists();

        if (!$isOwner) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        // Aceptamos archivos hasta 50MB para ser procesados
        $request->validate(['proof' => 'required|image|max:51200']);

        if ($request->hasFile('proof')) {
            $file = $request->file('proof');
            $tenant = app('currentTenant');
            $tenantId = $tenant->id;

            try {
                // Optimizar y convertir a WebP
                $optimizedPath = $this->imageService->optimize($file);
                
                $filename = "proof_{$payment->id}_" . time() . ".webp";
                $s3Path = "tenants/{$tenantId}/payments/{$filename}";

                // Subir a S3 el archivo optimizado
                $uploaded = Storage::disk('s3')->put($s3Path, file_get_contents($optimizedPath));
                unlink($optimizedPath);

                if ($uploaded) {
                    $url = Storage::disk('s3')->url($s3Path);

                    $payment->update([
                        'proof_image' => $url,
                        'status' => 'pending_review'
                    ]);

                    event(new \App\Events\PaymentStatusUpdated($guardian->id, 'pending_review', $tenant->slug));

                    return response()->json([
                        'message' => 'Comprobante optimizado y subido correctamente.',
                        'proof_url' => $url,
                        'status' => 'pending_review'
                    ]);
                }

                return response()->json(['error' => 'Error al guardar en el almacenamiento'], 500);

            } catch (\Exception $e) {
                return response()->json(['error' => 'Error al procesar el comprobante: ' . $e->getMessage()], 500);
            }
        }

        return response()->json(['error' => 'No se recibió ningún archivo'], 400);
    }

    /**
     * Inicia un proceso de pago (gateway).
     */
    public function initiatePayment(Request $request, $tenant, Payment $payment): JsonResponse
    {
        $guardian = $request->user();
        $allowedEnrollments = $guardian->students->flatMap->enrollments->pluck('id')->toArray();

        if (!in_array($payment->enrollment_id, $allowedEnrollments)) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $gateway = $request->input('gateway', 'mercadopago');
        $result  = $this->paymentService->createPaymentRequest($payment, $gateway);

        return response()->json($result);
    }

    /**
     * Bulk Upload Payment Proof.
     */
    public function bulkUploadProof(Request $request): JsonResponse
    {
        $guardian = $request->user();
        $request->validate([
            'payment_ids' => 'required|array',
            'payment_ids.*' => 'exists:payments,id',
            'proof' => 'required|image|max:51200'
        ]);

        $paymentIds = $request->input('payment_ids');
        $studentIds = $guardian->students->pluck('id');
        
        $validPayments = Payment::whereIn('id', $paymentIds)
            ->whereIn('enrollment_id', function($q) use ($studentIds) {
                $q->select('id')->from('enrollments')->whereIn('student_id', $studentIds);
            })->get();

        if ($validPayments->count() !== count($paymentIds)) {
            return response()->json(['message' => 'Uno o más pagos no son válidos.'], 403);
        }

        if ($request->hasFile('proof')) {
            try {
                $file = $request->file('proof');
                $tenant = app('currentTenant');
                $optimizedPath = $this->imageService->optimize($file);
                
                $filename = "bulk_proof_" . time() . "_" . Str::random(5) . ".webp";
                $s3Path = "tenants/{$tenant->id}/payments/{$filename}";
                
                Storage::disk('s3')->put($s3Path, file_get_contents($optimizedPath));
                unlink($optimizedPath);

                $url = Storage::disk('s3')->url($s3Path);

                foreach ($validPayments as $payment) {
                    $payment->update([
                        'proof_image' => $url,
                        'status' => 'pending_review'
                    ]);
                }

                event(new \App\Events\PaymentStatusUpdated($guardian->id, 'pending_review', $tenant->slug));

                return response()->json([
                    'message' => 'Comprobante subido y aplicado a ' . $validPayments->count() . ' pagos.',
                    'proof_url' => $url
                ]);
            } catch (\Exception $e) {
                return response()->json(['error' => $e->getMessage()], 500);
            }
        }

        return response()->json(['error' => 'No se recibió archivo'], 400);
    }
}