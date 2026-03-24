<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Api\AttendanceQRController;

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

        // Filtro por mes: ?month=2025-03
        if ($month = $request->query('month')) {
            $query->whereRaw("DATE_FORMAT(date, '%Y-%m') = ?", [$month]);
        }

        $attendances = $query->get();

        return response()->json([
            'attendance' => $attendances->map(fn($a) => [
                'id' => $a->id,
                'student_id' => $a->student_id,
                'student' => $a->student ? [
                    'id' => $a->student->id,
                    'name' => $a->student->name,
                    'photo' => $a->student->photo,
                    'belt_rank' => $a->student->belt_rank,
                    'degrees' => (int)($a->student->degrees ?? 0),
                    'payment_status' => (function() use ($a) {
                        $now = now();
                        $hasOverdue = $a->student->enrollments->contains(function($e) use ($now) {
                            return $e->payments->contains(function($p) use ($now) {
                                return in_array($p->status, ['pending', 'overdue']) && $p->due_date && $p->due_date->isPast();
                            });
                        });
                        
                        $hasPendingReview = $a->student->enrollments->contains(function($e) {
                            return $e->payments->contains(function($p) {
                                return in_array($p->status, ['pending_review', 'proof_uploaded']);
                            });
                        });
                        
                        if ($hasOverdue) return 'overdue';
                        if ($hasPendingReview) return 'pending';
                        return 'paid';
                    })()
                ] : null,
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

        $student = \App\Models\Student::find($request->student_id);

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

        try {
            event(new \App\Events\StudentCheckedIn(
                $student->id,
                $student->name ?? '',
                $student->photo ?? '',
                $tenant->slug
            ));
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Broadcast checked-in failed', ['error' => $e->getMessage()]);
        }

        // Notificar a cada apoderado del alumno
        foreach ($student->guardians as $g) {
            \App\Models\Notification::send($tenantId, $g->id, 'Asistencia registrada', "{$student->name} fue marcado/a presente.", 'attendance', $tenant->slug);
        }

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
        try {
            $tenant = app('currentTenant');
            
            Log::debug(" [DEBUG-QR] Iniciando verificación ", [
                'request_all' => $request->all(),
                'tenant_id' => $tenant->id
            ]);

            $request->validate([
                'qr_token' => 'required|string',
                'student_id' => 'required|exists:students,id',
            ]);

            $isValid = AttendanceQRController::isValidForTenant($request->qr_token, $tenant->id);
            
            if (!$isValid) {
                $cachedTenantId = AttendanceQRController::validateToken($request->qr_token);
                $isValid = ($cachedTenantId == $tenant->id);
            }

            if (!$isValid) {
                return response()->json(['message' => 'Código QR inválido o expirado'], 422);
            }

            $student = \App\Models\Student::where('id', $request->student_id)
                ->where('tenant_id', $tenant->id)
                ->first();

            if (!$student) {
                return response()->json(['message' => 'Estudiante no pertenece a este tenant o no existe'], 404);
            }

            $isPersonalized = filter_var($request->is_personalized, FILTER_VALIDATE_BOOLEAN);

            if ($isPersonalized) {
                if ($student->consumable_credits <= 0) {
                    return response()->json(['message' => 'No tienes clases personalizadas disponibles'], 422);
                }
                $student->decrement('consumable_credits');
            }

            $attendance = Attendance::updateOrCreate(
                [
                    'tenant_id' => $tenant->id,
                    'student_id' => $student->id,
                    'date' => now()->format('Y-m-d'),
                ],
                [
                    'status' => 'present',
                    'type' => $isPersonalized ? 'personalized' : 'regular',
                    'notes' => $isPersonalized ? 'Clase Personalizada (1-a-1)' : 'Registrado vía QR',
                    'registration_method' => 'qr',
                ]
            );

            // Intentar disparar el evento, pero capturar fallo si Reverb no responde
            try {
                event(new \App\Events\StudentCheckedIn(
                    $student->id, 
                    $student->name, 
                    $student->photo, 
                    $tenant->slug
                ));
            } catch (\Throwable $e) {
                Log::warning("Broadcasting failed but attendance was saved", ['error' => $e->getMessage()]);
            }

            // Guardar en cache para fallback qr-status (por si WebSocket falla)
            \Illuminate\Support\Facades\Cache::put("qr_scanned_{$request->qr_token}", [
                'id' => $student->id,
                'name' => $student->name,
                'photo' => $student->photo,
            ], 120);

            // Notificar a staff del tenant
            foreach ($tenant->users as $staffUser) {
                \App\Models\Notification::send($tenant->id, $staffUser->id, 'Check-in vía QR', "{$student->name} registró asistencia escaneando QR.", 'attendance', $tenant->slug);
            }

            return response()->json([
                'success' => true,
                'message' => '¡Asistencia registrada!',
                'attendance' => $attendance
            ]);

        } catch (\Throwable $e) {
            Log::error("QR_FATAL_ERROR: " . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json([
                'error' => true,
                'message' => 'Error interno del servidor (Throwable): ' . $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], 500);
        }
    }

    /**
     * Elimina la asistencia de hoy de un estudiante específico.
     * DELETE /api/{tenant}/attendance/{student_id}
     */
    public function destroy(Request $request, $tenant, $studentId): JsonResponse
    {
        $tenantModel = app('currentTenant');
        
        $attendance = Attendance::where('tenant_id', $tenantModel->id)
            ->where('student_id', $studentId)
            ->where('date', now()->format('Y-m-d'))
            ->first();

        if (!$attendance) {
            return response()->json(['message' => 'No se encontró asistencia para hoy'], 404);
        }

        $student = \App\Models\Student::find($studentId);
        $attendance->delete();

        try {
            event(new \App\Events\StudentCheckedOut(
                $studentId,
                $student?->name ?? '',
                app('currentTenant')->slug
            ));
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Broadcast checked-out failed', ['error' => $e->getMessage()]);
        }

        // Notificar a cada apoderado
        if ($student) {
            foreach ($student->guardians as $g) {
                \App\Models\Notification::send($tenantModel->id, $g->id, 'Asistencia removida', "Se removió la asistencia de {$student->name}.", 'attendance', $tenantModel->slug);
            }
        }

        return response()->json([
            'message' => 'Asistencia eliminada correctamente'
        ]);
    }
}