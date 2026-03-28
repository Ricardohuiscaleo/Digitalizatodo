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
        'tenant_id', 'course_id', 'name', 'phone', 'photo', 'birth_date', 'category', 'belt_rank',
        'gender', 'weight', 'height', 'degrees', 'modality', 'previous_classes', 'belt_classes_at_promotion',
        'emergency_contact_name', 'emergency_contact_phone', 'active', 'consumable_credits',
    ];

    // protected $appends = ['belt_progress'];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

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
     * Configuración de Graduación CBJJ / Alliance
     */
    const BJJ_GRADUATION_CONFIG = [
        'adults' => [
            'Blanco' => ['total_for_belt' => 150, 'classes_per_stripe' => 30, 'next_belt' => 'Azul', 'min_age' => 16],
            'Azul'   => ['total_for_belt' => 350, 'classes_per_stripe' => 70, 'next_belt' => 'Morado', 'min_age' => 16],
            'Morado' => ['total_for_belt' => 350, 'classes_per_stripe' => 70, 'next_belt' => 'Marrón', 'min_age' => 16],
            'Marrón' => ['total_for_belt' => 350, 'classes_per_stripe' => 70, 'next_belt' => 'Negro', 'min_age' => 18],
            'Negro'  => ['total_for_belt' => 1000, 'classes_per_stripe' => 100, 'next_belt' => 'Rojo-Negro', 'min_age' => 19],
        ],
        'kids' => [
            'Blanco'   => ['total_for_belt' => 50,  'classes_per_stripe' => 10, 'next_belt' => 'Gris', 'min_age' => 4],
            'Gris'     => ['total_for_belt' => 100, 'classes_per_stripe' => 20, 'next_belt' => 'Amarillo', 'min_age' => 4],
            'Amarillo' => ['total_for_belt' => 100, 'classes_per_stripe' => 20, 'next_belt' => 'Naranja', 'min_age' => 7],
            'Naranja'  => ['total_for_belt' => 100, 'classes_per_stripe' => 20, 'next_belt' => 'Verde', 'min_age' => 10],
            'Verde'    => ['total_for_belt' => 100, 'classes_per_stripe' => 20, 'next_belt' => 'Azul', 'min_age' => 13],
        ],
    ];

    public function getBeltProgressAttribute(): array
    {
        static $beltConfigs = null;
        if ($beltConfigs === null) {
            try {
                $beltConfigs = \App\Models\BeltConfig::all()->groupBy('category');
            } catch (\Throwable $e) {
                $beltConfigs = collect([]);
            }
        }

        $category = $this->category === 'kids' ? 'kids' : 'adults';
        $belt = $this->belt_rank ?? 'Blanco';
        
        // Buscar en DB primero
        $config = $beltConfigs->get($category)?->firstWhere('belt_rank', $belt);

        // Fallback a constante si no hay DB
        if (!$config) {
            $configGroup = self::BJJ_GRADUATION_CONFIG[$category] ?? self::BJJ_GRADUATION_CONFIG['adults'];
            $configData = $configGroup[$belt] ?? $configGroup['Blanco'];
            // Normalizar a objeto para consistencia
            $config = (object)$configData;
        } else {
            // Normalizar de la DB (el seeder usa los mismos nombres de campo)
            $config = (object)$config;
        }

        // Clases Reales (Libro + Sistema)
        $systemClasses = $this->attendances()->where('status', 'present')->count();
        $previousClasses = (int)($this->previous_classes ?? 0);
        $realClasses = $systemClasses + $previousClasses;
        
        // Clases Virtuales (Crédito por rayas manuales)
        $stripeDebt = (int)($this->degrees ?? 0) * (int)$config->classes_per_stripe;
        $virtualClasses = max(0, $stripeDebt - $realClasses);
        
        $totalEffective = $realClasses + $virtualClasses;
        $classesPerStripe = (int)$config->classes_per_stripe;
        
        // Stripe actual (0 a 4)
        $currentStripe = min(4, (int)floor($totalEffective / $classesPerStripe));
        
        // Progreso stripe (%)
        $milestoneStart = $currentStripe * $classesPerStripe;
        $milestoneEnd = ($currentStripe < 4) ? ($currentStripe + 1) * $classesPerStripe : (int)$config->total_for_belt;
        $progressInStripe = $totalEffective - $milestoneStart;
        $stripeRange = $milestoneEnd - $milestoneStart;
        $progressPct = ($stripeRange > 0) ? min(100, ($progressInStripe / $stripeRange) * 100) : 100;

        $age = $this->birth_date ? $this->birth_date->age : 20;

        return [
            'category' => $category,
            'belt' => $belt,
            'next_belt' => $config->next_belt,
            'total_effective' => $totalEffective,
            'real_classes' => $realClasses,
            'system_classes' => $systemClasses,
            'virtual_classes' => $virtualClasses,
            'current_stripe' => $currentStripe,
            'degrees' => (int)($this->degrees ?? 0),
            'progress_pct' => (int)$progressPct,
            'is_ready_for_belt' => $totalEffective >= (int)$config->total_for_belt && $age >= (int)($config->min_age ?? 0),
            'age_requirement_met' => $age >= (int)($config->min_age ?? 0),
            'extra_merit_classes' => max(0, $totalEffective - (int)$config->total_for_belt),
            'classes_per_stripe' => $classesPerStripe,
            'total_for_belt' => (int)$config->total_for_belt,
            'today_status' => $this->attendances()->where('date', now()->format('Y-m-d'))->first()?->status ?? 'absent',
            'registration_method' => $this->attendances()->where('date', now()->format('Y-m-d'))->first()?->registration_method ?? 'manual',
        ];
    }

    /**
     * Determina si el alumno está al día (su último pago está aprobado).
     */
    public function getIsUpdatedAttribute(): bool
    {
        $lastPayment = $this->enrollments()
            ->with(['payments' => fn($q) => $q->orderBy('due_date', 'desc')])
            ->get()
            ->flatMap->payments
            ->first();

        return $lastPayment?->status === 'approved';
    }
}