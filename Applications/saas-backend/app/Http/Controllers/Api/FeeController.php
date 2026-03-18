<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Fee;
use App\Models\FeePayment;
use App\Models\Guardian;
use App\Services\ImageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class FeeController extends Controller
{
    public function __construct(protected ImageService $imageService) {}

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
            ->orderByDesc('due_date')
            ->get();

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

    // POST /fees — tesorero crea cuota y genera fee_payments para todos los apoderados
    public function store(Request $request)
    {
        $tenant = app('currentTenant');

        $validated = $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'amount'      => 'required|numeric|min:0',
            'due_date'    => 'required|date',
            'target'      => 'nullable|string|in:all,custom',
            'guardian_ids'=> 'nullable|array',
        ]);

        $fee = Fee::create([
            'tenant_id'   => $tenant->id,
            'title'       => $validated['title'],
            'description' => $validated['description'] ?? null,
            'amount'      => $validated['amount'],
            'due_date'    => $validated['due_date'],
            'target'      => $validated['target'] ?? 'all',
            'created_by'  => $request->user()->id,
        ]);

        // Generar fee_payments
        if (($validated['target'] ?? 'all') === 'all') {
            $guardians = Guardian::where('tenant_id', $tenant->id)->where('active', true)->get();
        } else {
            $guardians = Guardian::where('tenant_id', $tenant->id)
                ->whereIn('id', $validated['guardian_ids'] ?? [])
                ->get();
        }

        foreach ($guardians as $guardian) {
            FeePayment::create([
                'fee_id'     => $fee->id,
                'tenant_id'  => $tenant->id,
                'guardian_id'=> $guardian->id,
                'status'     => 'pending',
            ]);
        }

        return response()->json(['fee' => $fee, 'payments_created' => $guardians->count()], 201);
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

    // POST /fees/{id}/approve-payment — tesorero aprueba pago (efectivo o comprobante)
    public function approvePayment(Request $request, $tenant, $id)
    {
        $tenant = app('currentTenant');

        $validated = $request->validate([
            'guardian_id'    => 'required|integer',
            'payment_method' => 'required|in:transfer,cash',
            'notes'          => 'nullable|string',
        ]);

        $payment = FeePayment::where('fee_id', $id)
            ->where('tenant_id', $tenant->id)
            ->where('guardian_id', $validated['guardian_id'])
            ->firstOrFail();

        $payment->update([
            'status'         => 'paid',
            'payment_method' => $validated['payment_method'],
            'paid_at'        => now(),
            'approved_by'    => $request->user()->id,
            'notes'          => $validated['notes'] ?? null,
        ]);

        return response()->json(['payment' => $payment]);
    }

    // POST /fees/{id}/upload-proof — apoderado sube comprobante
    public function uploadProof(Request $request, $tenant, $id)
    {
        $tenant = app('currentTenant');
        $user   = $request->user();

        $request->validate([
            'proof' => 'required|image|mimes:jpeg,png,jpg,webp,heic|max:20480',
        ]);

        // Buscar el guardian del usuario autenticado
        $guardian = Guardian::where('tenant_id', $tenant->id)
            ->where('user_id', $user->id)
            ->first();

        if (!$guardian) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $payment = FeePayment::where('fee_id', $id)
            ->where('tenant_id', $tenant->id)
            ->where('guardian_id', $guardian->id)
            ->firstOrFail();

        // Subir foto
        $file      = $request->file('proof');
        $optimized = $this->imageService->optimize($file, 1200, 1200, 85);
        $filename  = "fee_proof_{$id}_{$guardian->id}_" . time() . ".webp";
        $s3Path    = "tenants/{$tenant->id}/fees/{$filename}";

        Storage::disk('s3')->put($s3Path, file_get_contents($optimized));
        unlink($optimized);

        $proofUrl = Storage::disk('s3')->url($s3Path);

        $payment->update([
            'status'         => 'review',
            'payment_method' => 'transfer',
            'proof_url'      => $proofUrl,
        ]);

        return response()->json(['payment' => $payment]);
    }

    // GET /fees/my — apoderado ve sus cuotas pendientes
    public function myFees(Request $request)
    {
        $tenant = app('currentTenant');
        $user   = $request->user();

        $guardian = Guardian::where('tenant_id', $tenant->id)
            ->where('user_id', $user->id)
            ->first();

        if (!$guardian) {
            return response()->json(['fees' => []]);
        }

        $payments = FeePayment::where('tenant_id', $tenant->id)
            ->where('guardian_id', $guardian->id)
            ->with('fee')
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['payments' => $payments]);
    }
}
