<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class PushController extends Controller
{
    /**
     * Devuelve la clave pública VAPID para que el cliente pueda suscribirse.
     */
    public function vapidPublicKey(Request $request)
    {
        $key = env('VAPID_PUBLIC_KEY');

        if (!$key) {
            return response()->json(['error' => 'VAPID key not configured'], 500);
        }

        return response()->json(['key' => $key]);
    }

    /**
     * Guarda la suscripción push del cliente.
     */
    public function subscribe(Request $request)
    {
        $tenant = app('currentTenant');

        $request->validate([
            'endpoint'   => 'required|string',
            'public_key' => 'required|string',
            'auth_token' => 'required|string',
        ]);

        \Log::info('[Push] Suscripción recibida', [
            'user_id' => $request->user()?->id,
            'tenant'  => $tenant->slug,
        ]);

        return response()->json(['ok' => true]);
    }
}
