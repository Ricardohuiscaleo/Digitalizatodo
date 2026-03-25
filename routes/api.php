<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\RegisterTenantController;
use App\Http\Controllers\Api\TenantDiscoveryController;
use App\Http\Controllers\Api\StudentRegistrationController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PlanController;
use App\Http\Controllers\Api\GuardianController;
use App\Http\Controllers\Api\RegistrationPageController;
use App\Http\Controllers\Api\DebugController;
use App\Http\Middleware\ResolveTenantFromPath;
use App\Http\Controllers\TelegramBotController;
use App\Http\Controllers\Api\AttendanceQRController;
use App\Http\Controllers\Api\CourseController;
use Illuminate\Support\Facades\Artisan;

/*
 |--------------------------------------------------------------------------
 | API Routes — SaaS Multi-Tenant (Digitalizatodo)
 |--------------------------------------------------------------------------
 | Prefijo:   /api/{tenant}/...
 | Auth:      Laravel Sanctum (Bearer token)
 | Ejemplo:   POST /api/gimbox/auth/login
 */

// ── Rutas Globales (Sin Tenant) ────────────────────────────────────────
Route::post('register-tenant', [RegisterTenantController::class , 'store']);
Route::post('identify-tenant', [TenantDiscoveryController::class , 'identify']);
Route::get('r/{code}', [RegistrationPageController::class , 'show']);
Route::get('debug', [DebugController::class , 'index']);
Route::get('app-updates', [\App\Http\Controllers\Api\AppUpdateController::class , 'index']);

Route::get('industries', [\App\Http\Controllers\Api\IndustryController::class , 'index']);

// ── Public API Endpoints (Chat & Contact) ──────────────────────────────────────────
Route::post('w/resend-inbound', [TelegramBotController::class , 'handleResendInbound']);
Route::post('webhooks/resend-inbound', [TelegramBotController::class , 'handleResendInbound']);
Route::post('w/telegram', [TelegramBotController::class , 'handleTelegramWebhook']);
Route::post('w/coolify-deploy', [TelegramBotController::class , 'handleCoolifyDeploy']);
Route::post('webhooks/coolify-deploy', [TelegramBotController::class , 'handleCoolifyDeploy']);
Route::post('w/contact', [TelegramBotController::class , 'handleContactForm']);
Route::group(['prefix' => 'w/chat'], function() {
    Route::post('send', [TelegramBotController::class , 'handleChatSend']);
    Route::post('media-push', [TelegramBotController::class , 'handleChatUpload']);
    Route::get('messages', [TelegramBotController::class , 'getChatMessages']);
    Route::get('stream', [TelegramBotController::class , 'streamMessages']);
});
Route::post('w/telegram/chat', [TelegramBotController::class , 'handleChatBotWebhook']);
Route::post('w/visit', [TelegramBotController::class , 'handleVisitPing']);
Route::get('w/github-stats', [\App\Http\Controllers\Api\GitHubStatsController::class, 'index']);
Route::get('w/clear-cache', function() {
    Artisan::call('route:clear');
    Artisan::call('config:clear');
    return "Cache Cleared";
});

