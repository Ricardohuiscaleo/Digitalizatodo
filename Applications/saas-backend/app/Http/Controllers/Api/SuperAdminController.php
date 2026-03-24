<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SuperAdminController extends Controller
{
    /**
     * List all tenants with basic stats.
     */
    public function index()
    {
        // Ensure only Super Admins (tenant_id IS NULL) can access this
        if (!is_null(auth()->user()->tenant_id)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $tenants = Tenant::withCount('users')->get();

        return response()->json([
            'tenants' => $tenants
        ]);
    }

    /**
     * Create a new tenant and its initial admin user.
     */
    public function store(Request $request)
    {
        if (!is_null(auth()->user()->tenant_id)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'id' => 'required|string|unique:tenants,id',
            'name' => 'required|string|max:255',
            'industry' => 'required|string',
            'admin_name' => 'required|string',
            'admin_email' => 'required|email|unique:users,email',
            'admin_password' => 'required|string|min:6',
            'saas_plan' => 'string|in:free,pro,enterprise',
        ]);


        return DB::transaction(function () use ($validated) {
            // 1. Create Tenant
            $tenant = Tenant::create([
                'id' => $validated['id'],
                'slug' => $validated['id'], // Ensure slug is set
                'name' => $validated['name'],
                'industry' => $validated['industry'],
                'email' => $validated['admin_email'], // Use admin_email as default business email
                'active' => true,

                'saas_plan' => $validated['saas_plan'] ?? 'free',
                'saas_trial_ends_at' => now()->addDays(7),
                'force_terms_acceptance' => true,
            ]);

            // 2. Create Owner User
            User::create([
                'tenant_id' => $tenant->id,
                'name' => $validated['admin_name'],
                'email' => $validated['admin_email'],
                'password' => Hash::make($validated['admin_password']),
                'active' => true,
            ]);

            return response()->json([
                'message' => 'Tenant and Admin created successfully',
                'tenant' => $tenant
            ], 201);
        });
    }

    /**
     * Update tenant settings (Plan, Active, etc.)
     */
    public function update(Request $request, $id)
    {
        if (!is_null(auth()->user()->tenant_id)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $tenant = Tenant::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string',
            'active' => 'sometimes|boolean',
            'saas_plan' => 'sometimes|string|in:free,pro,enterprise',
            'force_terms_acceptance' => 'sometimes|boolean',
        ]);

        $tenant->update($validated);

        return response()->json([
            'message' => 'Tenant updated successfully',
            'tenant' => $tenant
        ]);
    }

    /**
     * Reset the password for the tenant's primary admin.
     */
    public function resetPassword($id)
    {
        if (!is_null(auth()->user()->tenant_id)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $tenant = Tenant::findOrFail($id);
        $user = $tenant->users()->first();

        if (!$user) {
            return response()->json(['error' => 'No user found for this tenant'], 404);
        }

        $newPassword = Str::random(8);
        $user->update(['password' => Hash::make($newPassword)]);

        return response()->json([
            'message' => 'Password reset successful',
            'new_password' => $newPassword
        ]);
    }
}
