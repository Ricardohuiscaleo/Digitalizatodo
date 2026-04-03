<?php

namespace App\Http\Controllers\Api;

use App\Events\FeeUpdated;
use App\Http\Controllers\Controller;
use App\Models\Guardian;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Carbon\Carbon;

class GuardianController extends Controller
{
    protected $imageService;

    public function __construct(\App\Services\ImageService $imageService)
    {
        $this->imageService = $imageService;
    }

    /**
     * List all guardians (Payers) grouped by account status.
     */
    public function index(Request $request)
    {
        $tenant = app('currentTenant');
        $tenantId = $tenant->id;

        $month = $request->query('month');
        $year = $request->query('year');
        $requestedMonth = (int) ($month ?? \Carbon\Carbon::now('America/Santiago')->month);
        $requestedYear = (int) ($year ?? \Carbon\Carbon::now('America/Santiago')->year);
        $isHistory = $request->query('history') === 'true';
        $referenceDate = Carbon::create($requestedYear, $requestedMonth, 1)->startOfMonth();

        $guardians = Guardian::where('tenant_id', $tenantId)
            ->with(['students.enrollments.plan', 'students.enrollments.payments' => function ($query) use ($tenantId, $requestedMonth, $requestedYear, $isHistory) {
                $query->where('tenant_id', $tenantId);
                
                if ($isHistory && $requestedMonth && $requestedYear) {
                    $query->whereMonth('due_date', $requestedMonth)
                          ->whereYear('due_date', $requestedYear);
                } else {
                    // Traer pending/review/overdue + el último paid (antes approved) por enrollment
                    $query->whereIn('status', ['pending', 'pending_review', 'overdue', 'paid', 'approved'])
                          ->orderBy('due_date', 'desc');
                }
            }])
            ->get()
            ->map(function ($guardian) use ($tenantId, $isHistory, $requestedMonth, $requestedYear, $referenceDate) {
            // Calculate status based on payments of their students
            $students = $guardian->students;
            $status = 'paid';
            $tenant = app('currentTenant'); // Usar singleton

            // Para martial_arts: el status se basa en fee_payments del mes solicitado
            $hasFeeSystem = \App\Models\FeePayment::whereIn('student_id', $students->pluck('id'))
                ->exists();

            if ($hasFeeSystem) {
                $paidThisMonth = \App\Models\FeePayment::whereIn('student_id', $students->pluck('id'))
                    ->where('period_month', $requestedMonth)
                    ->where('period_year', $requestedYear)
                    ->where('status', 'paid')
                    ->exists();
                $reviewThisMonth = \App\Models\FeePayment::whereIn('student_id', $students->pluck('id'))
                    ->where('period_month', $requestedMonth)
                    ->where('period_year', $requestedYear)
                    ->where('status', 'review')
                    ->exists();

                if ($reviewThisMonth) $status = 'review';
                elseif (!$paidThisMonth) $status = 'pending';
            }
            
            $pricing = $tenant?->data['pricing'] ?? [
                'cat1_name' => 'Infantil',
                'cat1_price' => 35000,
                'cat2_name' => 'Adulto',
                'cat2_price' => 45000,
                'discount_threshold' => 2,
                'discount_percentage' => 15
            ];

            $s3BaseUrl = 'https://' . config('services.s3.bucket', 'digitalizatodo') . '.s3.' . config('services.s3.region', 'us-east-1') . '.amazonaws.com/';

            $activePeriods = [];
            $tempPayments = [];

            // Recolectamos FeePayments (Prioridad Alta)
            $feePayments = \App\Models\FeePayment::whereIn("student_id", $students->pluck("id"))
                ->where('tenant_id', $tenantId)
                ->with(['fee', 'student', 'student.enrollments.plan'])
                ->get();

            foreach ($feePayments as $fp) {
                if (!$fp->student) continue; // Blindaje Null
                
                $pStatus = $fp->status === 'review' ? 'review' : $fp->status;

                // Obtener el plan real del alumno desde enrollment (fuente de verdad)
                $activeEnrollment = $fp->student->enrollments->where('status', 'active')->first();
                $realPlanName = $activeEnrollment?->plan?->name ?? ($fp->student->enrollments->first()?->plan?->name ?? 'Sin plan');
                $planBillingCycle = $activeEnrollment?->plan?->billing_cycle ?? 'monthly_from_enrollment';

                // Prioridad de amount:
                // 1. payment_amount: lo que el alumno REALMENTE pagó (corregido en DB)
                // 2. Precio del plan activo del alumno (fuente de verdad de cuánto debería pagar)
                // 3. fee->amount: fallback
                $enrollmentPrice = (float)($activeEnrollment?->custom_price ?? $activeEnrollment?->plan?->price ?? 0);
                $amount = (float)($fp->payment_amount ?? ($enrollmentPrice > 0 ? $enrollmentPrice : $fp->fee?->amount) ?? 0);

                // Marcar el período activo del fee
                $pKey = $fp->student_id . '_' . $fp->period_month . '_' . $fp->period_year;
                $activePeriods[$pKey] = true;

                // Si el fee cubre múltiples meses (trimestral, semestral, anual),
                // marcar todos los meses cubiertos para suprimir pagos legacy duplicados
                $monthsCovered = match($planBillingCycle) {
                    'quarterly'    => 3,
                    'semi_annual'  => 6,
                    'annual'       => 12,
                    default        => 1,
                };
                if ($monthsCovered > 1 && $fp->period_month && $fp->period_year) {
                    $baseDate = Carbon::create($fp->period_year, $fp->period_month, 1);
                    for ($m = 1; $m < $monthsCovered; $m++) {
                        $nextDate = $baseDate->copy()->addMonths($m);
                        $activePeriods[$fp->student_id . '_' . $nextDate->month . '_' . $nextDate->year] = true;
                    }
                }

                $tempPayments[] = [
                    'id' => 'fp_' . $fp->id,
                    'is_fee' => true,
                    'student_id' => $fp->student_id,
                    'student_name' => $fp->student->name ?? 'Alumno',
                    'student_photo' => $fp->student->photo ? (str_starts_with($fp->student->photo, 'http') ? $fp->student->photo : $s3BaseUrl . $fp->student->photo) : "https://i.pravatar.cc/150?u=" . $fp->student_id,
                    'amount' => $amount,
                    'status' => $pStatus,
                    'due_date' => $fp->period_month ? Carbon::create($fp->period_year, $fp->period_month, 1)->format('d M, Y') : null,
                    'raw_due_date' => $fp->period_month ? Carbon::create($fp->period_year, $fp->period_month, 1) : null,
                    'proof_url' => $fp->proof_url,
                    'plan_name' => $realPlanName,
                    'belt_rank' => $fp->student->belt_rank ?? 'Blanco',
                    'degrees' => (int)($fp->student->degrees ?? 0),
                    'category' => $fp->student->category ?? 'adults'
                ];
            }

            // Recolectamos Payments Legados (Prioridad Baja)
            foreach ($students as $student) {
                foreach ($student->enrollments as $enrollment) {
                    $hasAddedPaid = false;
                    foreach ($enrollment->payments as $payment) {
                        $pMonth = $payment->due_date ? $payment->due_date->month : null;
                        $pYear = $payment->due_date ? $payment->due_date->year : null;
                        $pKey = $student->id . '_' . $pMonth . '_' . $pYear;

                        $isSpecial = in_array($payment->type, ['plan_upgrade', 'pack_4', 'single', 'referral']);
                        if (isset($activePeriods[$pKey]) && !$isSpecial) {
                            continue;
                        }

                        $normalizedStatus = $payment->status;
                        if ($payment->status === 'paid' || $payment->status === 'approved') {
                            $normalizedStatus = 'paid';
                            if ($hasAddedPaid && !$isHistory) continue;
                            $hasAddedPaid = true;
                        } elseif ($payment->status === 'pending_review') {
                            $normalizedStatus = 'review';
                        }

                        $tempPayments[] = [
                            'id' => 'p_' . $payment->id,
                            'is_fee' => false,
                            'student_id' => $student->id,
                            'student_name' => $student->name,
                            'student_photo' => $student->photo ? (str_starts_with($student->photo, 'http') ? $student->photo : $s3BaseUrl . $student->photo) : "https://i.pravatar.cc/150?u=" . $student->id,
                            'amount' => (float)$payment->amount,
                            'status' => $normalizedStatus,
                            'due_date' => $payment->due_date?->format('d M, Y'),
                            'raw_due_date' => $payment->due_date,
                            'proof_url' => $payment->proof_image ? (str_starts_with($payment->proof_image, 'http') ? $payment->proof_image : $s3BaseUrl . $payment->proof_image) : null,
                            'belt_rank' => $student->belt_rank ?? 'Blanco',
                            'degrees' => (int)($student->degrees ?? 0),
                            'plan_name' => $payment?->plan?->name ?? $enrollment?->plan?->name ?? 'Sin plan',
                            'category' => $student->category ?? 'adults'
                        ];
                    }
                }
            }

            $activePayments = $tempPayments;
            $hasPending = false;
            $hasReview = false;
            $hasPaidCurrent = false;

            foreach ($activePayments as $p) {
                if ($p['status'] === 'review') $hasReview = true;
                if ($p['status'] === 'pending' || $p['status'] === 'overdue') $hasPending = true;
                
                if ($p['status'] === 'paid') {
                    $dueDate = $p['raw_due_date'] ?? null;
                    if ($dueDate && $dueDate->greaterThanOrEqualTo($referenceDate)) {
                        $hasPaidCurrent = true;
                    }
                }
            }

            if ($hasReview) $status = 'review';
            elseif ($hasPending) $status = 'pending';
            elseif ($hasPaidCurrent) $status = 'paid';
            else $status = 'pending'; 

            $totalDue = $hasPending ? array_sum(array_column(array_filter($activePayments, fn($p) => $p['status'] === 'pending' || $p['status'] === 'overdue'), 'amount')) : 0;

            if ($status === 'pending' && $totalDue <= 0) {
                foreach ($students as $s) {
                    $hasMonthPaid = false;
                    foreach ($activePayments as $p) {
                        $dueDate = $p['raw_due_date'] ?? null;
                        if ($p['status'] === 'paid' && $dueDate && $dueDate->greaterThanOrEqualTo($referenceDate)) {
                            $hasMonthPaid = true;
                            break;
                        }
                    }

                    if (!$hasMonthPaid) {
                        $enrollment = $s->enrollments?->where('status', 'active')->first() ?? $s->enrollments?->first();
                        $totalDue += (float)($enrollment?->plan?->price ?? 0);
                    }
                }
            }

            return [
                'id' => $guardian->id,
                'name' => $guardian->name,
                'photo' => $guardian->photo ? (str_starts_with($guardian->photo, 'http') ? $guardian->photo : $s3BaseUrl . $guardian->photo) : "https://i.pravatar.cc/150?u=" . $guardian->id,
                'status' => $status,
                'total_due' => round($totalDue),
                'payments' => $activePayments,
                'pricing' => $pricing,
                'enrolledStudents' => $students->map(function ($s) use ($s3BaseUrl) {
                    $activeEnrollment = $s->enrollments?->where('status', 'active')->first() ?? $s->enrollments?->first();
                    return [
                        'id' => $s->id,
                        'name' => $s->name,
                        'category' => $s->category,
                        'belt_rank' => $s->belt_rank ?? 'Blanco',
                        'degrees' => (int)($s->degrees ?? 0),
                        'photo' => $s->photo ? (str_starts_with($s->photo, 'http') ? $s->photo : $s3BaseUrl . $s->photo) : "https://i.pravatar.cc/150?u=" . $s->id,
                        'today_status' => $s->attendances()->where('date', \Carbon\Carbon::now('America/Santiago')->toDateString())->where('status', 'present')->exists() ? 'present' : 'absent',
                        'plan_name' => $activeEnrollment?->plan?->name ?? 'Sin plan',
                        'amount' => (float)($activeEnrollment?->plan?->price ?? 0),
                        'payment_status' => (function() use ($s) {
                            $now = \Carbon\Carbon::now('America/Santiago');
                            $hasOverdue = $s->enrollments->contains(function($e) use ($now) {
                                return $e->payments->contains(function($p) use ($now) {
                                    return in_array($p->status, ['pending', 'overdue']) && $p->due_date && $p->due_date->isPast();
                                });
                            });
                            
                            $hasPendingReview = $s->enrollments->contains(function($e) {
                                return $e->payments->contains(function($p) {
                                    return in_array($p->status, ['pending_review', 'proof_uploaded']);
                                });
                            });
                            
                            if ($hasOverdue) return 'overdue';
                            if ($hasPendingReview) return 'pending';
                            return 'paid';
                        })()
                    ];
                })
            ];
        });

        return response()->json(['payers' => $guardians]);
    }

