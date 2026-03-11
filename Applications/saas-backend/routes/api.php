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

Route::get('industries', [\App\Http\Controllers\Api\IndustryController::class , 'index']);

// ── Webhooks (Sin Tenant / Públicos) ──────────────────────────────────────────
Route::post('webhooks/resend-inbound', [TelegramBotController::class , 'handleResendInbound']);
Route::post('webhooks/telegram', [TelegramBotController::class , 'handleTelegramWebhook']);
Route::post('webhooks/coolify-deploy', [TelegramBotController::class , 'handleCoolifyDeploy']);

Route::middleware([ResolveTenantFromPath::class])->prefix('{tenant}')->group(function () {
    // Info del tenant
    Route::get('info', [TenantDiscoveryController::class , 'show']);

    // Planes públicos
    Route::get('plans', [PlanController::class , 'index']);

    // Registro público de alumnos
    Route::post('register-student', [StudentRegistrationController::class , 'register']);

    Route::group(['prefix' => 'auth'], function () {
            // ── Autenticación (pública) ────────────────────────────────────────
            Route::post('login', [AuthController::class , 'login']);
            Route::post('register', [AuthController::class , 'register']);
        }
        );

        // ── Rutas protegidas (requieren token Sanctum) ─────────────────────
        Route::middleware('auth:sanctum')->group(function () {
            // Perfil
            Route::get('me', [AuthController::class , 'me']);
            Route::post('logout', [AuthController::class , 'logout']);

            // Alumnos y Asistencia (Guardians/Apoderados)
            Route::get('students', [StudentController::class , 'index']);
            Route::post('students/{id}/photo', [StudentController::class , 'uploadPhoto']);
            Route::get('attendance', [AttendanceController::class , 'index']);
            Route::post('attendance/verify-qr', [AttendanceController::class , 'verifyQR']);

            // Pagos
            Route::get('payments', [PaymentController::class , 'index']);
            Route::post('payments/{payment}/pay', [PaymentController::class , 'initiatePayment']);
            Route::post('payments/{payment}/upload-proof', [PaymentController::class , 'uploadProof']);

            // Asistencia (solo teachers/admins - Escritura)
            Route::middleware('role:teacher,admin,owner')->group(function () {
                    Route::post('attendance', [AttendanceController::class , 'store']);
                    Route::get('attendance/generate-qr', [AttendanceQRController::class , 'generate']);

                    // Gestión de Cuentas (Payers)
                    Route::get('payers', [GuardianController::class , 'index']);
                    Route::post('payers/{id}/approve', [GuardianController::class , 'approvePayment']);
                    Route::post('settings/pricing', [GuardianController::class, 'updatePricing']);
                    Route::post('settings/bank-info', [GuardianController::class, 'updateBankInfo']);
                    Route::post('settings/logo', [GuardianController::class, 'updateLogo']);
                    Route::post('settings/registration-page', [RegistrationPageController::class , 'generate']);
                    Route::get('settings/registration-page', [RegistrationPageController::class , 'getCode']);
                    Route::delete('settings/registration-page', [RegistrationPageController::class , 'deactivate']);
                }
                );
            }
            );
        });