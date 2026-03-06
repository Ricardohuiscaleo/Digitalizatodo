<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class Guardian extends Authenticatable
{
    use SoftDeletes, HasApiTokens;

    protected $fillable = [
        'tenant_id', 'name', 'email', 'phone', 'password', 'active',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'active' => 'boolean',
        'password' => 'hashed',
    ];

    public function tenant(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Tenant::class , 'tenant_id', 'id');
    }

    public function students(): BelongsToMany
    {
        return $this->belongsToMany(Student::class , 'guardian_student')
            ->withPivot('primary')
            ->withTimestamps();
    }

    /**
     * Total a pagar considerando descuento familiar.
     * Se aplica sobre la suma de pagos pendientes de mensualidades.
     */
    public function getTotalDueAttribute(): float
    {
        $students = $this->students()->with([
            'enrollments' => fn($q) => $q->where('status', 'active'),
            'enrollments.plan',
            'enrollments.payments' => fn($q) => $q->where('status', 'pending'),
        ])->get();

        $total = 0;
        $studentCount = $students->count();

        foreach ($students as $student) {
            foreach ($student->enrollments as $enrollment) {
                $plan = $enrollment->plan;
                foreach ($enrollment->payments as $payment) {
                    $amount = (float)$payment->amount;

                    // Aplicar descuento si aplica (mínimo 2 alumnos y el plan tiene descuento)
                    if ($studentCount >= 2 && $plan && $plan->family_discount_percent > 0) {
                        $amount = $amount * (1 - ($plan->family_discount_percent / 100));
                    }

                    $total += $amount;
                }
            }
        }

        return round($total, 0); // En pesos chilenos usualmente no usamos decimales
    }
}