<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'No autenticado.'], 401);
        }

        if (!$user instanceof \App\Models\User) {
            return response()->json(['message' => 'No tienes permisos para realizar esta acción.'], 403);
        }

        // SuperAdmin (sin tenant_id) tiene acceso total
        if (is_null($user->tenant_id)) {
            return $next($request);
        }

        $tenant = app('currentTenant');
        $role = $user->getRoleForTenant($tenant->id);

        if (!$role || !in_array($role, $roles)) {
            return response()->json(['message' => 'No tienes permisos para realizar esta acción.'], 403);
        }

        return $next($request);
    }
}
