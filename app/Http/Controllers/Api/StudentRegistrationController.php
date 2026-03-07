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

class StudentRegistrationController extends Controller
{
    /**
     * Auto-registro de alumno por parte de un apoderado.
     */
    public function register(Request $request, Tenant $tenant)
    {
        $validator = Validator::make($request->all(), [
            'guardian_name' => 'required|string|max:255',
            'guardian_email' => 'required|email|max:255',
            'guardian_phone' => 'required|string|max:20',
            'password' => 'required|string|min:8|confirmed',
            'is_self_register' => 'required|boolean',
            'students' => 'required_if:is_self_register,false|array',
            'students.*.name' => 'required_with:students|string|max:255',
            'students.*.category' => 'required_with:students|in:kids,adults,teen',
            'plan_id' => 'required|exists:plans,id',
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

            $plan = Plan::findOrFail($request->plan_id);
            $studentsToCreate = [];

            if ($request->is_self_register) {
                // El apoderado es el alumno titular
                $studentsToCreate[] = [
                    'name' => $request->guardian_name,
                    'category' => 'adults', // Por defecto adultos si es titular, o recibir de PWA
                ];
            }
            else {
                $studentsToCreate = $request->students;
            }

            $studentCount = count($studentsToCreate);

            // 2. Crear Alumnos e Inscripciones
            foreach ($studentsToCreate as $studentData) {
                $student = Student::create([
                    'tenant_id' => $tenant->id,
                    'name' => $studentData['name'],
                    'category' => $studentData['category'],
                    'active' => true,
                ]);

                $guardian->students()->attach($student->id, ['primary' => true]);

                $enrollment = Enrollment::create([
                    'tenant_id' => $tenant->id,
                    'student_id' => $student->id,
                    'plan_id' => $plan->id,
                    'start_date' => now(),
                    'status' => 'active',
                ]);

                // 3. Crear primer pago pendiente (Aplicando descuento si amerita)
                $amount = $plan->price;
                if ($studentCount >= 2 && $plan->family_discount_percent > 0) {
                    $amount = $amount * (1 - ($plan->family_discount_percent / 100));
                }

                Payment::create([
                    'tenant_id' => $tenant->id,
                    'enrollment_id' => $enrollment->id,
                    'amount' => $amount,
                    'due_date' => now(), // Vence hoy para que paguen de inmediato
                    'status' => 'pending',
                ]);
            }

            // 4. Notificar vía Telegram
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

            return response()->json([
                'message' => '¡Registro exitoso! Ya puedes iniciar sesión.',
                'guardian_id' => $guardian->id,
                'redirect_url' => '/login',
                'tenant_name' => $tenant->name
            ], 201);
        });
    }
}