<?php

namespace App\Filament\Widgets;

use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

use App\Models\Tenant;
use App\Models\User;
use App\Models\Student;

class SuperadminStatsOverview extends BaseWidget
{
    protected static ?int $sort = 1;

    protected function getStats(): array
    {
        $newCompanies = Tenant::where('created_at', '>=', now()->subDays(30))->count();
        $totalMessages = \App\Models\TelegramConversation::count();

        return [
            Stat::make('Ecosystem Status', Tenant::count() . ' Empresas')
            ->description($newCompanies . ' nuevas este mes')
            ->descriptionIcon('heroicon-m-arrow-trending-up')
            ->color('primary')
            ->chart([7, 3, 4, 5, 6, 3, 5, 9]),

            Stat::make('Total Clientes', User::count())
            ->description('Usuarios activos en la red')
            ->descriptionIcon('heroicon-m-users')
            ->color('success'),

            Stat::make('Bridge Activity', $totalMessages)
            ->description('Mensajes Email/Telegram hoy')
            ->descriptionIcon('heroicon-m-cpu-chip')
            ->color('warning')
            ->chart([10, 2, 8, 3, 15, 20]),
        ];
    }
}