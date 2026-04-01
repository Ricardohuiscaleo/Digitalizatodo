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
        $isHistory = $request->query('history') === 'true';

        $guardians = Guardian::where('tenant_id', $tenantId)
            ->with(['students.enrollments.plan', 'students.enrollments.payments' => function ($query) use ($tenantId, $month, $year, $isHistory) {
                $query->where('tenant_id', $tenantId);
                
                if ($isHistory && $month && $year) {
                    $query->whereMonth('due_date', $month)
                          ->whereYear('due_date', $year);
                } else {
                    // Traer pending/review/overdue + el último approved por enrollment
                    $query->whereIn('status', ['pending', 'pending_review', 'overdue', 'approved'])
                          ->orderBy('due_date', 'desc');
                }
            }, 'students.attendances' => function ($query) use ($tenantId) {
                $query->where('tenant_id', $tenantId)
                      ->where('date', now()->format('Y-m-d'));
            }])
            ->get()
            ->map(function ($guardian) use ($tenantId, $isHistory) {
            // Calculate status based on payments of their students
            $students = $guardian->students;
            $status = 'paid';
            $tenant = Tenant::find($tenantId);

            // Para martial_arts: el status se basa en fee_payments del mes actual
            $now = now();
            $hasFeeSystem = \App\Models\FeePayment::whereIn('student_id', $students->pluck('id'))
                ->exists();

            if ($hasFeeSystem) {
                $paidThisMonth = \App\Models\FeePayment::whereIn('student_id', $students->pluck('id'))
                    ->where('period_month', $now->month)
                    ->where('period_year', $now->year)
                    ->where('status', 'paid')
                    ->exists();
                $reviewThisMonth = \App\Models\FeePayment::whereIn('student_id', $students->pluck('id'))
                    ->where('period_month', $now->month)
                    ->where('period_year', $now->year)
                    ->where('status', 'review')
                    ->exists();

                if ($reviewThisMonth) $status = 'review';
                elseif (!$paidThisMonth) $status = 'pending';
            }
            $pricing = $tenant->data['pricing'] ?? [];
            
            if (empty($pricing)) {
                // Fetch dynamic prices from plans table if available
                $kidsPlan = \App\Models\Plan::where('tenant_id', $tenantId)->where('target_audience', 'kids')->where('active', true)->orderBy('price', 'asc')->first();
                $adultsPlan = \App\Models\Plan::where('tenant_id', $tenantId)->where('target_audience', 'adults')->where('active', true)->orderBy('price', 'asc')->first();
                
                $pricing = [
                    'cat1_name' => 'Infantil',
                    'cat1_price' => (int)($kidsPlan?->price ?? 35000),
                    'cat2_name' => 'Adulto',
                    'cat2_price' => (int)($adultsPlan?->price ?? 45000),
                    'discount_threshold' => 2,
                    'discount_percentage' => 15
                ];
            }

            $s3BaseUrl = 'https://' . config('services.s3.bucket', 'digitalizatodo') . '.s3.' . config('services.s3.region', 'us-east-1') . '.amazonaws.com/';

            $activePayments = [];
            foreach ($students as $student) {
                foreach ($student->enrollments as $enrollment) {
                    $hasAddedApproved = false;
                    foreach ($enrollment->payments as $payment) {
                        if ($payment->status === 'approved') {
                            if ($hasAddedApproved && !$isHistory) continue;
                            $hasAddedApproved = true;
                        }

                        $activePayments[] = [
                            'id' => $payment->id,
                            'student_name' => $student->name,
                            'student_photo' => $student->photo ? (str_starts_with($student->photo, 'http') ? $student->photo : $s3BaseUrl . $student->photo) : "https://i.pravatar.cc/150?u=" . $student->id,
                            'amount' => (float)$payment->amount,
                            'status' => $payment->status === 'pending_review' ? 'review' : $payment->status,
                            'due_date' => $payment->due_date?->format('d M, Y'),
                            'proof_url' => $payment->proof_image ? (str_starts_with($payment->proof_image, 'http') ? $payment->proof_image : $s3BaseUrl . $payment->proof_image) : null,
                            'belt_rank' => $student->belt_rank,
                            'degrees' => (int)($student->degrees ?? 0),
                            'total_attendances' => $student->attendances()->count(),
                            'previous_classes' => (int)($student->previous_classes ?? 0),
                            'belt_classes_at_promotion' => (int)($student->belt_classes_at_promotion ?? 0),
                            'plan_name' => $payment->plan?->name ?? $enrollment->plan?->name ?? null,
                        ];
                    }
                }
            }

            // Inteligencia de Estado v1.5.3 (Modo Disciplina)
            $hasPending = false;
            $hasReview = false;
            $hasApprovedCurrent = false; // Solo cuenta si es de este mes o futuro
            
            $currentMonthStart = now()->startOfMonth();

            // Sincronización: Traer FeePayments y agregarlos a activePayments si no están
            $feePayments = \App\Models\FeePayment::whereIn('student_id', $students->pluck('id'))
                ->with(['fee', 'student.enrollment.plan'])
                ->get();

            foreach ($feePayments as $fp) {
                $pStatus = $fp->status === 'review' ? 'review' : $fp->status;
                
                // Inteligencia de Precios v1.5.5
                // 1. Usar el monto de la cuota maestra si existe
                // 2. Si no, usar el precio del plan de entrenamiento del alumno
                $amount = (float)($fp->fee->amount ?? 0);
                $enrollment = $fp->student?->enrollments?->first();
                if ($amount <= 0 && $enrollment && $enrollment->plan) {
                    $amount = (float)($enrollment->plan->price ?? 0);
                }

                // Evitar duplicados con activePayments ya existentes (por ID de pago de MP si aplica)
                $activePayments[] = [
                    'id' => 'fp_' . $fp->id,
                    'student_name' => $fp->student->name,
                    'student_photo' => $fp->student->photo ? (str_starts_with($fp->student->photo, 'http') ? $fp->student->photo : $s3BaseUrl . $fp->student->photo) : "https://i.pravatar.cc/150?u=" . $fp->student->id,
                    'amount' => $amount,
                    'status' => $pStatus,
                    'due_date' => $fp->period_month ? Carbon::create($fp->period_year, $fp->period_month, 1)->format('d M, Y') : null,
                    'proof_url' => $fp->proof_url,
                    'plan_name' => $fp->fee->title ?? ($enrollment?->plan?->name ?? 'Mensualidad'),
                    'is_fee' => true
                ];
            }

            foreach ($activePayments as $p) {
                if ($p['status'] === 'review') $hasReview = true;
                if ($p['status'] === 'pending' || $p['status'] === 'overdue') $hasPending = true;
                
                if ($p['status'] === 'approved') {
                    $dueDate = isset($p['due_date']) ? Carbon::parse($p['due_date']) : null;
                    if ($dueDate && $dueDate->greaterThanOrEqualTo($currentMonthStart)) {
                        $hasApprovedCurrent = true;
                    }
                }
            }

            // Prioridad: Review > Pending > Paid (Solo si es de este mes)
            if ($hasReview) $status = 'review';
            elseif ($hasPending) $status = 'pending';
            elseif ($hasApprovedCurrent) $status = 'paid';
            else $status = 'pending'; // Si no hay pago aprobado este mes, asumimos pendiente

            $totalDue = $hasPending ? array_sum(array_column(array_filter($activePayments, fn($p) => $p['status'] === 'pending' || $p['status'] === 'overdue'), 'amount')) : 0;

            // Inteligencia Predictiva v1.5.6
            // Si el estado es PENDIENTE pero no hay registros de deuda físicos ($totalDue == 0),
            // calculamos la "Deuda Virtual" basada en el precio de los planes cargados.
            if ($status === 'pending' && $totalDue <= 0) {
                foreach ($students as $s) {
                    // Solo sumamos si el alumno no tiene un pago aprobado para este mes
                    $hasMonthPaid = false;
                    foreach ($activePayments as $p) {
                        $dueDate = isset($p['due_date']) ? Carbon::parse($p['due_date']) : null;
                        if ($p['status'] === 'approved' && $dueDate && $dueDate->greaterThanOrEqualTo($currentMonthStart)) {
                            $hasMonthPaid = true;
                            break;
                        }
                    }

                    $enrollment = $s->enrollments?->first();
                    if (!$hasMonthPaid && $enrollment && $enrollment->plan) {
                        $totalDue += (float)($enrollment->plan->price ?? 0);
                    }
                }
            }
            $proofImage = null;
            foreach ($activePayments as $p) {
                if ($p['proof_url']) {
                    $proofImage = $p['proof_url'];
                    break;
                }
            }

            return [
                'id' => $guardian->id,
                'name' => $guardian->name,
                'photo' => $guardian->photo ? (str_starts_with($guardian->photo, 'http') ? $guardian->photo : $s3BaseUrl . $guardian->photo) : "https://i.pravatar.cc/150?u=" . $guardian->id,
                'status' => $status,
                'total_due' => round($totalDue),
                'proof_image' => $proofImage,
                'payments' => $activePayments,
                'pricing' => $pricing,
                'enrolledStudents' => $students->map(function ($s) use ($s3BaseUrl, $hasApproved) {
                    $bp = $s->belt_progress;
                    return [
                        'id' => $s->id,
                        'name' => $s->name,
                        'category' => $s->category,
                        'photo' => $s->photo ? (str_starts_with($s->photo, 'http') ? $s->photo : $s3BaseUrl . $s->photo) : "https://i.pravatar.cc/150?img=" . $s->id,
                        'belt_rank' => $s->belt_rank,
                        'degrees' => $bp['degrees'],
                        'total_attendances' => $bp['system_classes'],
                        'previous_classes' => $bp['real_classes'] - $bp['system_classes'],
                        'belt_classes_at_promotion' => (int)($s->belt_classes_at_promotion ?? 0),
                        'modality' => $s->modality,
                        'gender' => $s->gender,
                        'weight' => $s->weight,
                        'height' => $s->height,
                        'payment_status' => ($status === 'paid') ? 'paid' : 'overdue',
                        'label' => $s->belt_rank ?? '', 
                        'today_status' => $bp['today_status'],
                        'method' => $bp['registration_method'],
                        'belt_progress' => $bp,
                        'plan_name' => $s->enrollments->where('deleted_at', null)->sortByDesc('created_at')->first()?->plan?->name ?? null,
                    ];
                }),
            ];
        });

        return response()->json(['payers' => $guardians]);
    }

    /**
     * Update tenant pricing and settings stored in JSON data column.
     */
    public function updatePricing(Request $request)
    {
        $tenant = app('currentTenant');
        $tenantId = $tenant->id;

        $data = $tenant->data ?? [];
        $pricing = $request->except('industry');
        
        // Purge obsolete hardcoded pricing fields
        unset($pricing['adult'], $pricing['kids']);
        
        $data['pricing'] = $pricing;

        $updatePayload = ['data' => $data];
        if ($request->has('industry')) {
            $updatePayload['industry'] = $request->input('industry');
        }

        $tenant->update($updatePayload);

        return response()->json(['message' => 'Configuración actualizada', 'prices' => $data['pricing'], 'industry' => $tenant->industry]);
    }

    /**
     * Approve a payment (simplified from guardian context).
     */
    public function approvePayment(Request $request, $tenant, $id)
    {
        $tenant = app('currentTenant');
        $tenantId = $tenant->id;
        $guardian = Guardian::where('tenant_id', $tenantId)->findOrFail($id);

        $approvedCount = 0;
        foreach ($guardian->students as $student) {
            $paymentsToApprove = \App\Models\Payment::where('tenant_id', $tenantId)
                ->whereIn('enrollment_id', $student->enrollments->pluck('id'))
                ->whereIn('status', ['pending', 'pending_review', 'overdue'])
                ->get();

            foreach ($paymentsToApprove as $payment) {
                // Lógica de consumibles
                if ($payment->type === 'pack_4') {
                    $student->increment('consumable_credits', 4);
                } elseif ($payment->type === 'single') {
                    $student->increment('consumable_credits', 1);
                }

                // Lógica de UPGRADE DE PLAN o REGISTRO INICIAL (Propagar a cuotas mensuales)
                if (in_array($payment->type, ['plan_upgrade', 'monthly_fee']) && $payment->plan_id) {
                    $plan = \App\Models\Plan::find($payment->plan_id);
                    if ($plan) {
                        // 1. Actualizar el enrollment del alumno
                        $enrollment = $payment->enrollment;
                        if ($enrollment) {
                            $enrollment->update(['plan_id' => $plan->id, 'status' => 'active']);
                        }

                        // 2. Determinar cobertura de meses
                        $monthsToCover = match($plan->billing_cycle) {
                            'quarterly'    => 3,
                            'semi_annual'  => 6,
                            'annual'       => 12,
                            default        => 1,
                        };

                        // 3. Obtener o crear la plantilla de cobro (Fee) para este plan
                        $feeTemplate = \App\Models\Fee::firstOrCreate(
                            ['tenant_id' => $tenantId, 'plan_id' => $plan->id],
                            [
                                'title'         => $plan->name,
                                'amount'        => $plan->price,
                                'type'          => 'recurring',
                                'billing_cycle' => $plan->billing_cycle ?? 'monthly_fixed',
                                'recurring_day' => $plan->billing_day ?? 1,
                                'target'        => 'custom',
                            ]
                        );

                        // 4. Marcar los próximos N meses como pagados
                        $currentDate = now();
                        for ($i = 0; $i < $monthsToCover; $i++) {
                            $targetDate = $currentDate->copy()->addMonths($i);
                            \App\Models\FeePayment::updateOrCreate(
                                [
                                    'fee_id'       => $feeTemplate->id,
                                    'tenant_id'    => $tenantId,
                                    'guardian_id'  => $guardian->id,
                                    'student_id'   => $student->id,
                                    'enrollment_id'=> $enrollment?->id,
                                    'period_month' => $targetDate->month,
                                    'period_year'  => $targetDate->year,
                                ],
                                [
                                    'status'         => 'paid',
                                    'payment_method' => 'transfer',
                                    'paid_at'        => now(),
                                    'approved_by'    => $request->user()->id,
                                    'notes'          => 'Cubierto por Plan: ' . $plan->name,
                                ]
                            );
                        }

                        // 5. Limpieza: Eliminar cuotas proyectadas (pending) de otros planes 
                        // para evitar que el alumno las vea duplicadas
                        \App\Models\FeePayment::where('student_id', $student->id)
                            ->where('status', 'pending')
                            ->where('fee_id', '!=', $feeTemplate->id)
                            ->delete();
                    }
                }

                $payment->update([
                    'status' => 'approved',
                    'paid_at' => now()
                ]);
                $approvedCount++;
            }
        }

        if ($approvedCount > 0) {
            event(new \App\Events\PaymentStatusUpdated($guardian->id, 'approved', $tenant->slug));

            // Notificar al apoderado
            \App\Models\Notification::send($tenantId, $guardian->id, 'Pago aprobado', 'Tu pago ha sido aprobado. ¡Gracias!', 'payment', $tenant->slug);
            return response()->json(['message' => 'Pagos aprobados correctamente', 'count' => $approvedCount]);
        }

        return response()->json(['message' => 'No se encontraron pagos pendientes para aprobar.'], 422);
    }

    /**
     * Update tenant logo.
     */
    public function updateLogo(Request $request)
    {
        $tenant = app('currentTenant');
        $tenantId = $tenant->id;

        $request->validate([
            'logo' => 'required|image|max:20480', // Aceptamos hasta 20MB
        ]);

        if ($request->hasFile('logo')) {
            $file = $request->file('logo');
            
            try {
                // Optimizar logo a un máximo de 500x500px para la UI
                $imageInfo = $this->imageService->optimize($file, 150, 150, 80);
                $optimizedPath = $imageInfo['path'];
                $extension = $imageInfo['extension'];
                
                $filename = Str::uuid() . '.' . $extension;
                $s3Path = 'digitalizatodo/' . $tenantId . '/logo/' . $filename;
                
                // Subir a S3
                Storage::disk('s3')->put($s3Path, file_get_contents($optimizedPath));
                
                // Limpiar temporal
                if ($optimizedPath !== $file->getRealPath()) {
                    unlink($optimizedPath);
                }

                $bucket = env('AWS_BUCKET', env('S3_BUCKET'));
                $region = env('AWS_DEFAULT_REGION', env('S3_REGION', 'us-east-1'));
                $url = "https://{$bucket}.s3.{$region}.amazonaws.com/{$s3Path}";
                
                $tenant->update(['logo' => $url]);

                return response()->json(['message' => 'Logo optimizado y actualizado', 'logo_url' => $url]);

            } catch (\Exception $e) {
                \Log::error("Error optimizando logo: " . $e->getMessage());
                return response()->json(['error' => 'Error al procesar el logo: ' . $e->getMessage()], 500);
            }
        }

        return response()->json(['message' => 'No se subió ningún archivo'], 400);
    }

    /**
     * Save bank transfer details for this tenant.
     * POST /api/{tenant}/settings/bank-info
     */
    public function updateBankInfo(Request $request)
    {
        $tenant = app('currentTenant');

        $validated = $request->validate([
            'bank_name'      => 'required|string|max:100',
            'account_type'   => 'required|string|max:50',
            'account_number' => 'required|string|max:50',
            'holder_name'    => 'required|string|max:100',
            'holder_rut'     => 'required|string|max:20',
        ]);

        $data = $tenant->data ?? [];
        if (isset($data['bank_info'])) {
            unset($data['bank_info']);
        }

        $tenant->update([
            'bank_name' => $validated['bank_name'],
            'bank_account_type' => $validated['account_type'],
            'bank_account_number' => $validated['account_number'],
            'bank_account_holder' => $validated['holder_name'],
            'bank_rut' => $validated['holder_rut'],
            'data' => $data
        ]);

        return response()->json(['message' => 'Datos bancarios guardados correctamente.', 'bank_info' => $validated]);
    }

    /**
     * Update authenticated guardian photo.
     * POST /api/{tenant}/me/photo
     */
    public function updatePhoto(Request $request)
    {
        $tenant = app('currentTenant');
        $tenantId = $tenant->id;
        $guardian = auth()->user();

        if (!$guardian instanceof Guardian) {
            return response()->json(['error' => 'Usuario no autorizado'], 401);
        }

        $request->validate([
            'photo' => 'required|image|max:20480', // Hasta 20MB
        ]);

        if ($request->hasFile('photo')) {
            $file = $request->file('photo');
            
            try {
                // Optimizar a un tamaño manejable para avatares (400x400)
                $imageInfo = $this->imageService->optimize($file, 150, 150, 80);
                $optimizedPath = $imageInfo['path'];
                $extension = $imageInfo['extension'];
                
                $filename = Str::uuid() . '.' . $extension;
                $s3Path = 'digitalizatodo/' . $tenantId . '/guardians/' . $filename;
                
                // Subir a S3
                Storage::disk('s3')->put($s3Path, file_get_contents($optimizedPath));
                
                // Limpiar temporal
                if ($optimizedPath !== $file->getRealPath()) {
                    unlink($optimizedPath);
                }

                $bucket = env('AWS_BUCKET', env('S3_BUCKET'));
                $region = env('AWS_DEFAULT_REGION', env('S3_REGION', 'us-east-1'));
                $url = "https://{$bucket}.s3.{$region}.amazonaws.com/{$s3Path}";
                
                $guardian->update(['photo' => $url]);

                return response()->json(['message' => 'Foto de perfil actualizada', 'photo_url' => $url]);

            } catch (\Exception $e) {
                \Log::error("Error optimizando foto de apoderado: " . $e->getMessage());
                return response()->json(['error' => 'Error al procesar la imagen: ' . $e->getMessage()], 500);
            }
        }

        return response()->json(['message' => 'No se subió ningún archivo'], 400);
    }

    /**
     * Obtiene el estado de resultado (finiquito) del apoderado.
     */
    public function settlement(Request $request, $tenant, $id)
    {
        $tenantObj = app('currentTenant');
        $guardian = Guardian::where('tenant_id', $tenantObj->id)
            ->with(['students' => function($q) {
                $q->whereNull('students.deleted_at');
            }])
            ->findOrFail($id);

        $now = now();
        $currentMonth = $now->month;
        $currentYear = $now->year;

        // Deudas: cuotas pendientes o en revisión
        $debtsPayments = \App\Models\FeePayment::where('fee_payments.guardian_id', $guardian->id)
            ->whereIn('fee_payments.status', ['pending', 'review'])
            ->with('fee')
            ->get();
        
        $debtsAmount = $debtsPayments->sum(function($p) { return (float)($p->fee->amount ?? 0); });

        // Devoluciones: cuotas pagadas/aprobadas de meses ESTRICTAMENTE futuros
        $refundsPayments = \App\Models\FeePayment::where('fee_payments.guardian_id', $guardian->id)
            ->where('fee_payments.status', 'paid')
            ->where(function($q) use ($currentMonth, $currentYear) {
                $q->where('fee_payments.period_year', '>', $currentYear)
                  ->orWhere(function($sub) use ($currentMonth, $currentYear) {
                      $sub->where('fee_payments.period_year', $currentYear)
                          ->where('fee_payments.period_month', '>', $currentMonth);
                  });
            })
            ->with('fee')
            ->get();
        
        $refundsAmount = $refundsPayments->sum(function($p) { return (float)($p->fee->amount ?? 0); });

        return response()->json([
            'guardian' => [
                'id' => $guardian->id,
                'name' => $guardian->name,
                'students' => $guardian->students->map(function($s) {
                    return [
                        'id' => $s->id,
                        'name' => $s->name,
                        'category' => $s->category,
                    ];
                }),
            ],
            'debts' => [
                'total' => $debtsAmount,
                'payments' => $debtsPayments->map(fn($p) => [
                    'id'             => $p->id,
                    'fee_id'         => $p->fee_id,
                    'alumno'         => $p->student->name ?? $guardian->name,
                    'monto'          => $p->fee->amount ?? 0,
                    'vencimiento'    => \Carbon\Carbon::create($p->period_year, $p->period_month, 1)->format('Y-m-d'),
                    'estado'         => $p->status,
                    'payment_method' => $p->payment_method, // Aquí inyectamos el método
                    'proof_url'      => $p->proof_url,
                ])
            ],
            'refunds' => [
                'total' => $refundsAmount,
                'payments' => $refundsPayments
            ]
        ]);
    }

    /**
     * Aprobación masiva de pagos desde el Staff.
     */
    public function bulkApprove(Request $request)
    {
        $tenant = app('currentTenant');
        $request->validate([
            'payment_ids' => 'required|array',
            'payment_ids.*' => 'integer',
            'payment_method' => 'required|in:cash,transfer,mercadopago'
        ]);

        $paymentIds = $request->input('payment_ids');
        $method = $request->input('payment_method');

        $approvedCount = 0;

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            $payments = \App\Models\FeePayment::whereIn('id', $paymentIds)
                ->where('tenant_id', $tenant->id)
                ->get();

            foreach ($payments as $payment) {
                $payment->update([
                    'status' => 'paid',
                    'paid_at' => now(),
                    'payment_method' => $method
                ]);

                // Sincronizar con la tabla payments si existe registro pendiente
                \App\Models\Payment::where('student_id', $payment->student_id)
                    ->where('status', 'pending')
                    ->whereDate('due_date', \Carbon\Carbon::create($payment->period_year, $payment->period_month, 1))
                    ->update([
                        'status' => 'approved',
                        'paid_at' => now(),
                    ]);
                
                $approvedCount++;
            }

            \Illuminate\Support\Facades\DB::commit();

            // Notificar al Guardian de la aprobación masiva (opcional)
            // event(new FeeUpdated($tenant->slug, ...));

            return response()->json([
                'message' => "Se han aprobado {$approvedCount} pagos exitosamente como {$method}.",
                'approved_count' => $approvedCount
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Elimina (Soft Delete) al apoderado, sus alumnos y pagos, y registra el gasto de devolución si aplica.
     */
    public function destroy(Request $request, $tenant, $id)
    {
        $tenantObj = app('currentTenant');
        $guardian = Guardian::where('tenant_id', $tenantObj->id)->findOrFail($id);

        $request->validate([
            'confirmation_name' => 'required|string',
            'refund_proof' => 'nullable|file|max:20480', // 20MB max
            'refund_amount' => 'nullable|numeric'
        ]);

        if (strtolower(trim($request->confirmation_name)) !== strtolower(trim($guardian->name))) {
            return response()->json(['error' => 'El nombre de confirmación no coincide con el del apoderado.'], 400);
        }

        $refundAmount = (float) $request->input('refund_amount', 0);
        
        if ($refundAmount > 0 && !$request->hasFile('refund_proof')) {
            return response()->json(['error' => 'Debe adjuntar un comprobante de transferencia para procesar la devolución.'], 400);
        }

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            // 1. Procesar devolución y crear Gasto (Expense)
            if ($refundAmount > 0 && $request->hasFile('refund_proof')) {
                $file = $request->file('refund_proof');
                $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
                $s3Path = 'digitalizatodo/' . $tenantObj->id . '/refunds/' . $filename;
                
                Storage::disk('s3')->put($s3Path, file_get_contents($file));
                
                $bucket = env('AWS_BUCKET', env('S3_BUCKET'));
                $region = env('AWS_DEFAULT_REGION', env('S3_REGION', 'us-east-1'));
                $proofUrl = "https://{$bucket}.s3.{$region}.amazonaws.com/{$s3Path}";

                \App\Models\Expense::create([
                    'tenant_id' => $tenantObj->id,
                    'category' => 'Devolución',
                    'title' => 'Devolución retiro de apoderado',
                    'amount' => $refundAmount,
                    'expense_date' => now()->format('Y-m-d'),
                    'description' => 'Devolución de cuotas por retiro de apoderado: ' . $guardian->name,
                    'receipt_photo' => $proofUrl,
                    'created_by' => auth()->id()
                ]);
            }

            // 2. Soft Delete de estudiantes
            foreach ($guardian->students as $student) {
                // Remove the student's enrollments/payments logic if needed, 
                // but soft-deleting the student is enough for now.
                $student->delete(); 
            }

            // 3. Soft Delete de FeePayments asociados para que no salgan más en la lista
            \App\Models\FeePayment::where('guardian_id', $guardian->id)->delete();

            // 4. Limpiar tokens push (Schema-Aware)
            $pushQuery = \App\Models\PushSubscription::where('user_id', $guardian->id);
            if (\Illuminate\Support\Facades\Schema::hasColumn('push_subscriptions', 'user_type')) {
                $pushQuery->where('user_type', 'guardian');
            }
            $pushQuery->delete();

            // 5. Soft Delete Guardian
            $guardian->delete();

            \Illuminate\Support\Facades\DB::commit();

            // Broadcast para actualización en tiempo real del dashboard Staff
            broadcast(new FeeUpdated($tenantObj->slug, $guardian->id));

            return response()->json(['message' => 'Apoderado eliminado correctamente y finiquito procesado.']);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            \Log::error("Error eliminando apoderado: " . $e->getMessage());
            return response()->json(['error' => 'Ocurrió un error al procesar el retiro: ' . $e->getMessage()], 500);
        }
    }
}
