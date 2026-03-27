<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SaasPlan extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'price_monthly',
        'price_yearly',
        'mercadopago_plan_id',
        'mp_plan_monthly',
        'mp_plan_yearly',
        'currency',
        'features',
        'active',
    ];

    protected $casts = [
        'features' => 'array',
        'active' => 'boolean',
        'price_monthly' => 'decimal:2',
        'price_yearly' => 'decimal:2',
    ];

    /**
     * Get the tenants using this plan.
     */
    public function tenants(): HasMany
    {
        return $this->hasMany(Tenant::class, 'saas_plan_id');
    }

    /**
     * Helper to get price based on interval.
     */
    public function getPriceForInterval(string $interval): float
    {
        return $interval === 'yearly' ? (float)$this->price_yearly : (float)$this->price_monthly;
    }
}
