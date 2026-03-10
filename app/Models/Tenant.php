<?php

namespace App\Models;

use App\Models\Payment;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Filament\Models\Contracts\HasAvatar;
use Illuminate\Support\Facades\Storage;

class Tenant extends Model implements HasAvatar
{
    protected $fillable = [
        'id', 'slug', 'name', 'industry', 'email', 'phone', 'logo', 'primary_color',
        'address', 'city', 'saas_plan', 'saas_trial_ends_at', 'active',
        'bank_name', 'bank_account_type', 'bank_account_number',
        'bank_account_holder', 'bank_rut', 'bank_email', 'data',
    ];

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    protected $casts = [
        'active' => 'boolean',
        'saas_trial_ends_at' => 'date',
        'data' => 'array',
    ];

    // Relaciones
    public function users(): HasMany
    {
        return $this->hasMany(User::class , 'tenant_id', 'id');
    }

    public function students(): HasMany
    {
        return $this->hasMany(Student::class , 'tenant_id', 'id');
    }

    public function plans(): HasMany
    {
        return $this->hasMany(Plan::class , 'tenant_id', 'id');
    }

    public function guardians(): HasMany
    {
        return $this->hasMany(Guardian::class , 'tenant_id', 'id');
    }

    public function getFilamentAvatarUrl(): ?string
    {
        return $this->logo ?Storage::disk('public')->url($this->logo) : null;
    }

    // Helpers
    public function getActiveStudentsCountAttribute(): int
    {
        return $this->students()->where('active', true)->count();
    }

    public function getPendingPaymentsCountAttribute(): int
    {
        return Payment::query()
            ->where('tenant_id', $this->id)
            ->whereIn('status', ['pending', 'overdue'])
            ->count();
    }
}