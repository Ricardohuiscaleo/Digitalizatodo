<?php

namespace App\Http\Controllers\Api;

use App\Events\TenantUpdated;
use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use App\Mail\WelcomeTenantMail;
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

        $tenants = Tenant::withCount(['users', 'students', 'guardians'])
            ->with(['users' => function($q) {
                $q->select('id', 'name', 'email', 'tenant_id')->oldest();
            }])
            ->get();

        return response()->json([
            'tenants' => $tenants,
            'v' => 'metrics_v1' // Verification field
        ]);

    }

    /**
     * List all administrators across all tenants.
     */
    public function users()
    {
        if (!is_null(auth()->user()->tenant_id)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $users = User::whereNotNull('tenant_id')
            ->with('tenant:id,name,slug')
            ->select('id', 'name', 'email', 'tenant_id', 'active', 'created_at')
            ->get();

        return response()->json([
            'users' => $users
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
            'saas_plan' => 'sometimes|string|in:free,pro,enterprise,starter',
        ]);


        $tenantId = null;
        $response = DB::transaction(function () use ($validated, &$tenantId) {
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

            $tenantId = $tenant->id;

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

        if ($tenantId) {
            event(new TenantUpdated($tenantId, 'created'));
        }

        return $response;
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
            'saas_plan' => 'sometimes|string',
            'saas_plan_id' => 'sometimes|integer|exists:saas_plans,id',
            'billing_interval' => 'sometimes|string|in:monthly,yearly',
            'force_terms_acceptance' => 'sometimes|boolean',
            'role_permissions' => 'nullable|array',
        ]);

        $oldActive = $tenant->active;
        $tenant->update($validated);

        // Si se activa por primera vez (o se reactiva), enviamos el mail de bienvenida
        if (!$oldActive && $tenant->active) {
            $user = $tenant->users()->oldest()->first();
            if ($user) {
                try {
                    Mail::to($user->email)->send(new WelcomeTenantMail($user, $tenant));
                } catch (\Exception $e) {
                    \Log::error("Error enviando mail de bienvenida a {$user->email}: " . $e->getMessage());
                }
            }
        }

        event(new TenantUpdated($id, 'updated'));

        return response()->json([
            'message' => 'Tenant updated successfully',
            'tenant' => $tenant->load('saasPlan')
        ]);
    }

    /**
     * List all dynamic SaaS Plans (Public).
     */
    public function plans()
    {
        return response()->json([
            'plans' => \App\Models\SaasPlan::where('active', true)->get()
        ]);
    }

    /**
     * Update a SaaS Plan (Price, Mercado Pago ID, etc.)
     */
    public function updatePlan(Request $request, $id)
    {
        if (!is_null(auth()->user()->tenant_id)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $plan = \App\Models\SaasPlan::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'sometimes|string',
            'price_monthly' => 'sometimes|numeric',
            'price_yearly' => 'sometimes|numeric',
            'mercadopago_plan_id' => 'sometimes|string|nullable',
            'mp_plan_monthly' => 'sometimes|string|nullable',
            'mp_plan_yearly' => 'sometimes|string|nullable',
            'active' => 'sometimes|boolean',
        ]);

        $plan->update($validated);

        return response()->json([
            'message' => 'Plan updated successfully',
            'plan' => $plan
        ]);
    }

    /**
     * Sync a SaaS Plan with Mercado Pago (Create preapproval_plan).
     */
    public function syncPlanWithMP(Request $request, $id)
    {
        if (!is_null(auth()->user()->tenant_id)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $plan = \App\Models\SaasPlan::findOrFail($id);
        $interval = $request->get('interval', 'months'); // 'months' o 'years'

        $mpService = new \App\Services\MPService();
        $mpResult = $mpService->createPreapprovalPlan($plan, $interval);

        if (isset($mpResult['id'])) {
            $field = ($interval === 'months') ? 'mp_plan_monthly' : 'mp_plan_yearly';
            $plan->update([
                $field => $mpResult['id'],
                'mercadopago_plan_id' => $mpResult['id'] // Mantener por compatibilidad legacy
            ]);

            return response()->json([
                'message' => 'Plan sync exitoso',
                'mp_id' => $mpResult['id'],
                'field_updated' => $field,
                'plan' => $plan
            ]);
        }

        return response()->json([
            'error' => 'Fallo al sincronizar con MP',
            'details' => $mpResult
        ], 400);
    }


    /**
     * Reset the password for the tenant's primary admin.
     */
    public function resetPassword(Request $request, $id)
    {
        if (!is_null(auth()->user()->tenant_id)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $tenant = Tenant::findOrFail($id);
        $user = $tenant->users()->first();

        if (!$user) {
            return response()->json(['error' => 'No admin user found for this tenant'], 404);
        }

        $newPassword = 'dt_' . Str::random(24);
        $user->password = \Hash::make($newPassword);
        $user->save();

        try {
            \Illuminate\Support\Facades\Mail::to($user->email)->send(new \App\Mail\WelcomeStaffMail($user, $tenant, $newPassword));
        } catch (\Exception $e) {
            \Log::error("Error enviando email de reset a {$user->email}: " . $e->getMessage());
        }

        // Signal update
        event(new TenantUpdated($id, 'reset_password'));


        return response()->json([
            'message' => 'Password reset successfully',
            'new_password' => $newPassword
        ]);
    }

    /**
     * List all users associated with a tenant.
     */
    public function getTenantUsers($id)
    {
        if (!is_null(auth()->user()->tenant_id)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $tenant = Tenant::findOrFail($id);
        
        // Get users from pivot AND direct tenant_id
        $users = \App\Models\User::where('tenant_id', $tenant->id)
            ->orWhereHas('tenantUsers', fn($q) => $q->where('tenant_id', $tenant->id))
            ->get()
            ->map(function($user) use ($tenant) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->getRoleForTenant($tenant->id) ?? 'staff',
                    'active' => $user->active,
                ];
            });

        return response()->json(['users' => $users]);
    }

    /**
     * Add a new user to a tenant.
     */
    public function addTenantUser(Request $request, $id)
    {
        if (!is_null(auth()->user()->tenant_id)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $tenant = Tenant::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'required|string'
        ]);

        $user = \App\Models\User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => \Hash::make($validated['password']),
            'tenant_id' => $tenant->id, // Legacy support
            'active' => true,
        ]);

        // New multi-tenant support
        \App\Models\TenantUser::create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'role' => $validated['role'],
        ]);

        try {
            \Illuminate\Support\Facades\Mail::to($user->email)->send(new \App\Mail\WelcomeStaffMail($user, $tenant, $validated['password']));
        } catch (\Exception $e) {
            \Log::error("Error enviando email de bienvenida staff a {$user->email}: " . $e->getMessage());
        }

        return response()->json([
            'message' => 'User created and assigned to tenant successfully',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $validated['role']
            ]
        ]);
    }

    /**
     * Remove a user from a tenant.
     */
    public function removeTenantUser($tenantId, $userId)
    {
        if (!is_null(auth()->user()->tenant_id)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $tenant = Tenant::findOrFail($tenantId);
        $user = \App\Models\User::findOrFail($userId);

        // Remove from pivot
        \App\Models\TenantUser::where('tenant_id', $tenant->id)
            ->where('user_id', $user->id)
            ->delete();

        // If it was their primary tenant, null it out
        if ($user->tenant_id == $tenant->id) {
            $user->tenant_id = null;
            $user->save();
        }

        return response()->json(['message' => 'User removed from tenant']);
    }

    /**
     * Update a tenant user (Role or Password).
     */
    public function updateTenantUser(Request $request, $tenantId, $userId)
    {
        if (!is_null(auth()->user()->tenant_id)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $tenant = Tenant::findOrFail($tenantId);
        $user = \App\Models\User::findOrFail($userId);

        $validated = $request->validate([
            'name' => 'sometimes|string',
            'role' => 'sometimes|string',
            'password' => 'sometimes|string|min:6',
        ]);

        if (isset($validated['name'])) {
            $user->name = $validated['name'];
        }

        if (isset($validated['password'])) {
            $user->password = \Hash::make($validated['password']);
        }

        $user->save();

        if (isset($validated['role'])) {
            $pivot = \App\Models\TenantUser::where('tenant_id', $tenant->id)
                ->where('user_id', $user->id)
                ->first();
            if ($pivot) {
                $pivot->role = $validated['role'];
                $pivot->save();
            }
        }

        if (isset($validated['password'])) {
             try {
                \Illuminate\Support\Facades\Mail::to($user->email)->send(new \App\Mail\WelcomeStaffMail($user, $tenant, $validated['password']));
            } catch (\Exception $e) {
                \Log::error("Error enviando email de actualización de clave a {$user->email}: " . $e->getMessage());
            }
        }

        return response()->json([
            'message' => 'User updated successfully',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->getRoleForTenant($tenant->id) ?? 'staff'
            ]
        ]);
    }
}
