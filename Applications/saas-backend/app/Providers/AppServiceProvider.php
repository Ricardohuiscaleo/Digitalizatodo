<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(
            \Filament\Http\Responses\Auth\Contracts\LoginResponse::class ,
            \App\Http\Responses\Auth\CustomLoginResponse::class
        );

        $this->app->singleton(
            \Filament\Http\Responses\Auth\Contracts\RegistrationResponse::class ,
            \App\Http\Responses\Auth\CustomRegistrationResponse::class
        );

        $this->app->singleton(
            \Filament\Http\Responses\Auth\Contracts\LogoutResponse::class ,
            \App\Http\Responses\Auth\CustomLogoutResponse::class
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        \Illuminate\Support\Facades\URL::forceScheme('https');
    }
}