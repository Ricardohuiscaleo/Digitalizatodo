<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class AttendanceQRController extends Controller
{
    /**
     * Genera un token TOTP (Time-based One Time Password) para el tenant.
     * Cambia cada 30 segundos basado en tiempo UNIX.
     */
    public function generate(Request $request, $tenant)
    {
        /** @var \App\Models\Tenant $tenant */
        $tenant = app('currentTenant');

        // Solo dueños o profesores pueden generar el QR
        if (!$request->user() || !in_array($request->user()->id, $tenant->users->pluck('id')->toArray())) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        // Generamos un bloque de tiempo de 2 minutos (120 segundos)
        $timeBlock = floor(time() / 120);
        $secret = config('app.key');
        
        // El payload es simplemente el ID del tenant asociado a este bloque de tiempo
        $hashString = "tenant:{$tenant->id}|block:{$timeBlock}|secret:{$secret}";
        $token = substr(hash('sha256', $hashString), 0, 16);

        // Retornamos el token, y cuántos segundos le quedan de validez a ESTE ciclo de 120s
        $expiresIn = 120 - (time() % 120);

        // Guardamos en caché por la duración del ciclo de 2 min + 13 min de gracia = 15 minutos total (900s).
        \Illuminate\Support\Facades\Cache::put("totp_qr_{$token}", $tenant->id, 900);

        Log::info("QR Token Generated", [
            'token' => $token,
            'tenant_id' => $tenant->id,
            'block' => $timeBlock,
            'expires_in' => $expiresIn
        ]);

        return response()->json([
            'token' => $token,
            'expires_in' => $expiresIn,
            'tenant_name' => $tenant->name
        ]);
    }

    /**
     * Valida si un token es válido para un tenant específico en la ventana de tiempo actual.
     */
    public static function isValidForTenant($token, $tenantId)
    {
        $secret = config('app.key');
        $currentBlock = floor(time() / 120);
        
        Log::info("QR Validation attempt", [
            'token' => $token,
            'tenantId' => $tenantId,
            'time' => time(),
            'currentBlock' => $currentBlock
        ]);

        // Ventana de tiempo: actual y 4 anteriores (10 minutos total de validez)
        for ($i = 0; $i <= 4; $i++) {
            $block = $currentBlock - $i;
            $hashString = "tenant:{$tenantId}|block:{$block}|secret:{$secret}";
            $expectedToken = substr(hash('sha256', $hashString), 0, 16);
            
            Log::debug("Checking block", [
                'block' => $block,
                'expected' => $expectedToken,
                'received' => $token
            ]);

            if (hash_equals($expectedToken, $token)) {
                Log::info("QR Token matched in block", ['block' => $block]);
                return true;
            }
        }

        Log::warning("QR Token validation failed after checking windows", [
            'token' => $token,
            'tenantId' => $tenantId
        ]);

        return false;
    }

    /**
     * Mantenemos por compatibilidad para otros usos si existen
     */
    public static function validateToken($token)
    {
        return \Illuminate\Support\Facades\Cache::get("totp_qr_{$token}");
    }
}
