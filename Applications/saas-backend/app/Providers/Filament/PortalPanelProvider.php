<?php

namespace App\Providers\Filament;

use Filament\Http\Middleware\Authenticate;
use Filament\Http\Middleware\AuthenticateSession;
use Filament\Http\Middleware\DisableBladeIconComponents;
use Filament\Http\Middleware\DispatchServingFilamentEvent;
use Filament\Pages;
use Filament\Panel;
use Filament\PanelProvider;
use Filament\Support\Colors\Color;
use Filament\Widgets;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\View\Middleware\ShareErrorsFromSession;

class PortalPanelProvider extends PanelProvider
{
    public function panel(Panel $panel): Panel
    {
        return $panel
            ->id('portal')
            ->path('clientes')
            ->login()
            ->colors([
                'primary' => Color::Amber,
            ])
            ->brandName('Digitaliza Todo')
            ->discoverWidgets(in: app_path('Filament/Portal/Widgets'), for: 'App\\Filament\\Portal\\Widgets')
            ->widgets([
                Widgets\AccountWidget::class,
            ])
            ->brandLogoHeight('2rem')
            ->favicon(asset('DLogo-v2.webp', true))
            ->renderHooks([
                \Filament\View\PanelsRenderHook::AUTH_LOGIN_FORM_AFTER => fn (): string => '
                    <div class="text-center mt-4">
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                            ¿No tienes cuenta? 
                            <a href="https://app.digitalizatodo.cl/onboarding" class="text-primary-600 font-bold hover:underline">
                                Regístrate y obtén una demo ❤️
                            </a>
                        </p>
                    </div>
                ',
                \Filament\View\PanelsRenderHook::FOOTER => fn (): string => '
                    <div class="text-center text-sm text-gray-500 py-4">
                        &copy; ' . date('Y') . ' Digitaliza Todo. Todos los derechos reservados.
                    </div>
                ',
            ])
            ->assets([
                \Filament\Support\Assets\Css::make('custom-stylesheet', asset('css/custom.css', true)),
            ])
            ->middleware([
                EncryptCookies::class,
                AddQueuedCookiesToResponse::class,
                StartSession::class,
                AuthenticateSession::class,
                ShareErrorsFromSession::class,
                VerifyCsrfToken::class,
                SubstituteBindings::class,
                DisableBladeIconComponents::class,
                DispatchServingFilamentEvent::class,
                \App\Http\Middleware\RedirectIfAuthenticatedToTenant::class,
            ])
            ->authMiddleware([
                Authenticate::class,
            ]);
    }
}