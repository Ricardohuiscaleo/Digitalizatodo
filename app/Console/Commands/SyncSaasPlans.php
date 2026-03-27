<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\SaasPlan;
use App\Services\MPService;

class SyncSaasPlans extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'saas:sync-plans {--force : Force update of existing MP plans}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sincroniza los planes SaaS locales con Mercado Pago y obtiene sus IDs de PreapprovalPlan.';

    /**
     * Execute the console command.
     */
    public function handle(MPService $mpService)
    {
        $plans = SaasPlan::where('active', true)->get();

        if ($plans->isEmpty()) {
            $this->warn('No hay planes SaaS activos registrados en la base de datos.');
            return;
        }

        $this->info("Sincronizando " . $plans->count() . " planes con Mercado Pago...");

        foreach ($plans as $plan) {
            $this->info("--- Plan: {$plan->name} ---");

            // 1. Sincronizar Mensual
            if (!$plan->mp_plan_monthly || $this->option('force')) {
                $this->comment("Creando PreapprovalPlan Mensual en MP...");
                $result = $mpService->createPreapprovalPlan($plan, 'months');
                
                if (isset($result['id'])) {
                    $plan->mp_plan_monthly = $result['id'];
                    $this->line("✅ ID Mensual: " . $result['id']);
                } else {
                    $this->error("❌ Error Mensual: " . json_encode($result));
                }
            } else {
                $this->line("⏩ Mensual ya sincronizado: {$plan->mp_plan_monthly}");
            }

            // 2. Sincronizar Anual
            if (!$plan->mp_plan_yearly || $this->option('force')) {
                $this->comment("Creando PreapprovalPlan Anual en MP...");
                $result = $mpService->createPreapprovalPlan($plan, 'years');
                
                if (isset($result['id'])) {
                    $plan->mp_plan_yearly = $result['id'];
                    $this->line("✅ ID Anual: " . $result['id']);
                } else {
                    $this->error("❌ Error Anual: " . json_encode($result));
                }
            } else {
                $this->line("⏩ Anual ya sincronizado: {$plan->mp_plan_yearly}");
            }

            $plan->save();
        }

        $this->info('Sincronización finalizada.');
    }
}
