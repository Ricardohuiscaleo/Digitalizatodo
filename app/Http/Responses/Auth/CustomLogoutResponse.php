<?php

namespace App\Http\Responses\Auth;

use Filament\Http\Responses\Auth\Contracts\LogoutResponse as Responsable;
use Illuminate\Http\RedirectResponse;
use Livewire\Features\SupportRedirects\Redirector;

class CustomLogoutResponse implements Responsable
{
    public function toResponse($request): RedirectResponse|Redirector
    {
        // Fuerza la redirección a la landing de login público siempre
        return redirect()->to('/clientes/login');
    }
}