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
            'students.*.gender' => 'nullable|string|max:20',
            'students.*.weight' => 'nullable|numeric',
            'students.*.height' => 'nullable|numeric',
            'students.*.course_id' => 'nullable|exists:courses,id',
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

            // Helper para obtener plan por ID o crear provisional por categoría
            $getPlan = function ($category, $requestedPlanId = null) use ($tenant, $pricing) {
                    if ($requestedPlanId) {
                        $plan = Plan::where('tenant_id', $tenant->id)->find($requestedPlanId);
                        if ($plan) return $plan;
                    }

                    $planName = $category === 'kids' ? 'Mensualidad Kids' : 'Mensualidad Adulto';
                    $price = $category === 'kids' ? ($pricing['kids'] ?? 0) : ($pricing['adult'] ?? 0);

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
                            'is_recurring' => true,
                            'category' => 'dojo',
                            'active' => true,
                            'family_discount_percent' => $pricing['discountPercentage'] ?? 0
                        ]);
                    }
                    return $plan;
                }
                    ;

                $studentsToCreate = [];

                    $selfData = $request->input('self_student', []);
                    $studentsToCreate[] = [
                        'name' => $request->guardian_name,
                        'category' => $selfData['category'] ?? 'adults',
                        'birth_date' => $selfData['birth_date'] ?? null,
                        'belt_rank' => $selfData['belt'] ?? null,
                        'degrees' => $selfData['degrees'] ?? null,
                        'modality' => $selfData['modality'] ?? null,
                        'gender' => $selfData['gender'] ?? 'male',
                        'weight' => $selfData['weight'] ?? null,
                        'height' => $selfData['height'] ?? null,
                    ];

                // Añadir el resto de los alumnos si existen
                if ($request->has('students') && is_array($request->students)) {
                    foreach ($request->students as $studentData) {
                        if (!empty($studentData['name'])) {
                            $studentsToCreate[] = [
                                'name' => $studentData['name'],
                                'category' => strtolower($studentData['category'] ?? 'kids'),
                                'birth_date' => $studentData['birth_date'] ?? null,
                                'belt_rank' => $studentData['belt'] ?? null,
                                'degrees' => $studentData['degrees'] ?? null,
                                'modality' => $studentData['modality'] ?? null,
                                'gender' => $studentData['gender'] ?? 'male',
                                'weight' => $studentData['weight'] ?? null,
                                'height' => $studentData['height'] ?? null,
                                'course_id' => $studentData['course_id'] ?? null
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
                    // Obtener el plan: si es Dojo usa el automático por categoría, si es VIP usa el plan_id solicitado
                    $plan = ($request->registration_mode === 'dojo') 
                        ? $getPlan($category) 
                        : $getPlan($category, $request->plan_id);

                    $courseId = $studentData['course_id'] ?? null;

                    // Automatización: Si no viene course_id pero hay category (ej: '3_basico'), 
                    // intentamos buscar el curso que coincida por nombre.
                    if (!$courseId && !empty($category)) {
                        $course = \App\Models\Course::where('tenant_id', $tenant->id)
                            ->where(function($q) use ($category) {
                                $normalized = str_replace('_', ' ', $category);
                                $q->where('name', 'LIKE', '%' . $normalized . '%')
                                  ->orWhere('name', $category);
                            })->first();
                        if ($course) {
                            $courseId = $course->id;
                        }
                    }

                    $student = Student::create([
                        'tenant_id' => $tenant->id,
                        'name' => $studentData['name'],
                        'category' => $category,
                        'birth_date' => !empty($studentData['birth_date']) ? \Carbon\Carbon::createFromFormat('d / m / Y', $studentData['birth_date']) : null,
                        'belt_rank' => $studentData['belt_rank'] ?? null,
                        'degrees' => $studentData['degrees'] ?? null,
                        'modality' => $studentData['modality'] ?? null,
                        'gender' => $studentData['gender'] ?? null,
                        'weight' => $studentData['weight'] ?? null,
                        'height' => $studentData['height'] ?? null,
                        'course_id' => $courseId,
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

                    // 3. Crear primer pago pendiente (Aplicando descuento dinámico si es Dojo)
                    $isVipOnly = $request->registration_mode === 'vip_only';
                    $amount = $plan->price;

                    if (!$isVipOnly && $appliesDiscount) {
                        $amount = round($amount * (1 - ($discountPct / 100)));
                    }

                    Payment::create([
                        'tenant_id' => $tenant->id,
                        'enrollment_id' => $enrollment->id,
                        'amount' => $amount,
                        'due_date' => now(),
                        'status' => 'pending',
                        'type' => $plan->is_recurring ? 'monthly_fee' : 'single_session',
                    ]);
                }

                // Para el email, usamos el primer plan como referencia
                $referencePlan = ($request->registration_mode === 'dojo') 
                    ? $getPlan($studentsToCreate[0]['category'] ?? 'adults')
                    : $getPlan('adults', $request->plan_id);

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