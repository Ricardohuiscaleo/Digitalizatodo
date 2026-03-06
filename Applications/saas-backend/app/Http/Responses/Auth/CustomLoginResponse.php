<?php

namespace App\Http\Responses\Auth;

use Filament\Http\Responses\Auth\Contracts\LoginResponse as Responsable;
use Illuminate\Http\RedirectResponse;
use Livewire\Features\SupportRedirects\Redirector;

class CustomLoginResponse implements Responsable
{
    public function toResponse($request): RedirectResponse|Redirector
    {
        $user = auth()->user();

        // Si es SuperAdmin (no tiene tenant_id), va al panel de control global
        if (!$user || is_null($user->tenant_id)) {
            return redirect()->to('/admin');
        }

        // Si es un Gimnasio, va directo a su panel
        return redirect()->to('/' . $user->tenant_id);
    }
}