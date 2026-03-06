<?php

namespace App\Models;

use Filament\Models\Contracts\FilamentUser;
use Filament\Panel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

use Filament\Models\Contracts\HasTenants;
use Illuminate\Support\Collection;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class User extends Authenticatable implements FilamentUser, HasTenants
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    protected $fillable = [
        'tenant_id',
        'name',
        'email',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Determina si el usuario puede acceder al panel de Filament.
     */
    public function canAccessPanel(Panel $panel): bool
    {
        // El SuperAdmin (sin tenant_id) puede entrar a cualquier panel
        if (is_null($this->tenant_id)) {
            return true;
        }

        // Permitir acceso al panel "portal" genérico a todos los usuarios (el CustomLoginResponse los rebotará)
        if ($panel->getId() === 'portal') {
            return true;
        }

        // Permitimos acceso "técnico" al panel admin solo para que el CustomLoginResponse
        // pueda capturar el evento de Auth y redirigirlos a su panel de Tenant correctamente.
        return true;
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function getTenants(Panel $panel): array |Collection
    {
        // El SuperAdmin puede elegir entre todas las empresas registradas
        if (is_null($this->tenant_id)) {
            return Tenant::all();
        }

        // Un usuario de empresa solo tiene acceso a la suya
        return collect([$this->tenant])->filter();
    }

    public function canAccessTenant(Model $tenant): bool
    {
        // El SuperAdmin puede entrar a CUALQUIER empresa para soporte/configuración
        if (is_null($this->tenant_id)) {
            return true;
        }

        // Un usuario normal solo puede entrar a SU empresa registrada
        return (string)$this->tenant_id === (string)$tenant->id;
    }
}