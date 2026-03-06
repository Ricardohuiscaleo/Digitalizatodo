<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
        'id' => $p->id,
        'student' => $p->enrollment->student->name,
        'amount' => $p->amount,
        'due_date' => $p->due_date->format('Y-m-d'),
        'is_overdue' => $p->is_overdue,
        ]),
            'total_due' => $guardian->total_due,
        ]);
    }

    /**
     * Inicia un proceso de pago.
     * POST /api/{tenant}/payments/{payment}/pay
     */
    public function initiatePayment(Request $request, Payment $payment): JsonResponse
    {
        // Validar que el pago pertenezca al usuario logueado
        $guardian = $request->user();
        $allowedEnrollments = $guardian->students->flatMap->enrollments->pluck('id')->toArray();

        if (!in_array($payment->enrollment_id, $allowedEnrollments)) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $gateway = $request->input('gateway', 'mercadopago');
        $result = $this->paymentService->createPaymentRequest($payment, $gateway);

        return response()->json($result);
    }
}