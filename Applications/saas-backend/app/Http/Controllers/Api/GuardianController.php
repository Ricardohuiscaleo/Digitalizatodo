<?php

namespace App\Http\Controllers\Api;

use App\Events\FeeUpdated;
use App\Http\Controllers\Controller;
use App\Models\Guardian;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
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
                ->with(['fee', 'student'])
                ->get();

            foreach ($feePayments as $fp) {
                if (!$fp->student) continue; // Blindaje Null
                
                $pStatus = $fp->status === 'review' ? 'review' : $fp->status;
                $amount = (float)($fp->fee?->amount ?? 0);
                
                // Si el monto es 0, intentar sacar el precio del plan
                if ($amount <= 0) {
                    $enrollment = $fp->student->enrollments()->where('status', 'active')->first();
                    $amount = (float)($enrollment?->plan?->price ?? 0);
                }
                
                if ($amount <= 0) $amount = 45000; // Fallback extremo

                $pKey = $fp->student_id . '_' . $fp->period_month . '_' . $fp->period_year;
                $activePeriods[$pKey] = true;

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
                    'plan_name' => $fp->fee?->title ?? 'Mensualidad',
                    'belt_rank' => $fp->student->belt_rank ?? 'Blanco',
                    'degrees' => (int)($fp->student->degrees ?? 0)
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
                            'plan_name' => $payment?->plan?->name ?? $enrollment?->plan?->name ?? 'Mensualidad',
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
                        $enrollment = $s->enrollments?->first();
                        $totalDue += (float)($enrollment?->plan?->price ?? 45000);
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
                    return [
                        'id' => $s->id,
                        'name' => $s->name,
                        'category' => $s->category,
                        'belt_rank' => $s->belt_rank ?? 'Blanco',
                        'degrees' => (int)($s->degrees ?? 0),
                        'photo' => $s->photo ? (str_starts_with($s->photo, 'http') ? $s->photo : $s3BaseUrl . $s->photo) : "https://i.pravatar.cc/150?u=" . $s->id,
                        'today_status' => $s->attendances()->where('date', \Carbon\Carbon::now('America/Santiago')->toDateString())->where('status', 'present')->exists() ? 'present' : 'absent',
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
    public function approvePayment(Request $request, $id)
    {
        $tenant = app('currentTenant');
        
        Log::debug("[DEBUG-APPROVE] Iniciando aprobación de pago", [
            'tenant_id' => $tenant->id,
            'tenant_slug' => $tenant->slug,
            'guardian_id' => $id,
            'user' => $request->user()?->email
        ]);

        $guardian = Guardian::where('tenant_id', $tenant->id)->find($id);

        if (!$guardian) {
            Log::warning("[DEBUG-APPROVE] Guardian no encontrado para el tenant", [
                'tenant_id' => $tenant->id,
                'guardian_id' => $id
            ]);
            
            // Si no se encuentra, buscar por ID global solo para diagnóstico (sin exponer datos)
            $globalGuardian = Guardian::find($id);
            if ($globalGuardian) {
                Log::warning("[DEBUG-APPROVE] Guardian existe pero pertenece a otro tenant", [
                    'actual_tenant_id' => $globalGuardian->tenant_id
                ]);
            } else {
                Log::warning("[DEBUG-APPROVE] Guardian no existe en la base de datos (ID $id)");
            }

            return response()->json(['message' => 'No se encontró el apoderado especificado para este tenant'], 404);
        }

        $month = $request->input('month', \Carbon\Carbon::now('America/Santiago')->month);
        $year = $request->input('year', \Carbon\Carbon::now('America/Santiago')->year);
        $method = $request->input('payment_method', 'cash');
        $notes = $request->input('notes', 'Aprobado manualmente por Staff');

        // Buscar la cuota mensual estándar (billing_cycle = monthly_fixed)
        $fee = \App\Models\Fee::where('tenant_id', $tenant->id)
            ->where('billing_cycle', 'monthly_fixed')
            ->first();

        // Si no existe una fee configurada como mensual fija, buscamos la primera vigente
        if (!$fee) {
            $fee = \App\Models\Fee::where('tenant_id', $tenant->id)->first();
        }

        if (!$fee) {
            return response()->json(['message' => 'No hay cuotas configuradas para este gimnasio.'], 422);
        }

        $count = 0;
        foreach ($guardian->students as $student) {
            // 1. Actualizar o Crear FeePayment
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
                    'notes'          => $notes,
                ]
            );

            // 2. Sincronizar con tabla 'payments' (Artes Marciales)
            \App\Models\Payment::where('tenant_id', $tenant->id)
                ->where('student_id', $student->id)
                ->where('status', '!=', 'approved')
                ->whereMonth('due_date', $month)
                ->whereYear('due_date', $year)
                ->update([
                    'status'         => 'approved',
                    'paid_at'        => now(),
                    'payment_method' => $method
                ]);

            $count++;
        }

        event(new \App\Events\FeeUpdated($tenant->slug, $guardian->id));

        return response()->json([
            'success'   => true,
            'message'   => "Se han marcado $count mensualidades como pagadas.",
            'guardian_id' => $guardian->id
        ]);
    }

    /**
     * Bulk approve payments for multiple guardians.
     */
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

