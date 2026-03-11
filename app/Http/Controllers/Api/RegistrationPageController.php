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

        // Reusar si ya existe una activa
        $existing = DB::table('registration_pages')
            ->where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->first();

        if ($existing) {
            return response()->json(['code' => $existing->code]);
        }

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
            'tenants.data as tenant_data'
        )
            ->first();

        if (!$page) {
            return response()->json(['message' => 'Página no encontrada.'], 404);
        }

        return response()->json([
            'id' => $page->tenant_id,
            'slug' => $page->tenant_slug,
            'name' => $page->tenant_name,
            'logo' => $page->tenant_logo,
            'primary_color' => $page->tenant_primary_color,
            'industry' => $page->tenant_industry,
            'data' => is_string($page->tenant_data) ? json_decode($page->tenant_data, true) : $page->tenant_data,
        ]);
    }
}
