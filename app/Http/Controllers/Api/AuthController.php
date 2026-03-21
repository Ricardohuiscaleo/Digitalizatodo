<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guardian;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * POST /api/{tenant}/auth/login
     */
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
            'remember' => 'nullable|boolean',
        ]);

        /** @var \App\Models\Tenant $tenant */
        $tenant = app('currentTenant');

        try {
            $userType = 'staff';
            $passwordValidated = false;

            // Buscar staff por email (sin filtrar tenant — soporta multi-tenant)
            $user = User::where('email', $credentials['email'])->first();

            if ($user && Hash::check($credentials['password'], $user->password)) {
                // Verificar que tiene acceso a este tenant
                if (!$user->hasAccessToTenant($tenant->id)) {
                    return response()->json(['message' => 'No tienes acceso a esta organización.'], 403);
                }
                $passwordValidated = true;
            } else {
                // Intentar como Guardian del tenant
                $guardian = Guardian::where('email', $credentials['email'])
                    ->where('tenant_id', $tenant->id)
                    ->where('active', true)
                    ->first();

                if ($guardian && Hash::check($credentials['password'], $guardian->password)) {
                    $user = $guardian;
                    $userType = 'guardian';
                    $passwordValidated = true;
                }
            }

            if (!$passwordValidated) {
                return response()->json(['message' => 'Credenciales inválidas.'], 401);
            }

            $tokenPrefix = ($userType === 'staff') ? 'staff-' : 'portal-';
            $token = $user->createToken($tokenPrefix . $tenant->id)->plainTextToken;

            // Manejo de "Recordar sesión"
            $rememberToken = null;
            if ($request->boolean('remember')) {
                $rememberToken = Str::random(60);
                $user->forceFill([
                    'remember_token' => $rememberToken,
                ])->save();
            }

            $role = ($userType === 'staff') ? $user->getRoleForTenant($tenant->id) : null;

            return response()->json([
                'token' => $token,
                'remember_token' => $rememberToken,
                'user_type' => $userType,
                'role' => $role,
                'user' => $user->only('id', 'name', 'email', 'phone'),
                'tenant' => $tenant->only('id', 'slug', 'name', 'primary_color', 'logo'),
            ]);
        }
        catch (\Throwable $e) {
            return response()->json([
                'message' => 'Error crítico en el login.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/{tenant}/me
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user instanceof User) {
            $tenant = app('currentTenant');
            $role = $user->getRoleForTenant($tenant->id);
            return response()->json([
                'user_type' => 'staff',
                'id'        => $user->id,
                'name'      => $user->name,
                'email'     => $user->email,
                'role'      => $role,
                'tenant_id' => $tenant->id,
                'tenant'    => [
                    'id'            => $tenant->id,
                    'slug'          => $tenant->slug,
                    'name'          => $tenant->name,
                    'logo'          => $tenant->logo,
                    'primary_color' => $tenant->primary_color,
                    'industry'      => $tenant->industry,
                    'data'          => $tenant->data,
                ],
            ]);
        }

        if ($user instanceof Guardian) {
            // Perfil de Guardian
            $tenant = app('currentTenant');
            $bankInfo = $tenant->data['bank_info'] ?? null;

            $guardian = $user->load([
                'students.enrollments.plan',
                'students.enrollments.payments' => fn($q) => $q->whereIn('status', ['pending', 'pending_review'])->orderBy('due_date'),
                'students.attendances' => fn($q) => $q->orderBy('date', 'desc')->limit(5),
            ]);

            $s3Base = 'https://' . env('AWS_BUCKET', env('S3_BUCKET')) . '.s3.' . env('AWS_DEFAULT_REGION', env('S3_REGION', 'us-east-1')) . '.amazonaws.com/';
            $toUrl = fn($path) => $path ? (str_starts_with($path, 'http') ? $path : $s3Base . $path) : null;

            $allEnrollmentIds = $guardian->students->flatMap->enrollments->pluck('id')->filter();

            // Calcular total_due: solo pagos pending/overdue
            $totalDue = $guardian->students->flatMap->enrollments->flatMap->payments
                ->whereIn('status', ['pending', 'overdue'])
                ->sum('amount');

            return response()->json([
                'user_type' => 'guardian',
                'guardian'  => $guardian->only('id', 'name', 'email', 'phone', 'photo'),
                'tenant'    => [
                    'id'            => $tenant->id,
                    'slug'          => $tenant->slug,
                    'name'          => $tenant->name,
                    'logo'          => $tenant->logo ? (str_starts_with($tenant->logo, 'http') ? $tenant->logo : $toUrl($tenant->logo)) : null,
                    'primary_color' => $tenant->primary_color,
                    'industry'      => $tenant->industry,
                ],
                'bank_info' => $bankInfo,
                'students'  => $guardian->students->map(fn($s) => [
                    'id'                => $s->id,
                    'name'              => $s->name,
                    'photo'             => $toUrl($s->photo),
                    'category'          => $s->category ?? 'Sin Categoría',
                    'belt_rank'         => $s->belt_rank,
                    'attendance_count'  => \App\Models\Attendance::where('student_id', $s->id)->where('status', 'present')->count(),
                    'pending_payments'  => $s->enrollments->flatMap->payments->count(),
                    'recent_attendance' => $s->attendances->map(fn($a) => [
                        'date'   => $a->date->format('Y-m-d'),
                        'status' => $a->status,
                    ]),
                    'payments' => $s->enrollments->flatMap->payments->map(fn($p) => [
                        'id'          => $p->id,
                        'amount'      => $p->amount,
                        'due_date'    => $p->due_date?->format('d M, Y'),
                        'status'      => $p->status,
                        'proof_image' => $toUrl($p->proof_image),
                    ]),
                ]),
                'total_due' => round($totalDue),
            $paymentHistoryQuery = \App\Models\Payment::whereIn('enrollment_id', $allEnrollmentIds)
                ->whereIn('status', ['approved', 'pending_review']);

            $feePayments = collect([]);
            if ($tenant->industry === 'school_treasury') {
                $feePayments = \App\Models\FeePayment::where('guardian_id', $guardian->id)
                    ->whereIn('status', ['paid', 'review'])
                    ->with('fee')
                    ->orderByDesc('updated_at')
                    ->limit(10)
                    ->get()
                    ->map(fn($fp) => [
                        'id'          => $fp->id,
                        'amount'      => $fp->fee->amount ?? 0,
                        'status'      => $fp->status === 'paid' ? 'approved' : 'pending_review',
                        'paid_at'     => $fp->paid_at?->format('d M, Y'),
                        'due_date'    => \Carbon\Carbon::create($fp->period_year, $fp->period_month, 1)->format('M Y'),
                        'proof_image' => $fp->proof_url, // Mapeamos proof_url a proof_image para la PWA
                        'is_fee'      => true,
                        'title'       => ($fp->fee->title ?? 'Cuota') . " - " . \Carbon\Carbon::create(null, $fp->period_month)->translatedFormat('M') . " {$fp->period_year}",
                    ]);
            }

            $regularHistory = $paymentHistoryQuery->orderByDesc('updated_at')
                ->limit(10)
                ->get()
                ->map(fn($p) => [
                    'id'          => $p->id,
                    'amount'      => $p->amount,
                    'status'      => $p->status,
                    'paid_at'     => $p->paid_at?->format('d M, Y'),
                    'due_date'    => $p->due_date?->format('d M, Y'),
                    'proof_image' => $toUrl($p->proof_image),
                    'is_fee'      => false,
                    'title'       => 'Pago de Mensualidad',
                ]);

            $combinedHistory = $regularHistory->concat($feePayments)
                ->sortByDesc(fn($item) => $item['paid_at'] ?? $item['due_date'])
                ->take(15)
                ->values();

            return response()->json([
                'user_type' => 'guardian',
                'guardian'  => $guardian->only('id', 'name', 'email', 'phone', 'photo'),
                'tenant'    => [
                    'id'            => $tenant->id,
                    'slug'          => $tenant->slug,
                    'name'          => $tenant->name,
                    'logo'          => $tenant->logo ? (str_starts_with($tenant->logo, 'http') ? $tenant->logo : $toUrl($tenant->logo)) : null,
                    'primary_color' => $tenant->primary_color,
                    'industry'      => $tenant->industry,
                ],
                'bank_info' => $bankInfo,
                'students'  => $guardian->students->map(fn($s) => [
                    'id'                => $s->id,
                    'name'              => $s->name,
                    'photo'             => $toUrl($s->photo),
                    'category'          => $s->category ?? 'Sin Categoría',
                    'belt_rank'         => $s->belt_rank,
                    'attendance_count'  => \App\Models\Attendance::where('student_id', $s->id)->where('status', 'present')->count(),
                    'pending_payments'  => $s->enrollments->flatMap->payments->count(),
                    'recent_attendance' => $s->attendances->map(fn($a) => [
                        'date'   => $a->date->format('Y-m-d'),
                        'status' => $a->status,
                    ]),
                    'payments' => $s->enrollments->flatMap->payments->map(fn($p) => [
                        'id'          => $p->id,
                        'amount'      => $p->amount,
                        'due_date'    => $p->due_date?->format('d M, Y'),
                        'status'      => $p->status,
                        'proof_image' => $toUrl($p->proof_image),
                    ]),
                ]),
                'total_due' => round($totalDue),
                'payment_history' => $combinedHistory,
            ]);
        }

        return response()->json(['message' => 'No autorizado'], 401);
    }

    /**
     * POST /api/{tenant}/logout
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Sesión cerrada.']);
    }

    /**
     * POST /api/{tenant}/auth/resume
     */
    public function resume(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'remember_token' => 'required|string',
        ]);

        $tenant = app('currentTenant');

        // Intentamos buscar en Staff (User)
        $user = User::where('remember_token', $credentials['remember_token'])->first();
        $userType = 'staff';

        if ($user) {
            // Verificar acceso al tenant
            if (!$user->hasAccessToTenant($tenant->id)) {
                $user = null;
            }
        }

        if (!$user) {
            // Si no está en Staff, buscamos en Guardians
            $user = Guardian::where('remember_token', $credentials['remember_token'])
                ->where('tenant_id', $tenant->id)
                ->where('active', true)
                ->first();
            $userType = 'guardian';
        }

        if (!$user) {
            return response()->json(['message' => 'Token de persistencia inválido o expirado.'], 401);
        }

        // Generamos un nuevo token de acceso (Sanctum)
        $tokenPrefix = ($userType === 'staff') ? 'staff-' : 'portal-';
        $token = $user->createToken($tokenPrefix . $tenant->id)->plainTextToken;

        return response()->json([
            'token' => $token,
            'user_type' => $userType,
        ]);
    }

    /**
     * POST /api/{tenant}/auth/register (para onboarding)
     */
    public function register(Request $request): JsonResponse
    {
        $tenant = app('currentTenant');

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:guardians,email',
            'phone' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $guardian = Guardian::create([
            'tenant_id' => $tenant->id,
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
        ]);

        $token = $guardian->createToken("portal-{$tenant->id}")->plainTextToken;

        return response()->json(['token' => $token, 'guardian' => $guardian->only('id', 'name', 'email')], 201);
    }
}