<?php

namespace App\Filament\Tenant\Widgets;

use Filament\Widgets\Widget;

class DemoWelcome extends Widget
{
    protected static string $view = 'filament.tenant.widgets.demo-welcome';

    protected int|string|array $columnSpan = 'full';

    protected static ?int $sort = -10;

    public static function canView(): bool
    {
        // Solo mostrar si tiene menos de 10 alumnos (asumimos que es cuenta nueva/demo)
        // O simplemente siempre mostrarlo mientras esté en trial
        $tenant = auth()->user()->tenant;
        return $tenant && $tenant->saas_trial_ends_at && $tenant->saas_trial_ends_at->isFuture();
    }
}