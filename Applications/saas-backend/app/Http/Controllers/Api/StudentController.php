<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $tenantId = $request->header('X-Tenant-Id');
        $students = \App\Models\Student::where('tenant_id', $tenantId)
            ->with(['enrollments' => fn($q) => $q->where('status', 'active')])
            ->get()
            ->map(function ($student) {
            // Calcular si tiene pagos pendientes
            $pendingPayments = $student->enrollments->sum(fn($e) => $e->payments()->where('status', 'pending')->count());
            return [
            'id' => $student->id,
            'name' => $student->name,
            'category' => $student->category,
            'photo' => $student->photo,
            'has_debt' => $pendingPayments > 0,
            'pending_count' => $pendingPayments,
            ];
        });

        return response()->json(['students' => $students]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
    //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
    //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
    //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
    //
    }
}