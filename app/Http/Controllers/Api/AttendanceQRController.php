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

        // Generamos un bloque de tiempo de 1 minuto (60 segundos)
        $timeBlock = floor(time() / 60);
        $secret = config('app.key');
        
        // El payload es simplemente el ID del tenant asociado a este bloque de tiempo
        $hashString = "tenant:{$tenant->id}|block:{$timeBlock}|secret:{$secret}";
        $token = substr(hash('sha256', $hashString), 0, 16);

        // Retornamos el token, y cuántos segundos le quedan de validez a ESTE ciclo de 60s
        $expiresIn = 60 - (time() % 60);

        // Guardamos en caché por la duración del ciclo de 1 min + 4 min de gracia = 5 minutos total (300s).
        \Illuminate\Support\Facades\Cache::put("totp_qr_{$token}", $tenant->id, 300);
        // Limpiar estado de escaneo previo para este token
        \Illuminate\Support\Facades\Cache::forget("qr_scanned_{$token}");

        Log::debug(" [DEBUG-QR] GENERACION ", [
            'tenant_id' => $tenant->id,
            'tenant_slug' => $tenant->slug,
            'time' => time(),
            'block' => $timeBlock,
            'token' => $token,
            'key_snippet' => substr($secret, 0, 10) . '...'
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
        $currentBlock = floor(time() / 60);
        
        Log::debug(" [DEBUG-QR] VALIDACION ", [
            'received_token' => $token,
            'looking_for_tenant_id' => $tenantId,
            'current_time' => time(),
            'current_block' => $currentBlock,
            'key_snippet' => substr($secret, 0, 10) . '...'
        ]);

        // Ventana de tiempo: actual y 4 anteriores (5 minutos total de validez)
        for ($i = 0; $i <= 4; $i++) {
            $block = $currentBlock - $i;
            $hashString = "tenant:{$tenantId}|block:{$block}|secret:{$secret}";
            $expectedToken = substr(hash('sha256', $hashString), 0, 16);
            
            if (hash_equals($expectedToken, $token)) {
                Log::debug(" [DEBUG-QR] MATCH ENCONTRADO ", ['block' => $block, 'i' => $i]);
                return true;
            }
        }

        Log::debug(" [DEBUG-QR] FALLO TOTAL VALIDACION ");
        return false;
    }

    /**
     * Consulta si un token QR fue escaneado.
     * GET /api/{tenant}/attendance/qr-status?token=xxx
     */
    public function status(Request $request, $tenant)
    {
        $token = $request->query('token');
        if (!$token) return response()->json(['scanned' => false]);

        $data = \Illuminate\Support\Facades\Cache::get("qr_scanned_{$token}");
        if (!$data) return response()->json(['scanned' => false]);

        // Limpiar para que no se repita
        \Illuminate\Support\Facades\Cache::forget("qr_scanned_{$token}");

        return response()->json([
            'scanned' => true,
            'student' => $data,
        ]);
    }
    {
        return \Illuminate\Support\Facades\Cache::get("totp_qr_{$token}");
    }
}
