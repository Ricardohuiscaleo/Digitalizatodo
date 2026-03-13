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

            $latestReview = null;
            foreach ($students as $student) {
                $reviewPayment = \App\Models\Payment::where('tenant_id', $student->tenant_id)
                    ->whereIn('enrollment_id', $student->enrollments->pluck('id'))
                    ->where('status', 'pending_review')
                    ->latest()
                    ->first();

                if ($reviewPayment) {
                    $status = 'review';
                    $latestReview = $reviewPayment;
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

            $s3BaseUrl = 'https://' . config('services.s3.bucket', 'digitalizatodo') . '.s3.' . config('services.s3.region', 'us-east-1') . '.amazonaws.com/';

            return [
                'id' => $guardian->id,
                'name' => $guardian->name,
                'photo' => $guardian->photo ? (str_starts_with($guardian->photo, 'http') ? $guardian->photo : $s3BaseUrl . $guardian->photo) : "https://i.pravatar.cc/150?u=" . $guardian->id,
                'status' => $status,
                'proof_image' => $latestReview ? (str_starts_with($latestReview->proof_image, 'http') ? $latestReview->proof_image : $s3BaseUrl . $latestReview->proof_image) : null,
                'pricing' => $pricing,
                'enrolledStudents' => $students->map(function ($s) use ($s3BaseUrl) {
                    return [
                        'id' => $s->id,
                        'name' => $s->name,
                        'category' => $s->category,
                        'photo' => $s->photo ? (str_starts_with($s->photo, 'http') ? $s->photo : $s3BaseUrl . $s->photo) : "https://i.pravatar.cc/150?img=" . $s->id,
                        'label' => $s->belt_rank ?? '',
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
            \App\Models\Payment::where('tenant_id', $tenantId)
                ->whereIn('enrollment_id', $student->enrollments->pluck('id'))
                ->where('status', 'pending_review')
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
            'logo' => 'required|image|max:20480', // Aceptamos hasta 20MB
        ]);

        if ($request->hasFile('logo')) {
            $file = $request->file('logo');
            
            try {
                // Optimizar logo a un máximo de 500x500px para la UI
                $optimizedPath = $this->imageService->optimize($file, 500, 500, 85);
                
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
                $optimizedPath = $this->imageService->optimize($file, 400, 400, 85);
                
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
}
