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
        $user = $request->user();
        $tenant = app('currentTenant');
        $tenantId = $tenant->id;
        $studentId = $request->query('student_id');

        // Staff ve toda la asistencia del tenant; Guardian solo la de sus alumnos
        if ($user instanceof \App\Models\User) {
            $query = Attendance::where('tenant_id', $tenantId)
                ->with('student')
                ->orderBy('date', 'desc');
        }
        else {
            $query = Attendance::whereIn('student_id', $user->students->pluck('id'))
                ->with('student')
                ->orderBy('date', 'desc');
        }

        if ($studentId) {
            $query->where('student_id', $studentId);
        }

        $attendances = $query->get();

        return response()->json([
            'attendance' => $attendances->map(fn($a) => [
        'id' => $a->id,
        'student_id' => $a->student_id,
        'student' => $a->student ? ['id' => $a->student->id, 'name' => $a->student->name, 'photo' => $a->student->photo] : null,
        'date' => $a->date instanceof \Carbon\Carbon ? $a->date->format('Y-m-d') : $a->date,
        'status' => $a->status,
        'created_at' => $a->created_at,
        'notes' => $a->notes,
        ]),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $tenant = app('currentTenant');
        $tenantId = $tenant->id;

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

    /**
     * Valida el token del QR y registra la asistencia.
     * POST /api/{tenant}/attendance/verify-qr
     */
    public function verifyQR(Request $request, $tenantSlug)
    {
        $tenant = app('currentTenant'); // Usamos el ya resuelto por el middleware
        
        $request->validate([
            'qr_token' => 'required|string',
            'student_id' => 'required|exists:students,id',
        ]);

        $tenantId = AttendanceQRController::validateToken($request->qr_token);

        if (!$tenantId || $tenantId != $tenant->id) {
            return response()->json(['message' => 'Código QR inválido o expirado'], 422);
        }

        $student = \App\Models\Student::where('id', $request->student_id)
            ->where('tenant_id', $tenant->id)
            ->first();

        if (!$student) {
            return response()->json(['message' => 'Estudiante no encontrado'], 404);
        }

        $attendance = Attendance::updateOrCreate(
        [
            'tenant_id' => $tenant->id,
            'student_id' => $student->id,
            'date' => now()->format('Y-m-d'),
        ],
        [
            'status' => 'present',
            'notes' => 'Registrado vía QR por el usuario',
        ]
        );

        return response()->json([
            'message' => '¡Asistencia registrada con éxito!',
            'attendance' => $attendance
        ]);
    }
}