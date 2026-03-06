<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    /**
     * Lista el historial de asistencia de los alumnos del apoderado.
     * GET /api/{tenant}/attendance
     */
    public function index(Request $request): JsonResponse
    {
        $guardian = $request->user();
        $studentId = $request->query('student_id');

        $query = Attendance::whereIn('student_id', $guardian->students->pluck('id'))
            ->with('student')
            ->orderBy('date', 'desc');

        if ($studentId) {
            $query->where('student_id', $studentId);
        }

        $attendances = $query->get();

        return response()->json([
            'attendances' => $attendances->map(fn($a) => [
        'id' => $a->id,
        'student_name' => $a->student->name,
        'date' => $a->date->format('Y-m-d'),
        'status' => $a->status,
        'notes' => $a->notes,
        ]),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $tenantId = $request->header('X-Tenant-Id');

        $request->validate([
            'student_id' => 'required|exists:students,id',
            'status' => 'required|in:present,absent',
            'notes' => 'nullable|string',
        ]);

        $attendance = Attendance::updateOrCreate(
        [
            'tenant_id' => $tenantId,
            'student_id' => $request->student_id,
            'date' => now()->format('Y-m-d'),
        ],
        [
            'status' => $request->status,
            'notes' => $request->notes,
        ]
        );

        return response()->json([
            'message' => 'Asistencia registrada correctamente',
            'attendance' => $attendance
        ]);
    }
}