<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class RegisterTenantController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'tenant_name' => 'required|string|max:255',
            'tenant_slug' => 'required|string|max:50|unique:tenants,id',
            'user_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:8|confirmed',
        ]);

        // Crear Empresa
        $tenant = Tenant::create([
            'id' => $validated['tenant_slug'], // Slug es el ID en nuestro caso
            'name' => $validated['tenant_name'],
            'email' => $validated['email'], // Contacto empresa
            'plan_type' => 'free',
            'active' => true,
        ]);

        // Crear Dueño
        $user = User::create([
            'name' => $validated['user_name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'tenant_id' => $tenant->id,
        ]);

        return response()->json([
            'message' => '¡Empresa registrada con éxito!',
            'tenant' => $tenant,
            'user' => $user,
        ], 201);
    }
}