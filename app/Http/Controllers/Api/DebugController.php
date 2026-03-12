<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DebugController extends Controller
{
    public function index()
    {
        $checks = [
            'php_version' => PHP_VERSION,
            'laravel_version' => app()->version(),
            'environment' => app()->environment(),
            'stamp' => 'DEBUG-STAMP-V1-SSE',
            'database' => [
                'connection' => config('database.default'),
                'host' => config('database.connections.mysql.host'),
                'database' => config('database.connections.mysql.database'),
                'username' => config('database.connections.mysql.username'),
                'port' => config('database.connections.mysql.port'),
            ],
            'telegram_debug' => [
                'last_error' => \Illuminate\Support\Facades\Cache::get('last_telegram_error'),
                'last_success' => \Illuminate\Support\Facades\Cache::get('last_telegram_success'),
            ]
        ];

        try {
            $routes = \Illuminate\Support\Facades\Route::getRoutes();
            $checks['routes'] = [];
            foreach ($routes as $route) {
                if (str_starts_with($route->uri(), 'api/')) {
                    $checks['routes'][] = [
                        'methods' => $route->methods(),
                        'uri' => $route->uri(),
                        'name' => $route->getName()
                    ];
                }
            }
            
            DB::connection()->getPdo();
            $checks['database']['status'] = 'CONNECTED';

            $tables = DB::select('SHOW TABLES');
            $checks['database']['tables_count'] = count($tables);
            $checks['database']['tables'] = array_map(function ($t) {
                return array_values((array)$t)[0];
            }, $tables);

            if (Schema::hasTable('tenants')) {
                $checks['database']['tenants_table'] = 'EXISTS';
                $checks['database']['tenants_count'] = DB::table('tenants')->count();
                $checks['database']['sample_tenants'] = DB::table('tenants')->limit(5)->get(['id', 'slug', 'name']);

                // Inspeccionar columnas
                $columns = DB::select('DESCRIBE tenants');
                $checks['database']['tenants_columns'] = array_map(function ($col) {
                    return [
                    'Field' => $col->Field,
                    'Type' => $col->Type,
                    'Key' => $col->Key,
                    'Extra' => $col->Extra
                    ];
                }, $columns);
            }
            else {
                $checks['database']['tenants_table'] = 'MISSING';
            }

            if (Schema::hasTable('registration_pages')) {
                $checks['database']['registration_pages_table'] = 'EXISTS';
            }
            else {
                $checks['database']['registration_pages_table'] = 'MISSING';
            }

            $logPaths = [
                storage_path('logs/laravel.log'),
                base_path('storage/logs/laravel.log'),
                '/var/www/html/storage/logs/laravel.log'
            ];

            $foundLog = null;
            foreach ($logPaths as $path) {
                if (file_exists($path)) {
                    $foundLog = $path;
                    break;
                }
            }

            if ($foundLog) {
                $logFile = file($foundLog);
                $checks['last_logs'] = array_slice($logFile, -50);
                $checks['log_path'] = $foundLog;
            }
            else {
                $checks['last_logs'] = 'File not found in any standard path';
            }

        }
        catch (\Exception $e) {
            $checks['database']['status'] = 'FAILED';
            $checks['database']['error'] = $e->getMessage();
        }

        return response()->json($checks);
    }
}
