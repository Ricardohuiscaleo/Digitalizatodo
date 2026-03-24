<?php

namespace App\Http\Controllers\Api;

use App\Events\FeeUpdated;
use App\Http\Controllers\Controller;
use App\Models\Guardian;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

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
            ->with(['students.enrollments.payments' => function ($query) use ($tenantId, $month, $year, $isHistory) {
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
            ->map(function ($guardian) use ($tenantId) {
            // Calculate status based on payments of their students
            // Simplified logic: checking if any student has pending/review payments
            $students = $guardian->students;
            $status = 'paid';
            $tenant = Tenant::find($tenantId);
            $pricing = $tenant->data['pricing'] ?? [
                'cat1_name' => 'Infantil',
                'cat1_price' => 25000,
                'cat2_name' => 'Adulto',
                'cat2_price' => 35000,
                'discount_threshold' => 2,
                'discount_percentage' => 15
            ];

            $s3BaseUrl = 'https://' . config('services.s3.bucket', 'digitalizatodo') . '.s3.' . config('services.s3.region', 'us-east-1') . '.amazonaws.com/';

            $activePayments = [];
            foreach ($students as $student) {
                foreach ($student->enrollments as $enrollment) {
                    $payment = $enrollment->payments->first(); // ya viene ordenado desc por due_date
                    if (!$payment) continue;
                    $activePayments[] = [
                        'id' => $payment->id,
                        'student_name' => $student->name,
                        'student_photo' => $student->photo ? (str_starts_with($student->photo, 'http') ? $student->photo : $s3BaseUrl . $student->photo) : "https://i.pravatar.cc/150?u=" . $student->id,
                        'amount' => (float)$payment->amount,
                        'status' => $payment->status === 'pending_review' ? 'review' : $payment->status,
                        'due_date' => $payment->due_date?->format('d M, Y'),
                        'proof_url' => $payment->proof_image ? (str_starts_with($payment->proof_image, 'http') ? $payment->proof_image : $s3BaseUrl . $payment->proof_image) : null,
                    ];
                    if ($payment->status === 'pending_review') {
                        $status = 'review';
                    } elseif ($payment->status === 'pending' || $payment->status === 'overdue') {
                        if ($status !== 'review') $status = 'pending';
                    }
                }
            }

            // Calcular total_due y extraer el primer comprobante disponible
            $totalDue = 0;
            $proofImage = null;
            
            foreach ($activePayments as $p) {
                if ($p['status'] === 'pending' || $p['status'] === 'overdue') {
                    $totalDue += $p['amount'];
                }
                if ($p['proof_url'] && !$proofImage) {
                    $proofImage = $p['proof_url'];
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
                'enrolledStudents' => $students->map(function ($s) use ($s3BaseUrl) {
                    $todayAttendance = $s->attendances->first();
                    return [
                        'id' => $s->id,
                        'name' => $s->name,
                        'category' => $s->category,
                        'photo' => $s->photo ? (str_starts_with($s->photo, 'http') ? $s->photo : $s3BaseUrl . $s->photo) : "https://i.pravatar.cc/150?img=" . $s->id,
                        'belt_rank' => $s->belt_rank,
                        'degrees' => (int)($s->degrees ?? 0),
                        'total_attendances' => $s->attendances()->count(),
                        'previous_classes' => (int)($s->previous_classes ?? 0),
                        'belt_classes_at_promotion' => (int)($s->belt_classes_at_promotion ?? 0),
                        'modality' => $s->modality,
                        'gender' => $s->gender,
                        'weight' => $s->weight,
                        'height' => $s->height,
                        'payment_status' => (function() use ($s) {
                            $hasOverdue = $s->enrollments->contains(fn($e) => $e->payments->where('status', 'overdue')->count() > 0);
                            $hasPending = $s->enrollments->contains(fn($e) => $e->payments->where('status', 'pending')->count() > 0);
                            if ($hasOverdue) return 'overdue';
                            if ($hasPending) return 'pending';
                            return 'paid';
                        })(),
                        'label' => $s->belt_rank ?? '', // Keep for retro-compatibility
                        'today_status' => $todayAttendance ? $todayAttendance->status : 'absent',
                        'method' => $todayAttendance ? $todayAttendance->registration_method : 'manual',
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
        $data['pricing'] = $request->except('industry');

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

        foreach ($guardian->students as $student) {
            $paymentsToApprove = \App\Models\Payment::where('tenant_id', $tenantId)
                ->whereIn('enrollment_id', $student->enrollments->pluck('id'))
                ->where('status', 'pending_review')
                ->get();

            foreach ($paymentsToApprove as $payment) {
                if ($payment->type === 'pack_4') {
                    $student->increment('consumable_credits', 4);
                } elseif ($payment->type === 'single') {
                    $student->increment('consumable_credits', 1);
                }

                $payment->update([
                    'status' => 'approved',
                    'paid_at' => now()
                ]);
            }
        }

        event(new \App\Events\PaymentStatusUpdated($guardian->id, 'approved', $tenant->slug));

        // Notificar al apoderado
        \App\Models\Notification::send($tenantId, $guardian->id, 'Pago aprobado', 'Tu pago ha sido aprobado. ¡Gracias!', 'payment', $tenant->slug);

        return response()->json(['message' => 'Pagos aprobados correctamente']);
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
                $optimizedPath = $this->imageService->optimize($file, 150, 150, 80);
                
                $filename = Str::uuid() . '.webp';
                $s3Path = 'digitalizatodo/' . $tenantId . '/logo/' . $filename;
                
                // Subir a S3 (sin ACL 'public' para evitar error)
                Storage::disk('s3')->put($s3Path, file_get_contents($optimizedPath));
                
                // Limpiar temporal
                unlink($optimizedPath);

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
        $data['bank_info'] = $validated;
        $tenant->update(['data' => $data]);

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
                $optimizedPath = $this->imageService->optimize($file, 150, 150, 80);
                
                $filename = Str::uuid() . '.webp';
                $s3Path = 'digitalizatodo/' . $tenantId . '/guardians/' . $filename;
                
                // Subir a S3
                Storage::disk('s3')->put($s3Path, file_get_contents($optimizedPath));
                
                // Limpiar temporal
                unlink($optimizedPath);

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
        $debtsQuery = \App\Models\FeePayment::where('fee_payments.guardian_id', $guardian->id)
            ->whereIn('fee_payments.status', ['pending', 'review'])
            ->join('fees', 'fee_payments.fee_id', '=', 'fees.id');
        
        $debtsAmount = (float) $debtsQuery->sum('fees.amount');
        $debtsPayments = $debtsQuery->select('fee_payments.*')->with('fee')->get();

        // Devoluciones: cuotas pagadas/aprobadas de meses ESTRICTAMENTE futuros
        $refundsQuery = \App\Models\FeePayment::where('fee_payments.guardian_id', $guardian->id)
            ->where('fee_payments.status', 'paid')
            ->where(function($q) use ($currentMonth, $currentYear) {
                $q->where('fee_payments.period_year', '>', $currentYear)
                  ->orWhere(function($sub) use ($currentMonth, $currentYear) {
                      $sub->where('fee_payments.period_year', $currentYear)
                          ->where('fee_payments.period_month', '>', $currentMonth);
                  });
            })
            ->join('fees', 'fee_payments.fee_id', '=', 'fees.id');

        $refundsAmount = (float) $refundsQuery->sum('fees.amount');
        $refundsPayments = $refundsQuery->select('fee_payments.*')->with('fee')->get();

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
                'payments' => $debtsPayments
            ],
            'refunds' => [
                'total' => $refundsAmount,
                'payments' => $refundsPayments
            ]
        ]);
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
