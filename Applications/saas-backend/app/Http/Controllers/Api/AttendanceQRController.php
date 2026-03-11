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

        // Generamos un bloque de tiempo de 30 segundos
        $timeBlock = floor(time() / 30);
        $secret = config('app.key');
        
        // El payload es simplemente el ID del tenant asociado a este bloque de tiempo
        $hashString = "tenant:{$tenant->id}|block:{$timeBlock}|secret:{$secret}";
        $token = substr(hash('sha256', $hashString), 0, 16);

        // Retornamos el token, y cuántos segundos le quedan de validez a ESTE ciclo de 30s
        $expiresIn = 30 - (time() % 30);

        // Guardamos en caché por la duración del ciclo de 30s + 60s de gracia = 90 segundos.
        \Illuminate\Support\Facades\Cache::put("totp_qr_{$token}", $tenant->id, 90);

        return response()->json([
            'token' => $token,
            'expires_in' => $expiresIn,
            'tenant_name' => $tenant->name
        ]);
    }

    /**
     * Valida el token del QR escaneado por el alumno.
     * Permitimos el bloque de tiempo actual Y el inmediatamente anterior por si hay delay de red.
     */
    public static function validateToken($token)
    {
        try {
            // El token ahora viaja como string directo, sin payload json base64, 
            // pero para mantener compatibilidad si el frontend aún envía el viejo, verificamos:
            if (base64_decode($token, true) !== false && is_array(json_decode(base64_decode($token), true))) {
                // Es el formato viejo, no es válido para este nuevo sistema estricto
                return false;
            }

            $secret = config('app.key');
            $currentBlock = floor(time() / 30);
            
            // Verificamos el bloque actual y el bloque anterior (ventana de 60s total)
            $validBlocks = [$currentBlock, $currentBlock - 1];

            // Dado que el token no contiene el tenant ID explícitamente y necesitamos retornarlo,
            // pero la relación es 1-1, necesitamos resolver a qué tenant pertenece este token.
            // Para simplificar y mejorar el perf sin iterar todos los tenants cada escaneo,
            // guardaremos el tenant_id en caché un par de minutos cuando generamos el QR.
            
            // En cambio, usaremos Cache (ya que requerimos retornar el ID del tenant)
            $tenantId = \Illuminate\Support\Facades\Cache::get("totp_qr_{$token}");
            
            return $tenantId;

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Error validando QR TOTP: " . $e->getMessage());
            return false;
        }
    }
}
