<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Student extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'tenant_id', 'name', 'phone', 'photo', 'birth_date', 'category', 'belt_rank',
        'emergency_contact_name', 'emergency_contact_phone', 'active',
    ];

    protected $casts = [
        'birth_date' => 'date',
        'active' => 'boolean',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id', 'id');
    }

    public function guardians(): BelongsToMany
    {
        return $this->belongsToMany(Guardian::class, 'guardian_student')
            ->withPivot('primary')
            ->withTimestamps();
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    public function schedules(): BelongsToMany
    {
        return $this->belongsToMany(Schedule::class);
    }

    /**
     * Inscripción activa actual del alumno.
     */
    public function activeEnrollment(): BelongsTo
    {
        return $this->belongsTo(Enrollment::class, 'id', 'student_id')
            ->where('status', 'active');
    }

    /**
     * Determina si el alumno está al día (su último pago está aprobado).
     */
    public function getIsUpdatedAttribute(): bool
    {
        $lastPayment = $this->enrollments()
            ->with('payments')
            ->get()
            ->flatMap(fn ($e) => $e->payments)
            ->sortByDesc('due_date')
            ->first();

        return $lastPayment?->status === 'approved';
    }
}