<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TimerState extends Model
{
    protected $table = 'saas_timer_states';

    protected $fillable = [
        'tenant_id',
        'status',
        'initial_seconds',
        'remaining_seconds',
        'started_at',
        'last_synced_at',
    ];

    protected $casts = [
        'initial_seconds' => 'integer',
        'remaining_seconds' => 'integer',
        'started_at' => 'datetime',
        'last_synced_at' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
