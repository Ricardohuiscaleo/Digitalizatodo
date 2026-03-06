<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Enrollment extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'tenant_id', 'student_id', 'plan_id', 'start_date', 'end_date',
        'custom_price', 'discount_applied', 'discount_reason', 'status',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'custom_price' => 'decimal:2',
        'discount_applied' => 'decimal:2',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class , 'tenant_id', 'id');
    }

    /**
     * Precio efectivo = custom_price (si existe) o precio del plan con descuento.
     */
    public function getEffectivePriceAttribute(): float
    {
        $base = $this->custom_price ?? $this->plan->price;
        if ($this->discount_applied > 0) {
            $base = $base * (1 - $this->discount_applied / 100);
        }
        return round((float)$base, 2);
    }
}