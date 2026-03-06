<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guardian;
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
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $tenant = app('currentTenant');

        // 1. Intentar buscar como Staff (User)
        $user = \App\Models\User::where('tenant_id', $tenant->id)
            ->where('email', $request->email)
            ->first();

        if ($user && Hash::check($request->password, $user->password)) {
            $token = $user->createToken("staff-{$tenant->id}")->plainTextToken;
            return response()->json([
                'token' => $token,
                'user_type' => 'staff',
                'user' => $user->only('id', 'name', 'email'),
                'tenant' => $tenant->only('id', 'name', 'primary_color', 'logo'),
            ]);
        }

        // 2. Intentar buscar como Guardian
        $guardian = Guardian::where('tenant_id', $tenant->id)
            ->where('email', $request->email)
            ->where('active', true)
            ->first();

        if ($guardian && Hash::check($request->password, $guardian->password)) {
            $token = $guardian->createToken("portal-{$tenant->id}")->plainTextToken;
            return response()->json([
                'token' => $token,
                'user_type' => 'guardian',
                'user' => $guardian->only('id', 'name', 'email', 'phone'),
                'tenant' => $tenant->only('id', 'name', 'primary_color', 'logo'),
            ]);
        }

        return response()->json(['message' => 'Credenciales incorrectas.'], 401);
    }

    /**
     * GET /api/{tenant}/me
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user instanceof \App\Models\User) {
            // Perfil de Staff
            return response()->json([
                'user_type' => 'staff',
                'user' => $user->only('id', 'name', 'email'),
            ]);
        }

        if ($user instanceof Guardian) {
            // Perfil de Guardian
            $guardian = $user->load([
                'students.enrollments.plan',
                'students.enrollments.payments' => fn($q) => $q->where('status', 'pending')->orderBy('due_date'),
                'students.attendances' => fn($q) => $q->orderBy('date', 'desc')->limit(5),
            ]);

            return response()->json([
                'user_type' => 'guardian',
                'guardian' => $guardian->only('id', 'name', 'email', 'phone'),
                'students' => $guardian->students->map(fn($s) => [
            'id' => $s->id,
            'name' => $s->name,
            'photo' => $s->photo,
            'category' => $s->category,
            'is_updated' => $s->is_updated,
            'pending_payments' => $s->enrollments->flatMap->payments->count(),
            'recent_attendance' => $s->attendances->map(fn($a) => [
            'date' => $a->date->format('Y-m-d'),
            'status' => $a->status,
            ]),
            ]),
                'total_due' => $guardian->total_due,
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