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

        // Buscamos cuotas pendientes del mes actual o anterior que no tengan pago aprobado
        // Y cuyo alumno tenga token de Mercado Pago guardado
        $pendingPayments = FeePayment::where('status', 'pending')
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
            
            // Si el tenant no está conectado a MP, saltamos
            if ($tenant->mercadopago_auth_status !== 'connected' || !$tenant->mercadopago_access_token) {
                continue;
            }

            try {
                $amount = (float) ($feePayment->enrollment->custom_price ?? $feePayment->enrollment->plan->price ?? 0);
                if ($amount <= 0) continue;

                $feeAmount = ($amount * (env('MERCADOPAGO_PLATFORM_FEE', 1.81))) / 100;

                $this->info("Cobrando CLP $amount a {$student->name} (Tenant: {$tenant->slug})");

                $payment = $this->mpService->createDirectPayment(
                    $amount,
                    $feeAmount,
                    $student->mercadopago_customer_id,
                    $student->mercadopago_card_id,
                    $tenant->mercadopago_user_id,
                    "Mensualidad Automática - " . $feePayment->period_month . "/" . $feePayment->period_year,
                    "FP_" . $feePayment->id
                );

                if ($payment->status === 'approved' || $payment->status === 'authorized') {
                    $feePayment->update([
                        'status' => 'paid',
                        'paid_at' => now(),
                        'payment_method' => 'mercadopago',
                        'notes' => "Cobro automático exitoso. MP ID: " . $payment->id
                    ]);
                    $this->info("✅ Éxito: FP_{$feePayment->id}");
                } else {
                    $this->error("❌ Rechazado: Status " . $payment->status);
                }

            } catch (\Exception $e) {
                $this->error("❌ Error en FP_{$feePayment->id}: " . $e->getMessage());
                Log::error("Procesamiento automático fallido FP_{$feePayment->id}: " . $e->getMessage());
            }
        }

        $this->info("Proceso finalizado.");
    }
}
