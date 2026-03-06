<?php

namespace App\Filament\Pages\Auth;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Form;
use Filament\Pages\Auth\Register as BaseRegister;
use App\Mail\WelcomeTenantMail;
use App\Models\Tenant;
use App\Services\TelegramService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class CustomRegister extends BaseRegister
{
    public function form(Form $form): Form
    {
        return $form
            ->schema([
            $this->getNameFormComponent(),
            $this->getEmailFormComponent(),
            $this->getPasswordFormComponent(),
            $this->getPasswordConfirmationFormComponent(),

            TextInput::make('company_name')
            ->label('Nombre de tu Empresa / Organización')
            ->required()
            ->maxLength(255),

            Select::make('company_type')
            ->label('Tipo de Empresa')
            ->options([
                'Escuela de Artes Marciales' => 'Escuela de Artes Marciales',
                'Colegio o Instituto' => 'Colegio o Instituto',
                'Clínica o Centro Médico' => 'Clínica o Centro Médico',
                'Otra Empresa' => 'Otra Empresa',
            ])
            ->required()
            ->default('Escuela de Artes Marciales'),
        ]);
    }

    protected function handleRegistration(array $data): \Illuminate\Database\Eloquent\Model
    {
        $tenant = null;
        $user = null;

        DB::transaction(function () use ($data, &$user, &$tenant) {
            // Generar ID del tenant / slug único
            $tenantId = Str::slug($data['company_name']);
            if (Tenant::where('id', $tenantId)->exists()) {
                $tenantId = $tenantId . '-' . rand(100, 999);
            }

            // Crear la empresa (Tenant) con 7 días de prueba gratis
            $tenant = Tenant::create([
                'id' => $tenantId,
                'name' => $data['company_name'],
                'industry' => $data['company_type'],
                'active' => true,
                'saas_trial_ends_at' => now()->addDays(7),
            ]);

            // Crear el usuario asociado a la nueva empresa
            $user = static::getUserModel()::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
                'tenant_id' => $tenant->id,
            ]);

            // Generar datos de prueba (Demo) para que el Dashboard no esté vacío
            $plan = \App\Models\Plan::create([
                'tenant_id' => $tenant->id,
                'name' => 'Plan Mensual Test',
                'description' => 'Este es un plan de pago de demostración.',
                'price' => 25000,
                'billing_cycle' => 'monthly_fixed',
                'active' => true,
            ]);

            $names = ['Juan Pérez', 'María González', 'Carlos Silva', 'Ana Rojas', 'Pedro Morales'];
            $isArtesMarciales = $data['company_type'] === 'Escuela de Artes Marciales';
            $ranks = $isArtesMarciales ? ['Blanco', 'Azul', 'Blanco', 'Morado', 'Azul'] : ['Nivel 1', 'Nivel 2', 'Nivel 1', 'Nivel 3', 'Nivel 2'];
            $category = $isArtesMarciales ? 'Adultos Demo' : 'General Demo';

            foreach ($names as $index => $studentName) {
                // Crear Alumno
                $student = \App\Models\Student::create([
                    'tenant_id' => $tenant->id,
                    'name' => $studentName,
                    'active' => true,
                    'belt_rank' => $ranks[$index],
                    'category' => $category,
                    'created_at' => now()->subDays(rand(1, 30)),
                ]);

                // Inscribir Alumno al Plan Demo
                $enrollment = \App\Models\Enrollment::create([
                    'tenant_id' => $tenant->id,
                    'student_id' => $student->id,
                    'plan_id' => $plan->id,
                    'status' => 'active',
                    'start_date' => now()->subDays(rand(1, 30)),
                ]);

                // Generar un pago de demostración
                \App\Models\Payment::create([
                    'tenant_id' => $tenant->id,
                    'enrollment_id' => $enrollment->id,
                    'amount' => $plan->price,
                    'status' => 'approved',
                    'due_date' => now()->startOfMonth(),
                    'paid_at' => now()->subDays(rand(1, 5)),
                    'payment_method' => 'transfer',
                ]);

                // Generar un registro de asistencia
                \App\Models\Attendance::create([
                    'tenant_id' => $tenant->id,
                    'student_id' => $student->id,
                    'date' => now()->subDays(rand(0, 3)),
                    'status' => 'present',
                ]);
            }
        });

        Mail::to($user->email)->queue(new WelcomeTenantMail($user, $tenant));

        // Notificar por Telegram
        $trialDate = $tenant->saas_trial_ends_at?->format('d/m/Y') ?? 'N/A';
        $tgMessage = "*¡Nueva Empresa Registrada!*\n\n";
        $tgMessage .= "*Empresa:* {$tenant->name}\n";
        $tgMessage .= "*Industria:* {$tenant->industry}\n";
        $tgMessage .= "*Admin:* {$user->name} ({$user->email})\n";
        $tgMessage .= "*Trial:* Vence el {$trialDate}\n\n";
        $tgMessage .= "🔗 [admin.digitalizatodo.cl/{$tenant->id}](https://admin.digitalizatodo.cl/{$tenant->id})";
        
        TelegramService::sendMessage($tgMessage);

        return $user;
    }

    protected function getRedirectUrl(): string
    {
        $user = auth()->user();
        return '/' . $user->tenant_id;
    }
}