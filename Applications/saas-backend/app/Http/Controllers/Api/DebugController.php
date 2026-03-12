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
            'database' => [
                'connection' => config('database.default'),
                'host' => config('database.connections.mysql.host'),
                'database' => config('database.connections.mysql.database'),
                'username' => config('database.connections.mysql.username'),
                'port' => config('database.connections.mysql.port'),
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

        }
        catch (\Exception $e) {
            $checks['database']['status'] = 'FAILED';
            $checks['database']['error'] = $e->getMessage();
        }

        return response()->json($checks);
    }
}
