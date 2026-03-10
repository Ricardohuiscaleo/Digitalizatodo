<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guardian;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

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
        ]);

        /** @var \App\Models\Tenant $tenant */
        $tenant = app('currentTenant');

        try {
            // Buscamos el usuario en staff (User) o clientes (Guardian) de forma agnóstica
            $user = User::where('email', $credentials['email'])->where('tenant_id', $tenant->id)->first();
            $userType = 'staff';
            $passwordValidated = false;

            // Intentar validar contraseña contra el perfil de Staff
            if ($user && Hash::check($credentials['password'], $user->password)) {
                $passwordValidated = true;
            } else {
                // Si no existe como Staff o la contraseña no coincide, intentamos buscar y validar como Guardian
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

            return response()->json([
                'token' => $token,
                'user_type' => $userType,
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
            return response()->json([
                'user_type' => 'staff',
                'id'        => $user->id,
                'name'      => $user->name,
                'email'     => $user->email,
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
            // Perfil de Guardian con protecciones anti-nulos
            $guardian = $user->load([
                'students.enrollments.plan',
                'students.enrollments.payments' => fn($q) => $q->where('status', 'pending')->orderBy('due_date'),
                'students.attendances' => fn($q) => $q->orderBy('date', 'desc')->limit(5),
                'students.attendances as all_attendances' => fn($q) => $q->where('status', 'present'),
            ]);

            return response()->json([
                'user_type' => 'guardian',
                'guardian' => $guardian->only('id', 'name', 'email', 'phone', 'photo'),
                'students' => $guardian->students ? $guardian->students->map(fn($s) => [
                    'id' => $s->id,
                    'name' => $s->name,
                    'photo' => reset_photo_url($s->photo),
                    'category' => $s->category ?? 'Sin Categoría',
                    'belt_rank' => $s->belt_rank,
                    'attendance_count' => $s->all_attendances ? $s->all_attendances->count() : 0,
                    'pending_payments' => $s->enrollments ? $s->enrollments->flatMap->payments->count() : 0,
                    'recent_attendance' => $s->attendances ? $s->attendances->map(fn($a) => [
                        'date' => $a->date->format('Y-m-d'),
                        'status' => $a->status,
                    ]) : [],
                ]) : [],
                'total_due' => $guardian->total_due,
                'payment_history' => $guardian->students ? \App\Models\Payment::whereIn(
                    'enrollment_id',
                    $guardian->students->flatMap->enrollments->pluck('id')->filter()
                )->where('status', 'approved')->orderByDesc('paid_at')->limit(6)->get()->map(fn($p) => [
                    'id' => $p->id,
                    'amount' => $p->amount,
                    'status' => $p->status,
                    'paid_at' => $p->paid_at?->format('d M, Y'),
                    'due_date' => $p->due_date?->format('d M, Y'),
                ]) : collect([]),
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