Route::group(['middleware' => [ResolveTenantFromPath::class], 'prefix' => '{tenant}'], function () {
    // Info del tenant
    Route::get('info', [TenantDiscoveryController::class , 'show']);
    Route::post('settings/accept-terms', [TenantDiscoveryController::class, 'acceptTerms']);


    // Planes públicos
    Route::get('plans', [PlanController::class , 'index']);

    // Horario público (apoderados pueden ver sin auth)
    Route::get('schedules', [\App\Http\Controllers\Api\ScheduleController::class, 'index']);

    // Web Push VAPID (público para obtener clave)
    Route::get('push/vapid-public-key', [\App\Http\Controllers\Api\PushController::class, 'vapidPublicKey']);
    
    // Cursos públicos (para registro)
    Route::get('courses', [CourseController::class, 'index']);

    // Registro público de alumnos
    Route::post('register-student', [StudentRegistrationController::class , 'register']);

    Route::group(['prefix' => 'auth'], function () {
            // ── Autenticación (pública) ────────────────────────────────────────
            Route::post('login', [AuthController::class , 'login']);
            Route::post('register', [AuthController::class , 'register']);
            Route::post('resume', [AuthController::class , 'resume']);
        }
        );

        // ── Rutas protegidas (requieren token Sanctum) ─────────────────────
        Route::middleware('auth:sanctum,guardian-api')->group(function () {
            // Perfil
            Route::get('me', [AuthController::class , 'me']);
            Route::post('me/photo', [GuardianController::class, 'updatePhoto']);
            Route::post('logout', [AuthController::class , 'logout']);

            // Alumnos y Asistencia (Guardians/Apoderados)
            Route::get('students', [StudentController::class , 'index']);
            Route::post('students/{id}/photo', [StudentController::class , 'uploadPhoto']);
            Route::patch('students/{id}/name', [StudentController::class , 'updateName']);
            Route::patch('students/{id}/course', [StudentController::class, 'updateCourse']);
            Route::get('attendance', [AttendanceController::class , 'index']);
            Route::post('attendance/verify-qr', [AttendanceController::class , 'verifyQR']);

            // Notificaciones
            Route::get('notifications', [\App\Http\Controllers\Api\NotificationController::class , 'index']);
            Route::post('notifications/{id}/read', [\App\Http\Controllers\Api\NotificationController::class , 'read']);
            Route::post('notifications/read-all', [\App\Http\Controllers\Api\NotificationController::class , 'readAll']);

            // Pagos
            Route::get('payments', [PaymentController::class , 'index']);

            Route::post('payments/consumable', [PaymentController::class , 'storeConsumable']);
            Route::post('payments/{payment}/pay', [PaymentController::class , 'initiatePayment']);
            Route::post('payments/{payment}/upload-proof', [PaymentController::class , 'uploadProof']);
            Route::delete('payments/{payment}/proof', [PaymentController::class , 'deleteProof']);

            // Gastos públicos (apoderados pueden ver)
            Route::get('expenses', [\App\Http\Controllers\Api\ExpenseController::class, 'index']);

            // Cuotas — apoderado ve las suyas y paga
            Route::get('fees/my', [\App\Http\Controllers\Api\FeeController::class, 'myFees']);
            Route::post('fees/submit-payment', [\App\Http\Controllers\Api\FeeController::class, 'submitPayment']);
            Route::post('fees/{id}/upload-proof', [\App\Http\Controllers\Api\FeeController::class, 'uploadProof']);
            Route::delete('fees/payments/{id}/proof', [\App\Http\Controllers\Api\FeeController::class, 'deleteProof']);

            // Web Push — suscripción (requiere auth)
            Route::post('push/subscribe', [\App\Http\Controllers\Api\PushController::class, 'subscribe']);

            // Asistencia (solo teachers/admins - Escritura)
            Route::middleware('role:teacher,admin,owner')->group(function () {
                    Route::post('attendance', [AttendanceController::class , 'store']);
                    Route::delete('attendance/{student_id}', [AttendanceController::class , 'destroy']);
                    Route::get('attendance/qr-token', [AttendanceQRController::class , 'generate']);
                    Route::get('attendance/qr-status', [AttendanceQRController::class , 'status']);

                    // Gestión de Cuentas (Payers)
                    Route::get('payers', [GuardianController::class , 'index']);
                    Route::post('payers/{id}/approve', [GuardianController::class , 'approvePayment']);
                    Route::get('payers/{id}/settlement', [GuardianController::class , 'settlement']);
                    Route::delete('payers/{id}', [GuardianController::class , 'destroy']);
                    Route::post('settings/pricing', [GuardianController::class, 'updatePricing']);
                    Route::post('settings/bank-info', [GuardianController::class, 'updateBankInfo']);
                    Route::post('settings/logo', [GuardianController::class, 'updateLogo']);
                    Route::post('settings/registration-page', [RegistrationPageController::class , 'generate']);
                    Route::get('settings/registration-page', [RegistrationPageController::class , 'getCode']);
                    Route::delete('settings/registration-page', [RegistrationPageController::class , 'deactivate']);

                    // Gestión de Horarios
                    Route::get('schedules', [\App\Http\Controllers\Api\ScheduleController::class, 'index']);
                    Route::post('schedules', [\App\Http\Controllers\Api\ScheduleController::class, 'store']);
                    Route::put('schedules/{id}', [\App\Http\Controllers\Api\ScheduleController::class, 'update']);
                    Route::delete('schedules/{id}', [\App\Http\Controllers\Api\ScheduleController::class, 'destroy']);

                    // Gestión de Planes
                    Route::post('plans', [PlanController::class, 'store']);
                    Route::put('plans/{id}', [PlanController::class, 'update']);
                    Route::delete('plans/{id}', [PlanController::class, 'destroy']);
                    Route::put('schedules/{id}', [\App\Http\Controllers\Api\ScheduleController::class, 'update']);
                    Route::delete('schedules/{id}', [\App\Http\Controllers\Api\ScheduleController::class, 'destroy']);
                    Route::post('schedules/{id}/students', [\App\Http\Controllers\Api\ScheduleController::class, 'assignStudents']);

                    // Gastos (Tesorero)
                    Route::post('expenses', [\App\Http\Controllers\Api\ExpenseController::class, 'store']);
                    Route::delete('expenses/{id}', [\App\Http\Controllers\Api\ExpenseController::class, 'destroy']);

                    // Cuotas (Tesorero)
                    Route::get('fees', [\App\Http\Controllers\Api\FeeController::class, 'index']);
                    Route::get('fees/guardians-summary', [\App\Http\Controllers\Api\FeeController::class, 'guardiansSummary']);
                    Route::post('fees', [\App\Http\Controllers\Api\FeeController::class, 'store']);
                    Route::get('fees/{id}', [\App\Http\Controllers\Api\FeeController::class, 'show']);
                    Route::delete('fees/{id}', [\App\Http\Controllers\Api\FeeController::class, 'destroy']);
                    Route::post('fees/{id}/approve-payment', [\App\Http\Controllers\Api\FeeController::class, 'approvePayment']);

                    // Gestión de Cursos
                    Route::post('courses', [CourseController::class, 'store']);
                    Route::delete('courses/{id}', [CourseController::class, 'destroy']);
                }
                );
            }
            );
        });

// ── Super Admin API (Global) ──────────────────────────────────────────

Route::post('admin/login', [AuthController::class, 'globalLogin']);


Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('admin/tenants', [\App\Http\Controllers\Api\SuperAdminController::class, 'index']);
    Route::get('admin/users', [\App\Http\Controllers\Api\SuperAdminController::class, 'users']);
    Route::post('admin/tenants', [\App\Http\Controllers\Api\SuperAdminController::class, 'store']);

    Route::patch('admin/tenants/{id}', [\App\Http\Controllers\Api\SuperAdminController::class, 'update']);
    Route::post('admin/tenants/{id}/reset-password', [\App\Http\Controllers\Api\SuperAdminController::class, 'resetPassword']);
});