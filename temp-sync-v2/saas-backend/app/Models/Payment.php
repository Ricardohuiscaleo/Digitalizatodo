<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'tenant_id', 'enrollment_id', 'amount', 'due_date', 'paid_at',
        'status', 'payment_method', 'proof_image', 'rejection_reason',
        'approved_by', 'transaction_id', 'gateway_response',
    ];

    protected $casts = [
        'due_date' => 'date',
        'paid_at' => 'date',
        'amount' => 'decimal:2',
        'gateway_response' => 'array',
    ];

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(Enrollment::class);
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class , 'approved_by');
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class , 'tenant_id', 'id');
    }

    /**
     * Calculates if this payment is overdue.
     */
    public function getIsOverdueAttribute(): bool
    {
        return in_array($this->status, ['pending', 'proof_uploaded'])
            && $this->due_date->isPast();
    }

    /**
     * Scopes
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeProofUploaded($query)
    {
        return $query->where('status', 'proof_uploaded');
    }

    public function scopeOverdue($query)
    {
        return $query->whereIn('status', ['pending', 'overdue'])
            ->where('due_date', '<', now());
    }
}