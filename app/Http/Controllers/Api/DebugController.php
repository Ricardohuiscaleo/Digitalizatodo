<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class DebugController extends Controller
{
    public function index()
    {
        $checks = [
            'deploy_ver' => 'v102',
            'php_version' => PHP_VERSION,
            'laravel_version' => app()->version(),
            'environment' => app()->environment(),
            'broadcast' => [
                'driver' => config('broadcasting.default'),
                'reverb_app_id' => config('broadcasting.connections.reverb.app_id'),
                'reverb_host' => config('reverb.servers.reverb.host', 'not set'),
                'reverb_port' => config('reverb.servers.reverb.port', 'not set'),
            ],
            'database' => $this->checkDatabase(),
        ];

        // Test broadcast: GET /api/debug?emit=concentracao-arica
        if ($slug = request()->query('emit')) {
            $checks['broadcast_test'] = $this->testBroadcast($slug);
        }

        return response()->json($checks);
    }

    private function testBroadcast(string $slug): array
    {
        try {
            event(new \App\Events\StudentCheckedIn(999, 'TEST_BROADCAST', null, $slug));
            return ['status' => 'EMITTED', 'channel' => "attendance.{$slug}", 'event' => 'student.checked-in', 'studentId' => 999];
        } catch (\Throwable $e) {
            return ['status' => 'FAILED', 'error' => $e->getMessage(), 'class' => get_class($e)];
        }
    }

    private function checkDatabase(): array
    {
        try {
            DB::connection()->getPdo();
            return [
                'status' => 'CONNECTED',
                'host' => config('database.connections.mysql.host'),
                'database' => config('database.connections.mysql.database'),
                'tenants' => DB::table('tenants')->count(),
            ];
        } catch (\Throwable $e) {
            return ['status' => 'FAILED', 'error' => $e->getMessage()];
        }
    }
}
