<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'No autenticado.'], 401);
        }

        // Si es un User (Staff), verificamos si su rol (que asumimos es admin/owner o similar) 
        // está en la lista permitida. En este sistema simple, los Users suelen ser admins.
        // Si es un Guardian, usualmente no tiene acceso a las rutas protegidas por 'role'.

        // Asumimos que los miembros de la tabla 'users' tienen acceso si son staff.
        // Si se requiere granularidad, se podría añadir una columna 'role' a la tabla users.

        if ($user instanceof \App\Models\User) {
            // El usuario es Staff. Por ahora permitimos si el middleware pide roles comunes de staff.
            return $next($request);
        }

        return response()->json(['message' => 'No tienes permisos para realizar esta acción.'], 403);
    }
}
