<?php

namespace App\Http\Responses\Auth;

use Filament\Http\Responses\Auth\Contracts\RegistrationResponse as Responsable;
use Illuminate\Http\RedirectResponse;
use Livewire\Features\SupportRedirects\Redirector;

class CustomRegistrationResponse implements Responsable
{
    public function toResponse($request): RedirectResponse|Redirector
    {
        $user = auth()->user();

        // Al registrar una empresa nueva, redirigir directo a su tenant slug
        if ($user && !is_null($user->tenant_id)) {
            return redirect()->to('/' . $user->tenant_id);
        }

        return redirect()->to('/admin');
    }
}