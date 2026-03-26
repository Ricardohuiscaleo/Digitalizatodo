<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RegistrationPageController extends Controller
{
    public function generate(Request $request, $tenant)
    {
        $tenant = app('currentTenant');
        $tenantId = $tenant->id;

        // Desactivar cualquier link previo para que 'Regenerar' realmente cree uno nuevo
        DB::table('registration_pages')
            ->where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->update(['is_active' => false, 'updated_at' => now()]);

        $code = strtolower(Str::random(8));

        DB::table('registration_pages')->insert([
            'code' => $code,
            'tenant_id' => $tenant->id,
            'tenant_name' => $tenant->name,
            'tenant_logo' => $tenant->logo,
            'tenant_primary_color' => $tenant->primary_color ?? '#6366f1',
            'tenant_industry' => $tenant->industry,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['code' => $code]);
    }

    public function getCode(Request $request, $tenant)
    {
        $tenantId = app('currentTenant')->id;
        $existing = DB::table('registration_pages')
            ->where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->value('code');

        return response()->json(['code' => $existing]);
    }

    public function deactivate(Request $request, $tenant)
    {
        $tenantId = app('currentTenant')->id;
        DB::table('registration_pages')
            ->where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->update(['is_active' => false, 'updated_at' => now()]);

        return response()->json(['message' => 'Link eliminado.']);
    }

    public function show($code)
    {
        $page = DB::table('registration_pages')
            ->join('tenants', 'registration_pages.tenant_id', '=', 'tenants.id')
            ->where('registration_pages.code', $code)
            ->where('registration_pages.is_active', true)
            ->select(
            'registration_pages.*',
            'tenants.slug as tenant_slug',
            'tenants.data as tenant_data',
            'tenants.name as tenant_name',
            'tenants.logo as tenant_logo',
            'tenants.primary_color as tenant_primary_color',
            'tenants.industry as tenant_industry',
            'tenants.bank_name',
            'tenants.bank_account_type',
            'tenants.bank_account_number',
            'tenants.bank_account_holder',
            'tenants.bank_rut'
        )
            ->first();

        if (!$page) {
            return response()->json(['message' => 'Página no encontrada.'], 404);
        }

        $plans = \App\Models\Plan::where('tenant_id', $page->tenant_id)
            ->where('active', true)
            ->get();

        $schedules = \App\Models\Schedule::where('tenant_id', $page->tenant_id)
            ->get();

        $terms = \App\Models\TenantTerm::where('tenant_id', $page->tenant_id)
            ->where('active', true)
            ->orderBy('version', 'desc')
            ->first();

        return response()->json([
            'id' => $page->tenant_id,
            'slug' => $page->tenant_slug,
            'name' => $page->tenant_name,
            'logo' => $page->tenant_logo,
            'primary_color' => $page->tenant_primary_color,
            'industry' => $page->tenant_industry,
            'data' => is_string($page->tenant_data) ? json_decode($page->tenant_data, true) : $page->tenant_data,
            'bank_info' => [
                'bank_name' => $page->bank_name,
                'holder_rut' => $page->bank_rut,
                'holder_name' => $page->bank_account_holder,
                'account_type' => $page->bank_account_type,
                'account_number' => $page->bank_account_number,
            ],
            'plans' => $plans,
            'schedules' => $schedules,
            'terms' => $terms ? [
                'content' => $terms->content,
                'hash' => $terms->hash,
                'version' => $terms->version,
                'updated_at' => $terms->updated_at,
            ] : null,
        ]);
    }
}
