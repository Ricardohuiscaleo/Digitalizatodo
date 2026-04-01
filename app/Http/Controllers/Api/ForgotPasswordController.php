<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guardian;
use App\Models\User;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use App\Mail\PasswordResetMail;

class ForgotPasswordController extends Controller
{
    /**
     * Send a password reset link to the given user.
     */
    public function sendResetLink(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $tenant = app('currentTenant');
        $email = $request->email;

        // 1. Search for Staff (User)
        $user = User::where('email', $email)->first();
        $userType = 'staff';

        // 2. If not Staff, search for Guardian (Student/Parent) in this tenant
        if (!$user) {
            $user = Guardian::where('email', $email)
                ->where('tenant_id', $tenant->id)
                ->first();
            $userType = 'guardian';
        }

        if (!$user) {
            // We return success anyway to avoid email enumeration
            return response()->json(['message' => 'Si el correo existe en nuestro sistema, recibirás un link de recuperación en breve.']);
        }

        // 3. Generate Token
        $token = Str::random(64);
        
        // 4. Store Token
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $email],
            [
                'token' => Hash::make($token),
                'created_at' => now(),
            ]
        );

        // 5. Send Email
        try {
            Mail::to($email)->send(new PasswordResetMail($user, $token, $tenant));
        } catch (\Exception $e) {
            \Log::error("Error sending password reset email to {$email}: " . $e->getMessage());
            return response()->json(['message' => 'Error al enviar el correo. Por favor intenta más tarde.'], 500);
        }

        return response()->json(['message' => 'Si el correo existe en nuestro sistema, recibirás un link de recuperación en breve.']);
    }

    /**
     * Reset the user's password.
     */
    public function reset(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required|string',
            'email' => 'required|email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $tenant = app('currentTenant');
        
        // 1. Verify Token
        $record = DB::table('password_reset_tokens')->where('email', $request->email)->first();

        if (!$record || !Hash::check($request->token, $record->token)) {
            return response()->json(['message' => 'El token es inválido o ha expirado.'], 422);
        }

        // Token is valid for 60 minutes
        if (now()->parse($record->created_at)->addMinutes(60)->isPast()) {
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();
            return response()->json(['message' => 'El token ha expirado.'], 422);
        }

        // 2. Identify User/Guardian
        $user = User::where('email', $request->email)->first();
        if (!$user) {
            $user = Guardian::where('email', $request->email)
                ->where('tenant_id', $tenant->id)
                ->first();
        }

        if (!$user) {
            return response()->json(['message' => 'No pudimos encontrar un usuario con ese correo.'], 404);
        }

        // 3. Update Password
        $user->password = Hash::make($request->password);
        $user->save();

        // 4. Delete Token
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        return response()->json(['message' => 'Tu contraseña ha sido actualizada con éxito. Ya puedes iniciar sesión.']);
    }
}
