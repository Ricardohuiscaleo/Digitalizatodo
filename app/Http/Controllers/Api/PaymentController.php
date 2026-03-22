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

                    // Notificar a staff que hay comprobante nuevo
                    foreach ($tenant->users as $staffUser) {
                        \App\Models\Notification::send($tenant->id, $staffUser->id, 'Comprobante recibido', "{$guardian->name} subió un comprobante de pago.", 'payment', $tenant->slug);
                    }

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
     * Delete payment proof (guardian can remove before approval).
     */
    public function deleteProof(Request $request, $tenant, Payment $payment): JsonResponse
    {
        $guardian = $request->user();
        $studentIds = $guardian->students->pluck('id');
        $isOwner = Enrollment::whereIn('student_id', $studentIds)
            ->where('id', $payment->enrollment_id)
            ->exists();

        if (!$isOwner) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        if ($payment->status === 'approved') {
            return response()->json(['message' => 'No se puede eliminar un comprobante ya aprobado.'], 422);
        }

        // Borrar de S3
        if ($payment->proof_image) {
            $path = parse_url($payment->proof_image, PHP_URL_PATH);
            if ($path) Storage::disk('s3')->delete(ltrim($path, '/'));
        }

        $payment->update(['proof_image' => null, 'status' => 'pending']);

        $tenantModel = app('currentTenant');
        event(new \App\Events\PaymentStatusUpdated($guardian->id, 'pending', $tenantModel->slug));

        // Notificar a staff
        foreach ($tenantModel->users as $staffUser) {
            \App\Models\Notification::send($tenantModel->id, $staffUser->id, 'Comprobante eliminado', "{$guardian->name} eliminó un comprobante de pago.", 'payment', $tenantModel->slug);
        }

        return response()->json(['message' => 'Comprobante eliminado', 'status' => 'pending']);
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

                // Notificar a staff
                foreach ($tenant->users as $staffUser) {
                    \App\Models\Notification::send($tenant->id, $staffUser->id, 'Comprobante recibido', "{$guardian->name} subió comprobante para {$validPayments->count()} pagos.", 'payment', $tenant->slug);
                }

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

    /**
     * Crea un pago pendiente por clases personalizadas (consumibles).
     */
    public function storeConsumable(Request $request): JsonResponse
    {
        $guardian = $request->user();
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'type' => 'required|in:pack_4,single,referral'
        ]);

        $student = $guardian->students()->find($request->student_id);
        if (!$student) {
            return response()->json(['message' => 'Alumno no encontrado o no pertenece a su tutor.'], 403);
        }

        // Precios hardcoded según requerimiento
        $prices = [
            'single' => 18000,
            'pack_4' => 65000,
            'referral' => 15000
        ];

        $amount = $prices[$request->type];

        $payment = Payment::create([
            'tenant_id' => app('currentTenant')->id,
            'student_id' => $student->id,
            'amount' => $amount,
            'type' => $request->type,
            'status' => 'pending',
            'due_date' => now()->toDateString(),
            'notes' => 'Compra de clases personalizadas: ' . $request->type
        ]);

        return response()->json([
            'message' => 'Solicitud de compra creada. Por favor suba el comprobante de transferencia.',
            'payment' => $payment
        ]);
    }
}