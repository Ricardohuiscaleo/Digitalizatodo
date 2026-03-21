<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PushSubscription;
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

        $user = $request->user();
        $userType = null;
        if ($user instanceof \App\Models\Guardian) {
            $userType = 'guardian';
        } else {
            $userType = 'staff';
        }

        $data = [
            'user_id'    => $user?->id,
            'tenant_id'  => $tenant->id,
            'public_key' => $request->public_key,
            'auth_token' => $request->auth_token,
        ];

        // Schema-Aware: Only use user_type if the column has been created by the migration
        if (\Illuminate\Support\Facades\Schema::hasColumn('push_subscriptions', 'user_type')) {
            $data['user_type'] = $userType;
        }

        PushSubscription::updateOrCreate(
            ['endpoint' => $request->endpoint],
            $data
        );

        return response()->json(['ok' => true]);
    }
}
