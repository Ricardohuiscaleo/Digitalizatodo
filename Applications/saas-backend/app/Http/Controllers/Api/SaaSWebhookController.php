<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Tenant;
use App\Models\SaasPaymentLog;
use App\Models\SaasPlan;
use Illuminate\Support\Facades\Log;

class SaaSWebhookController extends Controller
{
    /**
     * Handle Mercado Pago Webhooks for SaaS Subscriptions.
     */
    public function handle(Request $request)
    {
        $payload = $request->all();
        Log::info('SaaS Webhook MP Received:', $payload);

        // Mercado Pago sends 'type' or 'action' in V2
        $type = $request->get('type') ?? $request->get('topic');
        $id = $request->get('data')['id'] ?? $request->get('id');

        if ($type === 'subscription_preapproval' || $type === 'preapproval') {
            return $this->processSubscription($id);
        }

        if ($type === 'payment') {
            return $this->processPayment($id);
        }

        return response()->json(['status' => 'ignored'], 200);
    }

    protected function processSubscription($subscriptionId)
    {
        // Aquí podríamos actualizar la próxima fecha de cobro en el Tenant
        Log::info("SaaS: Subscription $subscriptionId updated");
        return response()->json(['status' => 'processed'], 200);
    }

    protected function processPayment($paymentId)
    {
        // Consultar el pago en MP
        $accessToken = config('services.mercadopago.access_token');
        $response = \Illuminate\Support\Facades\Http::withToken($accessToken)
            ->get("https://api.mercadopago.com/v1/payments/$paymentId");

        if (!$response->successful()) {
            return response()->json(['status' => 'failed_to_fetch_payment'], 400);
        }

        $payment = $response->json();
        
        // Verificar si es un pago de suscripción (external_reference o preapproval_id)
        $externalRef = $payment['external_reference'] ?? '';
        $preapprovalId = $payment['metadata']['preapproval_id'] ?? null;

        if (strpos($externalRef, 'TENANT_') === 0) {
            $parts = explode('_PLAN_', str_replace('TENANT_', '', $externalRef));
            $tenantId = $parts[0];
            $newPlanId = $parts[1] ?? null;

            $tenant = Tenant::find($tenantId);

            if ($tenant && $payment['status'] === 'approved') {
                $targetPlanId = $newPlanId ?? $tenant->saas_plan_id;
                $plan = SaasPlan::find($targetPlanId);

                // 1. Registramos el histórico de pago (SaasPaymentLog)
                SaasPaymentLog::create([
                    'tenant_id' => $tenant->id,
                    'saas_plan_id' => $targetPlanId,
                    'amount' => $payment['transaction_amount'],
                    'currency' => $payment['currency_id'],
                    'status' => 'paid',
                    'mp_preapproval_id' => $preapprovalId,
                    'mp_payment_id' => $paymentId,
                    'paid_at' => now(),
                ]);

                // 2. Actualizamos el Plan y lo Activamos
                $tenant->update([
                    'saas_plan_id' => $targetPlanId,
                    'saas_plan' => $plan ? $plan->slug : $tenant->saas_plan,
                    'active' => true,
                    'saas_status' => 'active',
                    'mercadopago_subscription_id' => $preapprovalId
                ]);

                Log::info("SaaS: Webhook procesado. Tenant {$tenant->id} activado con Plan {$targetPlanId}.");
            }
        }

        return response()->json(['status' => 'processed'], 200);
    }
}
