<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\FeePayment;
use App\Models\Student;
use App\Services\MercadoPagoService;
use Illuminate\Support\Facades\Log;

class ProcessRecurringPayments extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'payments:process-recurring';

    /**
     * The console command description.
     */
    protected $description = 'Procesa cobros automáticos para alumnos con tarjeta guardada en Mercado Pago';

    protected $mpService;

    public function __construct(MercadoPagoService $mpService)
    {
        parent::__construct();
        $this->mpService = $mpService;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("Iniciando proceso de cobros recurrentes...");

        // Buscamos cuotas pendientes con menos de 3 intentos
        $pendingPayments = FeePayment::where('status', 'pending')
            ->where('retry_attempts', '<', 3)
            ->whereHas('student', function ($query) {
                $query->whereNotNull('mercadopago_customer_id')
                      ->whereNotNull('mercadopago_card_id');
            })
            ->with(['student', 'student.tenant', 'enrollment', 'enrollment.plan'])
            ->get();

        if ($pendingPayments->isEmpty()) {
            $this->info("No hay cobros automáticos pendientes.");
            return;
        }

        foreach ($pendingPayments as $feePayment) {
            /** @var \App\Models\FeePayment $feePayment */
            $student = $feePayment->student;
            $tenant = $student->tenant;
            
            if ($tenant->mercadopago_auth_status !== 'connected' || !$tenant->mercadopago_access_token) {
                continue;
            }

            try {
                $amount = (float) ($feePayment->enrollment->custom_price ?? $feePayment->enrollment->plan->price ?? 0);
                if ($amount <= 0) continue;

                $feeAmount = ($amount * (env('MERCADOPAGO_PLATFORM_FEE', 1.81))) / 100;

                $this->info("Cobrando CLP $amount a {$student->name} (Tenant: {$tenant->slug})");

                // Usar el access_token del tenant (OAuth) para que el split funcione
                \MercadoPago\MercadoPagoConfig::setAccessToken($tenant->mercadopago_access_token);

                $payment = $this->mpService->createDirectPayment(
                    $amount,
                    $feeAmount,
                    $student->mercadopago_customer_id,
                    $student->mercadopago_card_id,
                    $tenant->mercadopago_user_id,
                    "Mensualidad Automática - " . $feePayment->period_month . "/" . $feePayment->period_year,
                    "FP_" . $feePayment->id
                );

                // Restaurar token de plataforma
                \MercadoPago\MercadoPagoConfig::setAccessToken(env('MERCADOPAGO_ACCESS_TOKEN'));

                if ($payment->status === 'approved' || $payment->status === 'authorized') {
                    $feePayment->update([
                        'status' => 'paid',
                        'paid_at' => now(),
                        'payment_method' => 'mercadopago',
                        'retry_attempts' => $feePayment->retry_attempts + 1,
                        'last_retry_at' => now(),
                        'notes' => "Cobro automático exitoso (Intento " . ($feePayment->retry_attempts + 1) . "). MP ID: " . $payment->id
                    ]);
                    $this->info("✅ Éxito: FP_{$feePayment->id}");
                } else {
                    $this->handleFailure($feePayment, "Rechazado: Status " . $payment->status);
                }

            } catch (\Exception $e) {
                $this->handleFailure($feePayment, $e->getMessage());
            }
        }

        $this->info("Proceso finalizado.");
    }

    /**
     * Gestiona el fallo del cobro, incrementa reintentos y notifica al staff.
     */
    protected function handleFailure(FeePayment $feePayment, $reason)
    {
        $student = $feePayment->student;
        $tenant = $student->tenant;

        $newAttempts = $feePayment->retry_attempts + 1;
        
        $feePayment->update([
            'retry_attempts' => $newAttempts,
            'last_retry_at' => now(),
            'notes' => "Cobro fallido (Intento $newAttempts): " . substr($reason, 0, 150)
        ]);

        $this->error("❌ Fallo (Intento $newAttempts) en FP_{$feePayment->id}: $reason");
        Log::error("Procesamiento automático fallido FP_{$feePayment->id}: $reason");

        // Notificar al Staff (Profesores/Administradores)
        \App\Models\User::where('tenant_id', $tenant->id)->each(function ($staff) use ($tenant, $student, $newAttempts) {
            \App\Models\Notification::send(
                $tenant->id,
                $staff->id,
                '⚠️ Cobro Automático Fallido',
                "El cobro de {$student->name} falló (Intento $newAttempts/3). Por favor, contacte al apoderado.",
                'fee',
                $tenant->slug
            );
        });
    }
}
