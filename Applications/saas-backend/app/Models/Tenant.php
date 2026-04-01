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
        'address', 'city', 'saas_plan', 'saas_plan_id', 'billing_interval', 'saas_trial_ends_at', 'active', 'force_terms_acceptance',
        'bank_name', 'bank_account_type', 'bank_account_number',
        'bank_account_holder', 'bank_rut', 'bank_email', 'data', 'role_permissions',
        'registration_page_code',
        'mercadopago_access_token',
        'mercadopago_refresh_token',
        'mercadopago_user_id',
        'mercadopago_auth_status',
        'mercadopago_terms_accepted_at',
        'mercadopago_subscription_id',
        'saas_status',
    ];

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    protected $casts = [
        'active' => 'boolean',
        'force_terms_acceptance' => 'boolean',
        'saas_trial_ends_at' => 'date',
        'data' => 'array',
        'role_permissions' => 'array',
        'saas_plan_id' => 'integer',
        'billing_interval' => 'string',
    ];

    /**
     * Get the dynamic SaaS Plan details.
     */
    public function saasPlan(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(SaasPlan::class, 'saas_plan_id');
    }


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

    public function terms(): HasMany
    {
        return $this->hasMany(TenantTerm::class, 'tenant_id', 'id');
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