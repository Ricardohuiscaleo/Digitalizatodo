<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Services\ImageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ExpenseController extends Controller
{
    public function __construct(protected ImageService $imageService) {}

    public function index(Request $request)
    {
        $tenant = app('currentTenant');

        $expenses = Expense::where('tenant_id', $tenant->id)
            ->with('creator:id,name')
            ->orderByDesc('expense_date')
            ->orderByDesc('created_at')
            ->get();

        $summary = Expense::where('tenant_id', $tenant->id)
            ->selectRaw('category, SUM(amount) as total, COUNT(*) as count')
            ->groupBy('category')
            ->get();

        $totalGastado = $expenses->sum('amount');

        // Recaudado = suma de fee_payments pagados en este tenant
        $recaudado = \App\Models\FeePayment::where('tenant_id', $tenant->id)
            ->where('status', 'paid')
            ->join('fees', 'fee_payments.fee_id', '=', 'fees.id')
            ->sum('fees.amount');

        return response()->json([
            'expenses'   => $expenses,
            'summary'    => $summary,
            'total'      => $totalGastado,
            'collected'  => $recaudado,
            'balance'    => $recaudado - $totalGastado,
        ]);
    }

    public function store(Request $request)
    {
        $tenant = app('currentTenant');

        $validated = $request->validate([
            'title'        => 'required|string|max:255',
            'description'  => 'nullable|string',
            'amount'       => 'required|numeric|min:0',
            'category'     => 'required|string|max:100',
            'expense_date' => 'required|date',
            'receipt_photo'=> 'nullable|image|mimes:jpeg,png,jpg,webp,heic|max:20480',
            'product_photo'=> 'nullable|image|mimes:jpeg,png,jpg,webp,heic|max:20480',
        ]);

        $receiptUrl = $this->uploadPhoto($request, 'receipt_photo', $tenant->id, 'receipt');
        $productUrl = $this->uploadPhoto($request, 'product_photo', $tenant->id, 'product');

        $expense = Expense::create([
            'tenant_id'     => $tenant->id,
            'title'         => $validated['title'],
            'description'   => $validated['description'] ?? null,
            'amount'        => $validated['amount'],
            'category'      => $validated['category'],
            'expense_date'  => $validated['expense_date'],
            'receipt_photo' => $receiptUrl,
            'product_photo' => $productUrl,
            'created_by'    => $request->user()->id,
        ]);

        return response()->json(['expense' => $expense->load('creator:id,name')], 201);
    }

    public function destroy(Request $request, $tenant, $id)
    {
        $tenant  = app('currentTenant');
        $expense = Expense::where('tenant_id', $tenant->id)->findOrFail($id);

        // Eliminar fotos de S3
        foreach (['receipt_photo', 'product_photo'] as $field) {
            if ($expense->$field) {
                $path = parse_url($expense->$field, PHP_URL_PATH);
                Storage::disk('s3')->delete(ltrim($path, '/'));
            }
        }

        $expense->delete();
        return response()->json(['message' => 'Gasto eliminado']);
    }

    private function uploadPhoto(Request $request, string $field, int $tenantId, string $prefix): ?string
    {
        if (!$request->hasFile($field)) return null;

        try {
            $file     = $request->file($field);
            $optimized = $this->imageService->optimize($file, 1200, 1200, 85);
            $filename  = "expense_{$prefix}_" . time() . ".webp";
            $s3Path    = "tenants/{$tenantId}/expenses/{$filename}";

            Storage::disk('s3')->put($s3Path, file_get_contents($optimized));
            unlink($optimized);

            return Storage::disk('s3')->url($s3Path);
        } catch (\Exception $e) {
            \Log::error("Error subiendo {$field}: " . $e->getMessage());
            return null;
        }
    }
}
