<?php

namespace App\Events;

use App\Models\Fee;
use App\Models\FeePayment;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class FeeUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public string $tenantSlug;
    public int $guardianId;
    public array $fees;

    public function __construct(string $tenantSlug, int $tenantId, int $guardianId)
    {
        $this->tenantSlug = $tenantSlug;
        $this->guardianId = $guardianId;
        $this->fees = $this->buildFees($tenantId, $guardianId);
    }

    private function buildFees(int $tenantId, int $guardianId): array
    {
        $fees = Fee::where('tenant_id', $tenantId)->get();
        $payments = FeePayment::where('tenant_id', $tenantId)
            ->where('guardian_id', $guardianId)
            ->get()
            ->keyBy(fn($p) => $p->fee_id . '_' . $p->period_month . '_' . $p->period_year);

        return $fees->map(function ($fee) use ($payments) {
            $periods = $this->calculatePeriods($fee);
            $periodsWithStatus = array_map(function ($period) use ($fee, $payments) {
                $key = $fee->id . '_' . $period['month'] . '_' . $period['year'];
                $payment = $payments->get($key);
                return array_merge($period, [
                    'status'     => $payment?->status ?? 'pending',
                    'payment_id' => $payment?->id,
                    'proof_url'  => $payment?->proof_url,
                    'paid_at'    => $payment?->paid_at,
                ]);
            }, $periods);

            return ['fee' => $fee->toArray(), 'periods' => $periodsWithStatus];
        })->values()->toArray();
    }

    private function calculatePeriods(Fee $fee): array
    {
        if ($fee->type === 'once') {
            $date = $fee->due_date ?? now();
            return [[
                'month'    => (int) date('n', strtotime($date)),
                'year'     => (int) date('Y', strtotime($date)),
                'due_date' => $date,
                'label'    => date('M Y', strtotime($date)),
            ]];
        }

        $start   = strtotime($fee->due_date ?? now());
        $end     = $fee->end_date ? strtotime($fee->end_date) : strtotime(date('Y') . '-12-31');
        $periods = [];
        $current = mktime(0, 0, 0, (int) date('n', $start), 1, (int) date('Y', $start));

        while ($current <= $end) {
            $day      = $fee->recurring_day ?? (int) date('j', $start);
            $dueDate  = date('Y-m-', $current) . str_pad($day, 2, '0', STR_PAD_LEFT);
            $periods[] = [
                'month'    => (int) date('n', $current),
                'year'     => (int) date('Y', $current),
                'due_date' => $dueDate,
                'label'    => date('M Y', $current),
            ];
            $current = strtotime('+1 month', $current);
        }

        return $periods;
    }

    public function broadcastOn(): array
    {
        return [new Channel('payments.' . $this->tenantSlug)];
    }

    public function broadcastAs(): string
    {
        return 'fee.updated';
    }
}
