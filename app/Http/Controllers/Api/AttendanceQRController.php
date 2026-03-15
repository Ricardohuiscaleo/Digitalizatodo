<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class AttendanceQRController extends Controller
{
    public function generate(Request $request, $tenant)
    {
        $tenant = app('currentTenant');

        if (!$request->user() || !in_array($request->user()->id, $tenant->users->pluck('id')->toArray())) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $timeBlock = floor(time() / 60);
        $secret = config('app.key');
        $hashString = "tenant:{$tenant->id}|block:{$timeBlock}|secret:{$secret}";
        $token = substr(hash('sha256', $hashString), 0, 16);
        $expiresIn = 60 - (time() % 60);

        Cache::put("totp_qr_{$token}", $tenant->id, 300);
        Cache::forget("qr_scanned_{$token}");

        return response()->json([
            'token' => $token,
            'expires_in' => $expiresIn,
            'tenant_name' => $tenant->name,
        ]);
    }

    public static function isValidForTenant($token, $tenantId)
    {
        $secret = config('app.key');
        $currentBlock = floor(time() / 60);

        for ($i = 0; $i <= 4; $i++) {
            $block = $currentBlock - $i;
            $hashString = "tenant:{$tenantId}|block:{$block}|secret:{$secret}";
            $expectedToken = substr(hash('sha256', $hashString), 0, 16);

            if (hash_equals($expectedToken, $token)) {
                return true;
            }
        }

        return false;
    }

    public function status(Request $request, $tenant)
    {
        $token = $request->query('token');
        if (!$token) {
            return response()->json(['scanned' => false]);
        }

        $data = Cache::get("qr_scanned_{$token}");
        if (!$data) {
            return response()->json(['scanned' => false]);
        }

        Cache::forget("qr_scanned_{$token}");

        return response()->json([
            'scanned' => true,
            'student' => $data,
        ]);
    }

    public static function validateToken($token)
    {
        return Cache::get("totp_qr_{$token}");
    }
}
