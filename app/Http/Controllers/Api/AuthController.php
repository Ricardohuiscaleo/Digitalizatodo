<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guardian;
use App\Models\User;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * POST /api/admin/login
     * Global login for Super Admins (tenant_id IS NULL)
     */
    public function globalLogin(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $credentials['email'])
            ->whereNull('tenant_id') // Crucial: Only users without tenant_id
            ->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            return response()->json(['message' => 'Acceso denegado. Solo administradores globales.'], 401);
        }

        if (!$user->active) {
            return response()->json(['message' => 'Cuenta desactivada.'], 403);
        }

        $token = $user->createToken('super-admin-access')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $user->only('id', 'name', 'email'),
            'is_super_admin' => true
        ]);
    }

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

            if ($user && Hash::check($credentials['password'], $user->password) && $user->hasAccessToTenant($tenant->id)) {
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
                } elseif ($user && Hash::check($credentials['password'], $user->password) && !$user->hasAccessToTenant($tenant->id)) {
                    // Si el staff no tiene acceso y tampoco es un guardián válido, damos el 403
                    return response()->json(['message' => 'No tienes acceso a esta organización.'], 403);
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
            $permissions = ($userType === 'staff') ? $this->getPermissionsForRole($role, $tenant) : [];

            return response()->json([
                'token' => $token,
                'remember_token' => $rememberToken,
                'user_type' => $userType,
                'role' => $role,
                'permissions' => $permissions,
                'user' => $user->only('id', 'name', 'email', 'phone'),
                'tenant' => [
                    'id' => $tenant->id,
                    'slug' => $tenant->slug,
                    'name' => $tenant->name,
                    'primary_color' => $tenant->primary_color,
                    'logo' => $tenant->logo,
                    'saas_plan' => $tenant->saas_plan,
                    'mercadopago_auth_status' => $tenant->mercadopago_auth_status,
                    'force_terms_acceptance' => false,
                ],
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
            $permissions = $this->getPermissionsForRole($role, $tenant);
            
            return response()->json([
                'user_type' => 'staff',
                'id'        => $user->id,
                'name'      => $user->name,
                'email'     => $user->email,
                'role'      => $role,
                'permissions' => $permissions,
                'tenant_id' => $tenant->id,
                'tenant'    => [
                    'id'            => $tenant->id,
                    'slug'          => $tenant->slug,
                    'name'          => $tenant->name,
                    'logo'          => $tenant->logo,
                    'primary_color' => $tenant->primary_color,
                    'industry'      => $tenant->industry,
                    'data'          => $tenant->data,
                    'bank_name'     => $tenant->bank_name,
                    'bank_account_type' => $tenant->bank_account_type,
                    'bank_account_number' => $tenant->bank_account_number,
                    'bank_account_holder' => $tenant->bank_account_holder,
                    'bank_rut'      => $tenant->bank_rut,
                    'saas_plan'     => $tenant->saas_plan,
                    'mercadopago_auth_status' => $tenant->mercadopago_auth_status,
                    'force_terms_acceptance' => false,
                ],
            ]);

        }

        if ($user instanceof Guardian) {
            // Perfil de Guardian
            $tenant = app('currentTenant');
            $bankInfo = [
                'bank_name'      => $tenant->bank_name,
                'account_type'   => $tenant->bank_account_type,
                'account_number' => $tenant->bank_account_number,
                'holder_name'    => $tenant->bank_account_holder,
                'holder_rut'     => $tenant->bank_rut,
            ];

            $guardian = $user->load([
                'students.enrollments.plan',
                'students.enrollments.payments' => fn($q) => $q->whereIn('status', ['pending', 'pending_review'])->orderBy('due_date'),
                'students.attendances' => fn($q) => $q->orderBy('date', 'desc')->limit(5),
            ]);

            $s3Base = 'https://' . env('AWS_BUCKET', env('S3_BUCKET')) . '.s3.' . env('AWS_DEFAULT_REGION', env('S3_REGION', 'us-east-1')) . '.amazonaws.com/';
            $toUrl = fn($path) => $path ? (str_starts_with($path, 'http') ? $path : $s3Base . $path) : null;

            $allEnrollmentIds = $guardian->students->flatMap->enrollments->pluck('id')->filter();

            // Calcular total_due: pagos pending/overdue (Payments) + fee_payments pending/overdue
            $regularDebts = $guardian->students->flatMap->enrollments->flatMap->payments
                ->whereIn('status', ['pending', 'overdue'])
                ->sum('amount');
            
            $feeDebts = \App\Models\FeePayment::where('guardian_id', $guardian->id)
                ->whereIn('status', ['pending', 'overdue'])
                ->with('fee')
                ->get()
                ->sum(fn($fp) => $fp->fee?->amount ?? 0);

            $totalDue = $regularDebts + $feeDebts;

            $paymentHistoryQuery = \App\Models\Payment::whereIn('enrollment_id', $allEnrollmentIds)
                ->whereIn('status', ['approved', 'pending_review']);

            $feePayments = collect([]);
            if ($tenant->industry === 'school_treasury' || true) { // Permitir siempre para ver historial de cuotas
                $feePayments = \App\Models\FeePayment::where('guardian_id', $guardian->id)
                    ->whereIn('status', ['paid', 'review'])
                    ->with('fee')
                    ->orderByDesc('updated_at')
                    ->limit(10)
                    ->get()
                    ->map(fn($fp) => [
                        'id'             => $fp->id,
                        'amount'         => $fp->fee?->amount ?? 0,
                        'status'         => $fp->status === 'paid' ? 'approved' : 'pending_review',
                        'paid_at'        => $fp->paid_at?->format('d M, Y'),
                        'due_date'       => \Carbon\Carbon::create($fp->period_year, $fp->period_month, 1)->format('M Y'),
                        'proof_image'    => $fp->proof_url,
                        'payment_method' => $fp->payment_method,
                        'is_fee'         => true,
                        'title'          => ($fp->fee?->title ?? 'Cuota') . " - " . \Carbon\Carbon::create(null, $fp->period_month)->translatedFormat('M') . " {$fp->period_year}",
                    ]);
            }

            $regularHistory = $paymentHistoryQuery->orderByDesc('updated_at')
                ->limit(10)
                ->get()
                ->map(fn($p) => [
                    'id'             => $p->id,
                    'amount'         => $p->amount,
                    'status'         => $p->status,
                    'paid_at'        => $p->paid_at?->format('d M, Y'),
                    'due_date'       => $p->due_date?->format('d M, Y'),
                    'proof_image'    => $toUrl($p->proof_image),
                    'payment_method' => $p->payment_method, // Inyectamos método
                    'is_fee'         => false,
                    'title'          => 'Pago de Mensualidad',
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
                'students'  => $guardian->students->map(function($s) {
                    // Buscar el próximo vencimiento pendiente
                    $nextFee = \App\Models\FeePayment::where('student_id', $s->id)
                        ->where('status', 'pending')
                        ->orderBy('period_year')
                        ->orderBy('period_month')
                        ->first();
                    
                    $nextRegular = $s->enrollments->flatMap->payments
                        ->where('status', 'pending')
                        ->sortBy('due_date')
                        ->first();

                    $nextDate = null;
                    $nextAmount = 0;

                    if ($nextFee && $nextRegular) {
                        $feeDate = \Carbon\Carbon::create($nextFee->period_year, $nextFee->period_month, 1);
                        if ($feeDate->lt($nextRegular->due_date)) {
                            $nextDate = $feeDate->format('d M, Y');
                            $nextAmount = $nextFee->fee?->amount ?? 0;
                        } else {
                            $nextDate = $nextRegular->due_date->format('d M, Y');
                            $nextAmount = $nextRegular->amount;
                        }
                    } elseif ($nextFee) {
                        $nextDate = \Carbon\Carbon::create($nextFee->period_year, $nextFee->period_month, 1)->format('d M, Y');
                        $nextAmount = $nextFee->fee?->amount ?? 0;
                    } elseif ($nextRegular) {
                        $nextDate = $nextRegular->due_date->format('d M, Y');
                        $nextAmount = $nextRegular->amount;
                    }

                    return [
                        'id'                => $s->id,
                        'name'              => $s->name,
                        'photo'             => $this->toS3Url($s->photo),
                        'category'          => $s->category ?? 'Sin Categoría',
                        'belt_rank'         => $s->belt_rank,
                        'degrees'           => (int)($s->degrees ?? 0),
                        'modality'          => $s->modality,
                        'attendance_count'  => \App\Models\Attendance::where('student_id', $s->id)->where('status', 'present')->count(),
                        'total_attendances' => \App\Models\Attendance::where('student_id', $s->id)->where('status', 'present')->count(),
                        'previous_classes'  => (int)($s->previous_classes ?? 0),
                        'payerStatus'       => $s->enrollments->contains(fn($e) => $e->payments->contains(fn($p) => in_array($p->status, ['pending', 'overdue']) && $p->due_date && $p->due_date->isPast())) ? 'overdue' : ($s->enrollments->contains(fn($e) => $e->payments->contains(fn($p) => in_array($p->status, ['pending_review', 'proof_uploaded']))) ? 'pending' : 'paid'),
                        'pending_payments'  => $s->enrollments->flatMap->payments->whereIn('status', ['pending', 'overdue'])->count() + \App\Models\FeePayment::where('student_id', $s->id)->whereIn('status', ['pending', 'overdue'])->count(),
                        'next_payment_date' => $nextDate,
                        'next_payment_amount' => round($nextAmount),
                        'recent_attendance' => $s->attendances->map(fn($a) => [
                            'date'   => $a->date->format('Y-m-d'),
                            'status' => $a->status,
                        ]),
                    ];
                }),
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

    /**
     * Helper to get permissions based on the role and tenant.
     */
    private function getPermissionsForRole(?string $role, Tenant $tenant): array
    {
        if ($role === 'owner') {
            return ['*'];
        }

        if (!$role) {
            return [];
        }

        $permissionsMap = $tenant->role_permissions ?? [];
        return $permissionsMap[$role] ?? [];
    }
}