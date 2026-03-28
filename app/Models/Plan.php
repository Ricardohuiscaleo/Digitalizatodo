<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Plan extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'tenant_id', 'name', 'category', 'target_audience', 'description', 'price', 'billing_cycle', 'is_recurring', 'billing_day',
        'family_discount_percent', 'family_discount_min_students', 'active',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'family_discount_percent' => 'decimal:2',
        'active' => 'boolean',
        'is_recurring' => 'boolean',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class , 'tenant_id', 'id');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    /**
     * Calcula la próxima fecha de vencimiento para un nuevo enrollment.
     */
    public function getNextDueDate(\Carbon\Carbon $enrollmentDate): \Carbon\Carbon
    {
        if ($this->billing_cycle === 'monthly_fixed') {
            $day = $this->billing_day ?? 1;
            $next = now()->startOfMonth()->addDays($day - 1);
            if ($next->isPast()) {
                $next->addMonth();
            }
            return $next;
        }

        if ($this->billing_cycle === 'quarterly') {
            return $enrollmentDate->copy()->addMonths(3);
        }

        if ($this->billing_cycle === 'semi_annual') {
            return $enrollmentDate->copy()->addMonths(6);
        }

        if ($this->billing_cycle === 'annual') {
            return $enrollmentDate->copy()->addYear();
        }

        // monthly_from_enrollment: 30 días desde la inscripción
        return $enrollmentDate->copy()->addDays(30);
    }
}