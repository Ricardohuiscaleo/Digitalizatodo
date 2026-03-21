<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guardian;
use App\Models\Student;
use App\Models\Enrollment;
use App\Models\Plan;
use App\Models\Payment;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Mail\StudentRegistrationMail;

class StudentRegistrationController extends Controller
{
    /**
     * Auto-registro de alumno por parte de un apoderado.
     */
    public function register(Request $request, $tenantSlug)
    {
        $tenant = app('currentTenant');
        $validator = Validator::make($request->all(), [
            'guardian_name' => 'required|string|max:255',
            'guardian_email' => 'required|email|max:255',
            'guardian_phone' => 'required|string|max:20',
            'password' => 'required|string|min:8|confirmed',
            'is_self_register' => 'required|boolean',
            'students' => 'required_if:is_self_register,false|array',
            'students.*.name' => 'required_with:students|string|max:255',
            'students.*.category' => 'required_with:students|string|max:50',
            'plan_id' => 'nullable|exists:plans,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        return DB::transaction(function () use ($request, $tenant) {
            // 1. Crear o buscar Apoderado/Usuario dependiente
            $guardian = Guardian::updateOrCreate(
            ['email' => $request->guardian_email, 'tenant_id' => $tenant->id],
            [
                'name' => $request->guardian_name,
                'phone' => $request->guardian_phone,
                'password' => Hash::make($request->password),
                'active' => true,
            ]
            );

            // Recuperar configuración de precios del JSON
            $pricing = $tenant->data['pricing'] ?? ($tenant->data['prices'] ?? [
                'kids' => 0, 'adult' => 0, 'discountThreshold' => 2, 'discountPercentage' => 0
            ]);

            // Helper para obtener o crear plan por categoría
            $getOrCreatePlan = function ($category) use ($tenant, $pricing) {
                    $planName = $category === 'kids' ? 'Mensualidad Kids' : 'Mensualidad Adulto';
                    $price = $category === 'kids' ? ($pricing['kids'] ?? 0) : ($pricing['adult'] ?? 0);

                    // Buscar un plan activo que coincida en nombre para este tenant
                    $plan = Plan::where('tenant_id', $tenant->id)
                        ->where('name', $planName)
                        ->first();

                    if (!$plan) {
                        $plan = Plan::create([
                            'tenant_id' => $tenant->id,
                            'name' => $planName,
                            'description' => "Plan mensual para $category",
                            'price' => $price,
                            'currency' => 'CLP',
                            'billing_interval' => 'monthly',
                            'active' => true,
                            // Guardamos el porcentaje de descuento familiar en el plan provisionalmente, 
                            // aunque lo aplicaremos basado en la lógica general
                            'family_discount_percent' => $pricing['discountPercentage'] ?? 0
                        ]);
                    }
                    return $plan;
                }
                    ;

                $studentsToCreate = [];

                if ($request->is_self_register) {
                    // El apoderado es el alumno titular
                    $studentsToCreate[] = [
                        'name' => $request->guardian_name,
                        'category' => 'adults', // Adulto por defecto para titular
                    ];
                }

                // Añadir el resto de los alumnos si existen
                if ($request->has('students') && is_array($request->students)) {
                    foreach ($request->students as $studentData) {
                        if (!empty($studentData['name'])) {
                            $studentsToCreate[] = [
                                'name' => $studentData['name'],
                                'category' => strtolower($studentData['category'] ?? 'kids') // kids o adults
                            ];
                        }
                    }
                }

                $studentCount = count($studentsToCreate);

                // Determinar si aplica descuento global según el JSON
                $threshold = (int)($pricing['discountThreshold'] ?? 2);
                $discountPct = (float)($pricing['discountPercentage'] ?? 0);
                $appliesDiscount = ($studentCount >= $threshold && $discountPct > 0);

                // 2. Crear Alumnos e Inscripciones
                foreach ($studentsToCreate as $studentData) {
                    $category = $studentData['category'];
                    // Obtener el plan específico para la categoría de este alumno
                    $plan = $getOrCreatePlan($category);

                    $student = Student::create([
                        'tenant_id' => $tenant->id,
                        'name' => $studentData['name'],
                        'category' => $category,
                        'active' => true,
                    ]);

                    // Asignar el primer alumno como principal (primary=true), los demás no
                    $isPrimary = (empty($studentsToCreate) || $studentData === $studentsToCreate[0]);
                    $guardian->students()->attach($student->id, ['primary' => $isPrimary]);

                    $enrollment = Enrollment::create([
                        'tenant_id' => $tenant->id,
                        'student_id' => $student->id,
                        'plan_id' => $plan->id,
                        'start_date' => now(),
                        'status' => 'active',
                    ]);

                    // 3. Crear primer pago pendiente (Aplicando descuento dinámico)
                    $amount = $plan->price;
                    if ($appliesDiscount) {
                        $amount = round($amount * (1 - ($discountPct / 100)));
                    }

                    Payment::create([
                        'tenant_id' => $tenant->id,
                        'enrollment_id' => $enrollment->id,
                        'amount' => $amount,
                        'due_date' => now(), // Vence hoy para el primer cobro
                        'status' => 'pending',
                    ]);
                }

                // Para el email, usamos el plan del primer alumno como referencia
                $referencePlan = $getOrCreatePlan($studentsToCreate[0]['category'] ?? 'adults');

                // 4. Notificaciones por Email
                try {
                    // Email al Apoderado/Titular
                    Mail::to($guardian->email)->send(new StudentRegistrationMail(
                        $guardian,
                        $tenant,
                        $referencePlan, // Enviamos el plan de referencia por ahora
                        $studentCount,
                        false // isForTenant
                        ));

                    // Email a la Academia (Tenant)
                    if ($tenant->email) {
                        Mail::to($tenant->email)->send(new StudentRegistrationMail(
                            $guardian,
                            $tenant,
                            $plan,
                            $studentCount,
                            true // isForTenant
                            ));
                    }
                }
                catch (\Exception $e) {
                    Log::error("Error enviando emails de registro alumno: " . $e->getMessage());
                }

                // 5. Notificar vía Telegram
                try {
                    $telegram = app(\App\Services\TelegramService::class);
                    $msg = "<b>🆕 NUEVO REGISTRO DE ALUMNO</b>\n\n"
                        . "🏢 <b>Academia:</b> {$tenant->name}\n"
                        . "👤 <b>Apoderado/Titular:</b> {$guardian->name}\n"
                        . "📧 <b>Email:</b> {$guardian->email}\n"
                        . "👥 <b>Alumnos Inscritos:</b> {$studentCount}\n"
                        . "📋 <b>Plan:</b> {$plan->name}\n\n"
                        . "<i>_Gestionado automáticamente por Digitaliza Todo_</i>";

                    $telegram->sendMessage($msg);
                }
                catch (\Exception $e) {
                    Log::error("Error enviando notificación telegram registro alumno: " . $e->getMessage());
                }

                // 6. Notificar a los administradores del tenant (App/Web Push)
                try {
                    foreach ($tenant->users as $staffUser) {
                        \App\Models\Notification::send(
                            $tenant->id,
                            $staffUser->id,
                            'Nuevo Registro',
                            "{$guardian->name} se ha registrado y ha inscrito a {$studentCount} alumno(s).",
                            'profile',
                            $tenant->slug
                        );
                    }
                } catch (\Exception $e) {
                    Log::error("Error enviando notificación in-app de registro alumno a staff: " . $e->getMessage());
                }

                event(new \App\Events\StudentRegistered($studentCount, $guardian->name, $tenant->slug));

                return response()->json([
                    'message' => '¡Registro exitoso! Ya puedes iniciar sesión.',
                    'guardian_id' => $guardian->id,
                    'redirect_url' => '/login',
                    'tenant_name' => $tenant->name
                ], 201);
            });
    }
}