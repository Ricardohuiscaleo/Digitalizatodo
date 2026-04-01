<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use App\Models\SaasPlan;
use App\Models\Tenant;

class MPService
{
    protected $accessToken;

    public function __construct()
    {
        $this->accessToken = config('services.mercadopago.access_token');
    }

    /**
     * Crear un "preapproval_plan" (El Plan base).
     */
    public function createPreapprovalPlan(SaasPlan $plan, $interval = 'months')
    {
        $amount = $interval === 'months' ? $plan->price_monthly : $plan->price_yearly;
        $frequency = $interval === 'years' ? 12 : 1;
        $frequencyType = 'months'; // MP preapproval_plan prefiere 'months' o 'days'
        
        $response = Http::withToken($this->accessToken)->post('https://api.mercadopago.com/preapproval_plan', [
            "reason" => "Plan " . $plan->name . " - DigitalizaTodo",
            "auto_recurring" => [
                "frequency" => $frequency,
                "frequency_type" => $frequencyType,
                "transaction_amount" => $amount,
                "currency_id" => "CLP",
                "billing_day" => 1 // <--- Fuerza el cobro los días 1
            ],
            "back_url" => "https://digitalizatodo.cl"
        ]);

        if ($response->successful()) {
            return $response->json();
        }

        return [
            'error' => true,
            'status' => $response->status(),
            'message' => $response->body()
        ];
    }

    /**
     * Crear la suscripción final (Preapproval) para un Tenant.
     */
    public function createPreapproval(Tenant $tenant, $cardTokenId = null)
    {
        $plan = $tenant->saasPlan;
        if (!$plan) {
            return ['error' => true, 'message' => 'El tenant no tiene un plan SaaS asignado'];
        }

        // Determinar qué ID usar según el intervalo
        $interval = $tenant->billing_interval ?? 'monthly';
        $mpPlanId = ($interval === 'yearly') ? $plan->mp_plan_yearly : $plan->mp_plan_monthly;

        // Fallback al genérico si los específicos están vacíos
        if (!$mpPlanId) {
            $mpPlanId = $plan->mercadopago_plan_id;
        }

        if (!$mpPlanId) {
            return ['error' => true, 'message' => 'No hay plan de Mercado Pago vinculado para el intervalo ' . $interval];
        }

        $payload = [
            "preapproval_plan_id" => $mpPlanId,
            "reason" => "Suscripción " . $tenant->name . " (" . ucfirst($interval) . ")",
            "external_reference" => "TENANT_" . $tenant->id . "_PLAN_" . $plan->id,
            "payer_email" => $tenant->email,
            "status" => "pending", // Cambiado de 'authorized' a 'pending' para que nos dé el link de pago
            "back_url" => "https://app.digitalizatodo.cl/dashboard?mp_status=success"
        ];

        if ($cardTokenId) {
            $payload["card_token_id"] = $cardTokenId;
        }

        $response = Http::withToken($this->accessToken)->post('https://api.mercadopago.com/preapproval', $payload);

        return $response->json();
    }
}
