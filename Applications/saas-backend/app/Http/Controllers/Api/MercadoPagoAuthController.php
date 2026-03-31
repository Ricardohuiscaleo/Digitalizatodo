<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MercadoPagoAuthController extends Controller
{
    /**
     * Genera la URL para iniciar el flujo de vinculación OAuth.
     */
    public function getAuthUrl(Request $request)
    {
        $tenant = $request->user()->tenant;
        
        if (!$tenant) {
            return response()->json(['error' => 'Tenant no encontrado'], 404);
        }

        $clientId = env('MERCADOPAGO_CLIENT_ID');
        $redirectUri = url('/api/mercadopago/auth/callback'); // Debe coincidir con MP Panel
        
        // El 'state' es opcional pero ayuda a identificar al tenant al regresar
        $authUrl = "https://auth.mercadopago.cl/authorization?client_id={$clientId}&response_type=code&platform_id=mp&state={$tenant->id}&redirect_uri=" . urlencode($redirectUri);

        return response()->json(['url' => $authUrl]);
    }

    /**
     * Procesa el retorno de Mercado Pago con el código de autorización.
     */
    public function handleCallback(Request $request)
    {
        $code = $request->query('code');
        $tenantId = $request->query('state'); // Recuperamos el ID del tenant que enviamos en 'state'

        if (!$code || !$tenantId) {
            Log::error('MercadoPago OAuth Error: Falta de código o tenant id en el callback.');
            return redirect('https://admin.digitalizatodo.cl/dashboard?mp_status=error');
        }

        try {
            $response = Http::asForm()->post('https://api.mercadopago.com/oauth/token', [
                'client_secret' => env('MERCADOPAGO_CLIENT_SECRET'),
                'client_id' => env('MERCADOPAGO_CLIENT_ID'),
                'grant_type' => 'authorization_code',
                'code' => $code,
                'redirect_uri' => url('/api/mercadopago/auth/callback'),
            ]);

            if ($response->successful()) {
                $data = $response->json();
                
                $tenant = Tenant::findOrFail($tenantId);
                $tenant->update([
                    'mercadopago_access_token' => $data['access_token'],
                    'mercadopago_refresh_token' => $data['refresh_token'],
                    'mercadopago_user_id' => $data['user_id'],
                    'mercadopago_auth_status' => 'connected',
                    'mercadopago_terms_accepted_at' => now(),
                ]);

                Log::info("MercadoPago OAuth Success: Tenant {$tenant->name} vinculado con éxito.");
                return redirect('https://admin.digitalizatodo.cl/dashboard?mp_status=success');
            } else {
                Log::error('MercadoPago Token Exchange Failed: ' . $response->body());
                return redirect('https://admin.digitalizatodo.cl/dashboard?mp_status=exchange_failed');
            }
        } catch (\Exception $e) {
            Log::error('MercadoPago OAuth Exception: ' . $e->getMessage());
            return redirect('https://admin.digitalizatodo.cl/dashboard?mp_status=exception');
        }
    }
}
