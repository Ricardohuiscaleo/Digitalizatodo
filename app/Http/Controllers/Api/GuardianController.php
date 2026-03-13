<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guardian;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class GuardianController extends Controller
{
    /**
     * List all guardians (Payers) grouped by account status.
     */
    public function index(Request $request)
    {
        $tenant = app('currentTenant');
        $tenantId = $tenant->id;

        $guardians = Guardian::where('tenant_id', $tenantId)
            ->with(['students' => function ($query) use ($tenantId) {
            $query->where('tenant_id', $tenantId);
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
            'photo' => $guardian->photo ? (str_starts_with($guardian->photo, 'http') ? $guardian->photo : 'https://' . env('AWS_BUCKET', env('S3_BUCKET', 'digitalizatodo')) . '.s3.' . env('AWS_DEFAULT_REGION', env('S3_REGION', 'us-east-1')) . '.amazonaws.com/' . $guardian->photo) : "https://i.pravatar.cc/150?u=" . $guardian->id,
            'status' => $status,
            'pricing' => $pricing,
            'enrolledStudents' => $students->map(function ($s) {
                    return [
                    'id' => $s->id,
                    'name' => $s->name,
                    'category' => $s->category,
                    'photo' => $s->photo ? (str_starts_with($s->photo, 'http') ? $s->photo : 'https://' . env('AWS_BUCKET', env('S3_BUCKET', 'digitalizatodo')) . '.s3.' . env('AWS_DEFAULT_REGION', env('S3_REGION', 'us-east-1')) . '.amazonaws.com/' . $s->photo) : "https://i.pravatar.cc/150?img=" . $s->id,
                    'label' => $s->belt_rank ?? '',
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
            \App\Models\Payment::where('tenant_id', $tenantId)
                ->whereIn('enrollment_id', $student->enrollments->pluck('id'))
                ->where('status', 'proof_uploaded')
                ->update(['status' => 'approved', 'paid_at' => now()]);
        }

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
            'logo' => 'required|image|max:5120',
        ]);

        if ($request->hasFile('logo')) {
            $file = $request->file('logo');
            $src = imagecreatefromstring(file_get_contents($file->getRealPath()));
            $w = imagesx($src);
            $h = imagesy($src);
            $scale = min(1, 400 / max($w, $h));
            $nw = (int)($w * $scale);
            $nh = (int)($h * $scale);
            $dst = imagecreatetruecolor($nw, $nh);
            imagecopyresampled($dst, $src, 0, 0, 0, 0, $nw, $nh, $w, $h);
            ob_start();
            imagewebp($dst, null, 80);
            $webp = ob_get_clean();

            $s3Path = 'digitalizatodo/' . $tenantId . '/logo/' . Str::uuid() . '.webp';
            Storage::disk('s3')->put($s3Path, $webp);

            $bucket = env('AWS_BUCKET', env('S3_BUCKET'));
            $region = env('AWS_DEFAULT_REGION', env('S3_REGION', 'us-east-1'));
            $url = "https://{$bucket}.s3.{$region}.amazonaws.com/{$s3Path}";
            $tenant->update(['logo' => $url]);

            return response()->json(['message' => 'Logo actualizado', 'logo_url' => $url]);
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
}
