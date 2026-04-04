<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Events\FeeUpdated;
use App\Models\Fee;
use App\Models\FeePayment;
use App\Models\Guardian;
use App\Models\Notification;
use App\Services\ImageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class FeeController extends Controller
{
    public function __construct(protected ImageService $imageService) {}

    // GET /fees/guardians-summary — staff ve todos los apoderados con su estado de cuotas
    public function guardiansSummary(Request $request)
    {
        $tenant = app('currentTenant');
        $now = now();

        $guardians = Guardian::where('tenant_id', $tenant->id)
            ->where('active', true)
            ->get();

        $fees = Fee::where('tenant_id', $tenant->id)->get();

        $metrics = [
            'total'       => \App\Models\Student::where('tenant_id', $tenant->id)->where('active', true)->count(),
            'al_dia'      => 0,
            'en_revision' => 0,
            'morosos'     => 0,
        ];

        $result = $guardians->map(function ($guardian) use ($tenant, $fees, $now, &$metrics) {
            $payments = FeePayment::where('tenant_id', $tenant->id)
                ->where('guardian_id', $guardian->id)
                ->with('fee')
                ->get();

            $hasReview  = $payments->where('status', 'review')->count() > 0;
            
            $isMoroso = false;
            foreach ($fees as $fee) {
                $periods = $this->calculatePeriods($fee);
                foreach ($periods as $period) {
                    $dueDate = $period['due_date'] ? \Carbon\Carbon::parse($period['due_date'])->endOfDay() : null;
                    $payment = $payments->where('fee_id', $fee->id)
                        ->where('period_month', $period['month'])
                        ->where('period_year', $period['year'])
                        ->first();
                    if (!$payment && $dueDate && $dueDate->isPast()) {
                        $isMoroso = true;
                    }
                }
            }

            if ($isMoroso) {
                $status = 'overdue';
                $metrics['morosos']++;
            } elseif ($hasReview) {
                $status = 'review';
                $metrics['en_revision']++;
            } else {
                $status = ($fees->count() > 0) ? 'paid' : 'none';
                $metrics['al_dia']++;
            }

            return [
                'id'       => $guardian->id,
                'name'     => $guardian->name,
                'email'    => $guardian->email,
                'photo'    => $guardian->photo,
                'status'   => $status,
                'pending'  => $payments->filter(fn($p) => $p->status === 'pending' && $p->due_date && \Carbon\Carbon::parse($p->due_date)->isPast())->count(),
                'review'   => $payments->where('status', 'review')->count(),
                'paid'     => $payments->where('status', 'paid')->count(),
                'total'    => $payments->count(),
                'payments' => $payments->values(), // Esto asegura el array en JSON
                'students' => $guardian->students()->select('students.id', 'students.name', 'students.photo')->get(),
            ];
        });

        return response()->json([
            'metrics'   => $metrics,
            'guardians' => $result
        ]);
    }

    // GET /fees — staff ve todas las cuotas con resumen de pagos
    public function index(Request $request)
    {
        $tenant = app('currentTenant');

        $fees = Fee::where('tenant_id', $tenant->id)
            ->withCount([
                'payments as total_count',
                'payments as paid_count'   => fn($q) => $q->where('status', 'paid'),
                'payments as review_count' => fn($q) => $q->where('status', 'review'),
            ])
            ->withSum(['payments as paid_amount' => fn($q) => $q->where('status', 'paid')], 'fee_id')
            ->orderByDesc('due_date')
            ->get()
            ->each(function ($fee) {
                // paid_amount = paid_count * amount (fee_payments no tienen monto propio)
                $fee->paid_amount = $fee->paid_count * $fee->amount;
            });

        return response()->json(['fees' => $fees]);
    }

    // GET /fees/{id} — detalle de una cuota con todos los pagos
    public function show(Request $request, $tenant, $id)
    {
        $tenant = app('currentTenant');

        $fee = Fee::where('tenant_id', $tenant->id)->findOrFail($id);

        $payments = FeePayment::where('fee_id', $id)
            ->where('tenant_id', $tenant->id)
            ->with(['guardian:id,name,email,photo', 'student:id,name,photo'])
            ->get();

        return response()->json(['fee' => $fee, 'payments' => $payments]);
    }

    // POST /fees — tesorero crea cuota (sin generar fee_payments — se crean al pagar)
    public function store(Request $request)
    {
        $tenant = app('currentTenant');

        $validated = $request->validate([
            'title'         => 'required|string|max:255',
            'description'   => 'nullable|string',
            'amount'        => 'required|numeric|min:0',
            'due_date'      => 'nullable|date',
            'end_date'      => 'nullable|date',
            'type'          => 'nullable|in:once,recurring',
            'recurring_day' => 'nullable|integer|min:1|max:31',
            'target'        => 'nullable|string|in:all,custom',
            'billing_cycle' => 'nullable|string|in:monthly_fixed,quarterly,semi_annual,annual',
            'guardian_ids'  => 'nullable|array',
        ]);

        $type = $validated['type'] ?? 'once';

        if ($type === 'once' && empty($validated['due_date'])) {
            return response()->json(['message' => 'La fecha límite es requerida para cuotas únicas.'], 422);
        }

        $fee = Fee::create([
            'tenant_id'     => $tenant->id,
            'title'         => $validated['title'],
            'description'   => $validated['description'] ?? null,
            'amount'        => $validated['amount'],
            'due_date'      => $validated['due_date'] ?? null,
            'end_date'      => $type === 'recurring' ? ($validated['end_date'] ?? null) : null,
            'target'        => $validated['target'] ?? 'all',
            'type'          => $type,
            'billing_cycle' => $validated['billing_cycle'] ?? 'monthly_fixed',
            'recurring_day' => $type === 'recurring' ? ($validated['recurring_day'] ?? null) : null,
            'created_by'    => $request->user()->id,
        ]);

        $amount = number_format((float)$validated['amount'], 0, ',', '.');
        Guardian::where('tenant_id', $tenant->id)->each(function ($g) use ($tenant, $validated, $amount) {
            Notification::send($tenant->id, $g->id, 'Nueva cuota publicada', "{$validated['title']} — $" . $amount, 'fee', $tenant->slug);
        });

        return response()->json(['fee' => $fee], 201);
    }

    // DELETE /fees/{id}
    public function destroy(Request $request, $tenant, $id)
    {
        $tenant = app('currentTenant');
        $fee = Fee::where('tenant_id', $tenant->id)->findOrFail($id);

        // Eliminar comprobantes S3
        FeePayment::where('fee_id', $fee->id)->each(function ($p) {
            if ($p->proof_url) {
                $path = parse_url($p->proof_url, PHP_URL_PATH);
                Storage::disk('s3')->delete(ltrim($path, '/'));
            }
        });

        FeePayment::where('fee_id', $fee->id)->delete();
        $fee->delete();

        return response()->json(['message' => 'Cuota eliminada']);
    }

    // POST /fees/{id}/approve-payment — tesorero aprueba pago (uno o todos los períodos del guardian)
    public function approvePayment(Request $request, $tenant, $id)
    {
        $tenant = app('currentTenant');

        $validated = $request->validate([
            'guardian_id'    => 'required|integer',
            'payment_method' => 'required|in:transfer,cash',
            'notes'          => 'nullable|string',
            'payment_id'     => 'nullable|integer', // si viene, aprueba solo ese
        ]);

        $query = FeePayment::where('fee_id', $id)
            ->where('tenant_id', $tenant->id)
            ->where('guardian_id', $validated['guardian_id']);

        if (!empty($validated['payment_id'])) {
            $query->where('id', $validated['payment_id']);
        }

        $payments = $query->get();

        foreach ($payments as $payment) {
            $payment->update([
                'status'         => 'paid',
                'payment_method' => $validated['payment_method'],
                'paid_at'        => now(),
                'payment_amount' => $payment->fee->amount ?? 0,
                'approved_by'    => $request->user()->id,
                'notes'          => $validated['notes'] ?? null,
            ]);

            // SINCRONIZACIÓN: Si existe un registro gemelo en la tabla 'payments' (Artes Marciales), aprobarlo también
            if ($payment->period_month && $payment->period_year) {
                \App\Models\Payment::where('tenant_id', $tenant->id)
                    ->where('student_id', $payment->student_id)
                    ->where('status', '!=', 'approved')
                    ->whereMonth('due_date', $payment->period_month)
                    ->whereYear('due_date', $payment->period_year)
                    ->update([
                        'status' => 'approved',
                        'paid_at' => now(),
                        'payment_method' => $validated['payment_method']
                    ]);
            }
        }

        $guardianId = $validated['guardian_id'];
        event(new FeeUpdated($tenant->slug, $guardianId));

        return response()->json(['approved' => $payments->count()]);
    }

    // POST /fees/{id}/reject-payment — tesorero rechaza pago
    public function rejectPayment(Request $request, $tenant, $id)
    {
        $tenant = app('currentTenant');

        $validated = $request->validate([
            'guardian_id' => 'required|integer',
            'payment_id'  => 'required|integer',
            'notes'       => 'nullable|string',
        ]);

        $payment = FeePayment::where('fee_id', $id)
            ->where('tenant_id', $tenant->id)
            ->where('guardian_id', $validated['guardian_id'])
            ->where('id', $validated['payment_id'])
            ->firstOrFail();

        // Al rechazar, volvemos a 'pending' y limpiamos el comprobante para que lo suban de nuevo si quieren
        // O podemos dejarlo pero el status indica que no es válido
        $payment->update([
            'status' => 'pending',
            'notes'  => $validated['notes'] ?? 'Pago rechazado por el tesorero.',
            'proof_url' => null, // Opcional: limpiar para forzar nueva subida
        ]);

        $guardianId = $validated['guardian_id'];
        event(new FeeUpdated($tenant->slug, $guardianId));

        Notification::send($tenant->id, $guardianId, 'Pago rechazado', "Tu pago para '{$payment->fee->title}' ha sido rechazado: " . ($validated['notes'] ?? 'Comprobante no legible o inválido.'), 'fee', $tenant->slug);

        return response()->json(['rejected' => true]);
    }

    // POST /fees/{id}/upload-proof — apoderado sube comprobante
    public function uploadProof(Request $request, $tenant, $id)
    {
        $tenant   = app('currentTenant');
        $guardian = $request->user();

        $request->validate([
            'proof' => 'required|file|mimes:jpeg,png,jpg,webp,heic|max:20480',
        ]);

        if (!$guardian instanceof Guardian) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $payment = FeePayment::where('fee_id', $id)
            ->where('tenant_id', $tenant->id)
            ->where('guardian_id', $guardian->id)
            ->firstOrFail();

        // Subir foto
        $file      = $request->file('proof');
        $imageInfo = $this->imageService->optimize($file, 1200, 1200, 85);
        $optimized = $imageInfo['path'];
        $extension = $imageInfo['extension'];
        
        $filename  = "fee_proof_{$id}_{$guardian->id}_" . time() . ".{$extension}";
        $s3Path    = "tenants/{$tenant->id}/fees/{$filename}";

        Storage::disk('s3')->put($s3Path, file_get_contents($optimized));
        unlink($optimized);

        $proofUrl = Storage::disk('s3')->url($s3Path);

        $payment->update([
            'status'         => 'review',
            'payment_method' => 'transfer',
            'proof_url'      => $proofUrl,
        ]);

        \App\Models\User::where('tenant_id', $tenant->id)->each(function ($staff) use ($tenant, $guardian) {
            \App\Models\Notification::send(
                $tenant->id,
                $staff->id,
                'Nuevo Comprobante de Pago',
                "El apoderado {$guardian->name} ha subido un comprobante para su revisión.",
                'fee',
                $tenant->slug
            );
        });

        return response()->json(['payment' => $payment]);
    }

    // GET /fees/my — apoderado ve sus cuotas con períodos calculados
    public function myFees(Request $request)
    {
        $tenant   = app('currentTenant');
        $guardian = $request->user();

        if (!$guardian instanceof Guardian) return response()->json(['fees' => []]);

        // Obtener enrollments activos de los alumnos del apoderado (con student_id)
        $studentIds = $guardian->students()->pluck('students.id');
        $enrollments = \App\Models\Enrollment::whereIn('student_id', $studentIds)
            ->where('status', 'active')
            ->whereNotNull('plan_id')
            ->get(['student_id', 'plan_id']);

        // Fees globales (target = all) — se muestran una vez, sin student_id específico
        $globalFees = Fee::where('tenant_id', $tenant->id)
            ->where('target', 'all')
            ->get();

        // Fees por plan — una entrada por enrollment (student)
        $planIds = $enrollments->pluck('plan_id')->unique()->filter();
        $planFees = Fee::where('tenant_id', $tenant->id)
            ->whereIn('plan_id', $planIds)
            ->get()
            ->groupBy('plan_id');

        $result = [];

        // Procesar fees globales (una sola vez, sin student_id)
        foreach ($globalFees as $fee) {
            $result[] = $this->buildFeeEntry($fee, $guardian, null);
        }

        // Procesar fees por plan, TODAS LAS ENTRADAS POR ENROLLMENT (por alumno)
        foreach ($enrollments as $enrollment) {
            $fees = $planFees->get($enrollment->plan_id);
            if (!$fees) continue;

            foreach ($fees as $fee) {
                $result[] = $this->buildFeeEntry($fee, $guardian, $enrollment->student_id, $enrollment->id);
            }
        }

        return response()->json(['fees' => $result]);
    }

    private function buildFeeEntry(Fee $fee, $guardian, $studentId, $enrollmentId = null): array
    {
        $periods = $this->calculatePeriods($fee);

        // Si tenemos studentId, filtramos periodos anteriores a su registro
        if ($studentId) {
            $student = \App\Models\Student::find($studentId);
            if ($student) {
                $regMonth = (int)$student->created_at->format('n');
                $regYear  = (int)$student->created_at->format('Y');

                // Mostramos periodos desde el mes de registro inclusive
                // ya que se cobra el mes completo aunque ingresen después
                $periods = array_filter($periods, function($p) use ($regYear, $regMonth) {
                    if ($p['year'] < $regYear) return false;
                    if ($p['year'] == $regYear && $p['month'] < $regMonth) return false;
                    return true;
                });
                $periods = array_values($periods); // reset keys
            }
        }
        $paidPeriods = FeePayment::where('fee_id', $fee->id)
            ->where('guardian_id', $guardian->id)
            ->when($studentId, fn($q) => $q->where('student_id', $studentId))
            ->when($enrollmentId, fn($q) => $q->where('enrollment_id', $enrollmentId))
            ->whereNotNull('period_month')
            ->get()
            ->keyBy(fn($p) => $p->period_year . '-' . $p->period_month);

        $legacyPayment = FeePayment::where('fee_id', $fee->id)
            ->where('guardian_id', $guardian->id)
            ->when($studentId, fn($q) => $q->where('student_id', $studentId))
            ->whereNull('period_month')
            ->first();

        $periodsWithStatus = array_map(function ($period) use ($paidPeriods, $legacyPayment) {
            $key = $period['year'] . '-' . $period['month'];
            $payment = $paidPeriods[$key] ?? null;
            if (!$payment && $legacyPayment) $payment = $legacyPayment;
            
            return [
                ...$period,
                'status'         => $payment?->status ?? 'pending',
                'amount_paid'    => $payment?->payment_amount, // Añado esto para el frontend
                'payment_id'     => $payment?->id,
                'proof_url'      => $payment?->proof_url,
                'payment_method' => $payment?->payment_method,
                'paid_at'        => $payment?->paid_at,
            ];
        }, $periods);

        return [
            'student_id'    => $studentId,
            'enrollment_id' => $enrollmentId, // ← NUEVO: para agrupar en el frontend
            'fee'           => $fee,
            'periods'       => $periodsWithStatus,
        ];
    }

    // POST /fees/submit-payment — apoderado paga uno o varios períodos de una o varias fees
    public function submitPayment(Request $request)
    {
        $tenant   = app('currentTenant');
        $guardian = $request->user();

        if (!$guardian instanceof Guardian) return response()->json(['message' => 'No autorizado'], 403);

        $request->validate([
            'proof'           => 'required|file|mimes:jpeg,png,jpg,webp,heic|max:20480',
            'items'           => 'required|array|min:1',
            'items.*.fee_id'  => 'required|integer',
            'items.*.periods' => 'required|array|min:1',
            'items.*.periods.*.month' => 'required|integer|min:1|max:12',
            'items.*.periods.*.year'  => 'required|integer',
        ]);

        // Subir comprobante una sola vez
        $file      = $request->file('proof');
        $imageInfo = $this->imageService->optimize($file, 1200, 1200, 85);
        $optimized = $imageInfo['path'];
        $extension = $imageInfo['extension'];
        
        $filename  = "fee_proof_bulk_{$guardian->id}_" . time() . ".{$extension}";
        $s3Path    = "tenants/{$tenant->id}/fees/{$filename}";
        Storage::disk('s3')->put($s3Path, file_get_contents($optimized));
        unlink($optimized);
        $proofUrl = Storage::disk('s3')->url($s3Path);

        $created = 0;
        foreach ($request->items as $item) {
            $fee = Fee::where('tenant_id', $tenant->id)->find($item['fee_id']);
            if (!$fee) continue;

            foreach ($item['periods'] as $period) {
                // Evitar duplicados
                $exists = FeePayment::where('fee_id', $fee->id)
                    ->where('guardian_id', $guardian->id)
                    ->where('period_month', $period['month'])
                    ->where('period_year', $period['year'])
                    ->whereIn('status', ['review', 'paid'])
                    ->exists();
                if ($exists) continue;

                FeePayment::updateOrCreate(
                    [
                        'fee_id'       => $fee->id,
                        'tenant_id'    => $tenant->id,
                        'guardian_id'  => $guardian->id,
                        'period_month' => $period['month'],
                        'period_year'  => $period['year'],
                    ],
                    [
                        'status'         => 'review',
                        'payment_method' => 'transfer',
                        'proof_url'      => $proofUrl,
                    ]
                );
                $created++;
            }
        }

        event(new FeeUpdated($tenant->slug, $guardian->id));

        if ($created > 0) {
            \App\Models\User::where('tenant_id', $tenant->id)->each(function ($staff) use ($tenant, $guardian) {
                \App\Models\Notification::send(
                    $tenant->id,
                    $staff->id,
                    'Nuevo Comprobante de Pago',
                    "El apoderado {$guardian->name} ha subido un comprobante para su revisión.",
                    'fee',
                    $tenant->slug
                );
            });
        }

        return response()->json(['created' => $created, 'proof_url' => $proofUrl]);
    }

    public function deleteProof(Request $request, $tenant, $id)
    {
        $tenant   = app('currentTenant');
        $guardian = $request->user();

        if (!$guardian instanceof Guardian) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $payment = FeePayment::where('id', $id)
            ->where('tenant_id', $tenant->id)
            ->where('guardian_id', $guardian->id)
            ->firstOrFail();

        if ($payment->status === 'paid') {
            return response()->json(['message' => 'No se puede eliminar un comprobante ya aprobado'], 422);
        }

        // Borrar de S3
        if ($payment->proof_url) {
            $path = parse_url($payment->proof_url, PHP_URL_PATH);
            if ($path) {
                Storage::disk('s3')->delete(ltrim($path, '/'));
            }
        }

        $payment->delete();

        // Notificar al Staff
        \App\Models\User::where('tenant_id', $tenant->id)->each(function ($staff) use ($tenant, $guardian) {
            \App\Models\Notification::send(
                $tenant->id,
                $staff->id,
                'Comprobante de Cuota Eliminado',
                "El apoderado {$guardian->name} ha eliminado un comprobante de pago que estaba en revisión.",
                'fee',
                $tenant->slug
            );
        });

        event(new FeeUpdated($tenant->slug, $guardian->id));

        return response()->json(['message' => 'Comprobante eliminado correctamente']);
    }

    // Helper: calcula todos los períodos de una fee recurrente
    private function calculatePeriods(Fee $fee): array
    {
        if ($fee->type === 'once') {
            return [[
                'month'    => (int) date('m', strtotime($fee->due_date ?? now())),
                'year'     => (int) date('Y', strtotime($fee->due_date ?? now())),
                'due_date' => $fee->due_date,
                'label'    => $fee->due_date ? date('M Y', strtotime($fee->due_date)) : 'Única',
            ]];
        }

        // Determinar intervalo según billing_cycle
        $interval = match($fee->billing_cycle) {
            'quarterly'    => '+3 months',
            'semi_annual'  => '+6 months',
            'annual'       => '+12 months',
            default        => '+1 month',
        };

        // Recurrente: desde due_date hasta end_date
        $start = $fee->due_date ? new \DateTime($fee->due_date) : new \DateTime('first day of this month');
        $end   = $fee->end_date ? new \DateTime($fee->end_date) : new \DateTime('last day of december this year');

        $periods = [];
        $current = clone $start;
        $current->modify('first day of this month');

        while ($current <= $end) {
            $month = (int) $current->format('m');
            $year  = (int) $current->format('Y');
            $day   = $fee->recurring_day ?? 1;
            $periods[] = [
                'month'    => $month,
                'year'     => $year,
                'due_date' => sprintf('%04d-%02d-%02d', $year, $month, min($day, (int) date('t', mktime(0, 0, 0, $month, 1, $year)))),
                'label'    => $current->format('M Y'),
            ];
            $current->modify($interval);
        }

        return $periods;
    }
}
