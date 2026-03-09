<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Resuelve el tenant actual desde el segmento {tenant} en la URL
 * y lo inyecta en el contenedor como singleton.
 *
 * URL: /admin/gimbox/dashboard → tenant_id = "gimbox"
 */
class ResolveTenantFromPath
{
    public function handle(Request $request, Closure $next): Response
    {
        $slug = $request->route('tenant');

        if ($slug) {
            $tenant = Tenant::where('slug', $slug)->where('active', true)->first();

            if (!$tenant) {
                abort(404, "Academia '$slug' no encontrada.");
            }

            // Disponible globalmente en la app
            app()->instance('currentTenant', $tenant);
        }

        return $next($request);
    }
}