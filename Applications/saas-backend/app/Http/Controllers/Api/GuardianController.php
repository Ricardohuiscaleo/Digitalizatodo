<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guardian;
use App\Models\Tenant;
use Illuminate\Http\Request;

class GuardianController extends Controller
{
    /**
     * List all guardians (Payers) grouped by account status.
     */
    public function index(Request $request)
    {
        $tenantId = $request->header('X-Tenant-Id');

        $guardians = Guardian::where('tenant_id', $tenantId)
            ->with(['students' => function ($query) use ($tenantId) {
            $query->where('tenant_id', $tenantId);
        }])
            ->get()
            ->map(function ($guardian) {
            // Calculate status based on payments of their students
            // Simplified logic: checking if any student has pending/review payments
            $students = $guardian->students;
            $status = 'paid';

            foreach ($students as $student) {
                $hasReview = \App\Models\Payment::where('tenant_id', $student->tenant_id)
                    ->whereIn('enrollment_id', $student->enrollments->pluck('id'))
                    ->where('status', 'proof_uploaded')
                    ->exists();

                if ($hasReview) {
                    $status = 'review';
                    break;
                }

                $hasPending = \App\Models\Payment::where('tenant_id', $student->tenant_id)
                    ->whereIn('enrollment_id', $student->enrollments->pluck('id'))
                    ->where('status', 'pending')
                    ->exists();

                if ($hasPending && $status !== 'review') {
                    $status = 'pending';
                }
            }

            return [
            'id' => $guardian->id,
            'name' => $guardian->name,
            'photo' => $guardian->photo ?\Storage::disk('public')->url($guardian->photo) : "https://i.pravatar.cc/150?u=" . $guardian->id,
            'status' => $status,
            'enrolledStudents' => $students->map(function ($s) {
                    return [
                    'id' => $s->id,
                    'name' => $s->name,
                    'type' => $s->category === 'adults' ? 'adult' : 'kids',
                    'photo' => $s->photo ?\Storage::disk('public')->url($s->photo) : "https://i.pravatar.cc/150?img=" . $s->id,
                    'belt' => $s->belt_rank ?? 'Blanco',
                    ];
                }
                ),
                ];
            });

        return response()->json(['payers' => $guardians]);
    }

    /**
     * Update tenant pricing and settings stored in JSON data column.
     */
    public function updatePricing(Request $request)
    {
        $tenantId = $request->header('X-Tenant-Id');
        $tenant = Tenant::findOrFail($tenantId);

        $data = $tenant->data ?? [];
        $data['pricing'] = $request->input('prices');

        $tenant->update(['data' => $data]);

        return response()->json(['message' => 'Configuración actualizada', 'prices' => $data['pricing']]);
    }

    /**
     * Approve a payment (simplified from guardian context).
     */
    public function approvePayment(Request $request, $id)
    {
        // For simplicity in this PWA version, we'll approve all pending 'proof_uploaded' 
        // payments for the students of this guardian.
        $tenantId = $request->header('X-Tenant-Id');
        $guardian = Guardian::where('tenant_id', $tenantId)->findOrFail($id);

        foreach ($guardian->students as $student) {
            \App\Models\Payment::where('tenant_id', $tenantId)
                ->whereIn('enrollment_id', $student->enrollments->pluck('id'))
                ->where('status', 'proof_uploaded')
                ->update(['status' => 'approved', 'paid_at' => now()]);
        }

        return response()->json(['message' => 'Pagos aprobados correctamente']);
    }
}
