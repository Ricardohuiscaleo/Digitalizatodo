<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Filament\Facades\Filament;

class CheckTenantTrial
{
    public function handle(Request $request, Closure $next): Response
    {
        $tenant = Filament::getTenant();

        if (!$tenant || $request->routeIs('trial.expired')) {
            return $next($request);
        }

        $hasPaidPlan = !is_null($tenant->saas_plan) && $tenant->saas_plan !== 'trial';
        $trialExpired = $tenant->saas_trial_ends_at && $tenant->saas_trial_ends_at->isPast();

        if ($trialExpired && !$hasPaidPlan) {
            return redirect()->route('trial.expired');
        }

        return $next($request);
    }
}