    /**
     * Approve a pending payment review or mark as paid manually.
     */
    public function approvePayment($tenantSlug, $id, Request $request)
    {
        try {
            $tenant = app('currentTenant');
            
            Log::debug("[DEBUG-APPROVE] Iniciando aprobación de pago", [
                'tenant_id' => $tenant->id,
                'guardian_id' => $id
            ]);

            // Intentar encontrar el guardian bajo el tenant actual
            $guardian = Guardian::where('tenant_id', $tenant->id)->find($id);

            if (!$guardian) {
                // Búsqueda permisiva global por ID si falla la búsqueda por tenant
                $guardian = Guardian::find($id);

                if (!$guardian) {
                    return response()->json(['message' => 'No se encontró el apoderado especificado.'], 404);
                }

                Log::info("[DEBUG-APPROVE] Guardian encontrado globalmente tras fallo por tenant", [
                    'db_tenant_id' => $guardian->tenant_id,
                    'active_tenant_id' => $tenant->id
                ]);
                
                // Corregimos el tenant del apoderado de inmediato
                $guardian->update(['tenant_id' => $tenant->id]);
            }

            $now = Carbon::now('America/Santiago');
            $month = $request->input('month', $now->month);
            $year = $request->input('year', $now->year);
            $method = $request->input('payment_method', 'cash');
            $notes = $request->input('notes', 'Aprobado manualmente por Staff');

            // Validar que el método de pago sea compatible con el ENUM de fee_payments
            // enum('transfer','cash','mercadopago')
            if (!in_array($method, ['transfer', 'cash', 'mercadopago'])) {
                $method = 'cash'; // Fallback seguro
            }

            // Buscar la cuota mensual estándar
            $fee = \App\Models\Fee::where('tenant_id', $tenant->id)
                ->where('billing_cycle', 'monthly_fixed')
                ->first() ?: \App\Models\Fee::where('tenant_id', $tenant->id)->first();

            if (!$fee) {
                return response()->json(['message' => 'No hay cuotas configuradas para este gimnasio.'], 422);
            }

            foreach ($guardian->students as $student) {
                // 1. FeePayment (SaaS)
                \App\Models\FeePayment::updateOrCreate(
                    [
                        'guardian_id'  => $guardian->id,
                        'student_id'   => $student->id,
                        'period_month' => $month,
                        'period_year'  => $year,
                    ],
                    [
                        'tenant_id'      => $tenant->id,
                        'fee_id'         => $fee->id,
                        'status'         => 'paid',
                        'payment_method' => $method,
                        'paid_at'        => $now,
                        'approved_by'    => $request->user()?->id,
                        'notes'          => $notes,
                    ]
                );

                // 2. Payment (Artes Marciales)
                \App\Models\Payment::where('student_id', $student->id)
                    ->where('status', '!=', 'approved')
                    ->whereMonth('due_date', $month)
                    ->whereYear('due_date', $year)
                    ->update([
                        'tenant_id'      => $tenant->id,
                        'status'         => 'approved',
                        'payment_method' => $method,
                        'paid_at'        => $now,
                        'approved_by'    => $request->user()?->id,
                    ]);
            }

            return response()->json([
                'message' => 'Pago aprobado correctamente y datos sincronizados.'
            ]);

        } catch (\Exception $e) {
            Log::error("[DEBUG-APPROVE] Error crítico en aprobación", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Error interno al procesar el pago.',
                'debug' => $e->getMessage()
            ], 500);
        }
    }


    /**
     * Bulk approve payments for multiple guardians.
     */
    /**
     * Revert a previously approved payment (manual or proof) back to pending.
     */
    public function revertPayment($tenantSlug, $id, Request $request)
    {
        try {
            $tenant = app('currentTenant');
            $guardian = Guardian::where('tenant_id', $tenant->id)->find($id);

            if (!$guardian) {
                $guardian = Guardian::find($id);
                if (!$guardian) return response()->json(['message' => 'No se encontró el apoderado.'], 404);
            }

            $now = Carbon::now('America/Santiago');
            $month = (int)$request->input('month', $now->month);
            $year = (int)$request->input('year', $now->year);

            foreach ($guardian->students as $student) {
                // 1. Revert FeePayment (SaaS/Subscription)
                \App\Models\FeePayment::where('student_id', $student->id)
                    ->where('period_month', $month)
                    ->where('period_year', $year)
                    ->update([
                        'status'         => 'review', // Si queremos que se revise de nuevo, o 'pending'
                        'paid_at'        => null,
                        'payment_method' => null,
                        'approved_by'    => null,
                        'notes'          => 'Pago anulado manualmente por Staff'
                    ]);

                // 2. Revert Legacy Payment (Dojo)
                \App\Models\Payment::where('student_id', $student->id)
                    ->whereMonth('due_date', $month)
                    ->whereYear('due_date', $year)
                    ->update([
                        'status'         => 'pending',
                        'paid_at'        => null,
                        'payment_method' => null,
                        'approved_by'    => null,
                    ]);
            }

            return response()->json([
                'message' => 'Aprobación de ' . Carbon::create($year, $month, 1)->format('M Y') . ' anulada exitosamente.'
            ]);

        } catch (\Exception $e) {
            Log::error("[DEBUG-REVERT] Error en reversión", ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Error al anular pago.'], 500);
        }
    }

    public function bulkApprove(Request $request)
    {
        $tenant = app('currentTenant');
        $ids = $request->input('guardian_ids', []);
        
        if (empty($ids)) {
            return response()->json(['message' => 'No se seleccionaron apoderados.'], 422);
        }

        $month = $request->input('month', now()->month);
        $year = $request->input('year', now()->year);
        $method = $request->input('payment_method', 'cash');

        $fee = \App\Models\Fee::where('tenant_id', $tenant->id)
            ->where('billing_cycle', 'monthly_fixed')
            ->first() ?: \App\Models\Fee::where('tenant_id', $tenant->id)->first();

        if (!$fee) {
            return response()->json(['message' => 'No hay cuotas configuradas.'], 422);
        }

        $guardians = Guardian::where('tenant_id', $tenant->id)
            ->whereIn('id', $ids)
            ->get();

        $totalApproved = 0;
        foreach ($guardians as $guardian) {
            foreach ($guardian->students as $student) {
                \App\Models\FeePayment::updateOrCreate(
                    [
                        'tenant_id'    => $tenant->id,
                        'guardian_id'  => $guardian->id,
                        'student_id'   => $student->id,
                        'fee_id'       => $fee->id,
                        'period_month' => $month,
                        'period_year'  => $year,
                    ],
                    [
                        'status'         => 'paid',
                        'payment_method' => $method,
                        'paid_at'        => now(),
                        'approved_by'    => $request->user()?->id,
                    ]
                );

                \App\Models\Payment::where('tenant_id', $tenant->id)
                    ->where('student_id', $student->id)
                    ->whereMonth('due_date', $month)
                    ->whereYear('due_date', $year)
                    ->update([
                        'status' => 'approved',
                        'paid_at'     => now(),
                    ]);

                $totalApproved++;
            }
            event(new \App\Events\FeeUpdated($tenant->slug, $guardian->id));
        }

        return response()->json([
            'success' => true,
            'message' => "Se aprobaron $totalApproved pagos exitosamente."
        ]);
    }
}

