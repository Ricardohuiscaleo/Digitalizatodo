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
        $requestedMonth = (int) ($month ?? now()->month);
        $requestedYear = (int) ($year ?? now()->year);
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

            $activePayments
            
            // Recolectamos FeePayments (Prioridad Alta)
            $feePayments = AppModelsFeePayment::whereIn("student_id", $students->pluck("id"))->where("status", "pending")->get();

                ->where('tenant_id', $tenantId)
                ->with(['fee', 'student'])
                ->get();

            $activePeriods 
            $tempPayments

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
                'payments' => $activePayments, 'fees' => $activePayments, 'fees' => $activePayments,
                'pricing' => $pricing,
                'enrolledStudents' => $students->map(function ($s) use ($s3BaseUrl) {
                    return [
                        'id' => $s->id,
                        'name' => $s->name,
                        'category' => $s->category,
                        'belt_rank' => $s->belt_rank ?? 'Blanco',
                        'degrees' => (int)($s->degrees ?? 0),
                        'photo' => $s->photo ? (str_starts_with($s->photo, 'http') ? $s->photo : $s3BaseUrl . $s->photo) : "https://i.pravatar.cc/150?u=" . $s->id,
                    ];
                })
            ];
        });

        return response()->json(['payers' => $guardians]);
    }

    /**
     * Approve a pending payment review.
     */
    public function approvePayment(Request $request, $id)
    {
        // ... (resto del controlador)
    }
}
