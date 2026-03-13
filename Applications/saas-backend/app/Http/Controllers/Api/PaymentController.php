<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PaymentController extends Controller
{
    protected $paymentService;

    public function __construct(PaymentService $paymentService)
    {
        $this->paymentService = $paymentService;
    }

    /**
     * Lista los pagos pendientes del tutor/alumnos.
     * GET /api/{tenant}/payments
     */
    public function index(Request $request): JsonResponse
    {
        $guardian = $request->user();

        $payments = Payment::whereIn('enrollment_id', $guardian->students->flatMap->enrollments->pluck('id'))
            ->where('status', 'pending')
            ->with('enrollment.student')
            ->orderBy('due_date')
            ->get();

        return response()->json([
            'payments' => $payments->map(fn($p) => [
                'id'         => $p->id,
                'student'    => $p->enrollment->student->name,
                'amount'     => $p->amount,
                'due_date'   => $p->due_date->format('Y-m-d'),
                'is_overdue' => $p->is_overdue,
            ]),
            'total_due' => $guardian->total_due,
        ]);
    }

    /**
     * Sube el comprobante de transferencia para un pago.
     * POST /api/{tenant}/payments/{payment}/upload-proof
     */
    public function uploadProof(Request $request, $tenant, Payment $payment): JsonResponse
    {
        $guardian = $request->user();
        $tenant = app('currentTenant');

        // Verificar que el pago pertenezca al guardian autenticado
        $allowedEnrollments = $guardian->students->flatMap->enrollments->pluck('id')->toArray();
        if (!in_array($payment->enrollment_id, $allowedEnrollments)) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $request->validate(['proof' => 'required|image|max:12288']);

        $file = $request->file('proof');
        $ext  = $file->getClientOriginalExtension();
        $path = "digitalizatodo/{$tenant->id}/proofs/{$payment->id}.{$ext}";

        // Subir a S3
        $uploaded = Storage::disk('s3')->put($path, file_get_contents($file->getRealPath()), 'public');

        if (!$uploaded) {
            return response()->json(['message' => 'Error al subir la imagen.'], 500);
        }

        $url = "https://" . env('AWS_BUCKET', env('S3_BUCKET')) . ".s3."
             . env('AWS_DEFAULT_REGION', env('S3_REGION', 'us-east-1'))
             . ".amazonaws.com/{$path}";

        $payment->update([
            'proof_image' => $url,
            'status'      => 'pending_review',
        ]);

        return response()->json([
            'message'   => 'Comprobante subido correctamente.',
            'proof_url' => $url,
            'status'    => 'pending_review',
        ]);
    }

    /**
     * Inicia un proceso de pago (gateway).
     * POST /api/{tenant}/payments/{payment}/pay
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
}