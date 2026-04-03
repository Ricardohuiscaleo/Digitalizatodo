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

    // Asegurar que las fechas siempre se traten como UTC ignorando el app.timezone local
    public function setStartedAtAttribute($value)
    {
        $this->attributes['started_at'] = $value ? \Carbon\Carbon::parse($value)->utc() : null;
    }

    public function getStartedAtAttribute($value)
    {
        // Si el valor viene de la DB (que no tiene zona horaria), le forzamos UTC
        return $value ? \Carbon\Carbon::parse($value, 'UTC') : null;
    }

    public function setLastSyncedAtAttribute($value)
    {
        $this->attributes['last_synced_at'] = $value ? \Carbon\Carbon::parse($value)->utc() : null;
    }

    public function getLastSyncedAtAttribute($value)
    {
        return $value ? \Carbon\Carbon::parse($value, 'UTC') : null;
    }
}
