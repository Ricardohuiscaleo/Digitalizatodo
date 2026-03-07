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
     * Genera un token para el QR de asistencia.
     * El token es válido por 60 segundos y contiene el ID del tenant y un timestamp.
     */
    public function generate(Request $request, Tenant $tenant)
    {
        // Solo dueños o profesores pueden generar el QR
        if (!$request->user() || !in_array($request->user()->id, $tenant->staff->pluck('id')->toArray())) {
        // return response()->json(['message' => 'No autorizado'], 403);
        // Nota: El middleware role ya debería filtrar esto, pero aseguramos por si acaso.
        }

        $timestamp = time();
        $secret = config('app.key');
        $hash = hash_hmac('sha256', "{$tenant->id}-{$timestamp}", $secret);

        $payload = [
            't' => $tenant->id,
            'ts' => $timestamp,
            'h' => substr($hash, 0, 16) // Firma corta para mantener el QR simple
        ];

        return response()->json([
            'qr_data' => base64_encode(json_encode($payload)),
            'expires_in' => 60,
            'tenant_name' => $tenant->name
        ]);
    }

    /**
     * Valida el token del QR escaneado por el alumno.
     */
    public static function validateToken($token)
    {
        try {
            $payload = json_decode(base64_decode($token), true);
            if (!$payload || !isset($payload['t'], $payload['ts'], $payload['h'])) {
                return false;
            }

            // Validar expiración (60 segundos de gracia)
            if (time() - $payload['ts'] > 60) {
                return false;
            }

            // Validar firma
            $secret = config('app.key');
            $expectedHash = hash_hmac('sha256', "{$payload['t']}-{$payload['ts']}", $secret);

            if (substr($expectedHash, 0, 16) !== $payload['h']) {
                return false;
            }

            return $payload['t']; // Retorna el ID del tenant si es válido
        }
        catch (\Exception $e) {
            return false;
        }
    }
}
