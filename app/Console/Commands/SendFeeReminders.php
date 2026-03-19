<?php

namespace App\Console\Commands;

use App\Models\Fee;
use App\Models\FeePayment;
use App\Models\Notification;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class SendFeeReminders extends Command
{
    protected $signature   = 'fees:send-reminders';
    protected $description = 'Envía recordatorios de cuotas pendientes 1 y 2 días antes del vencimiento';

    public function handle(): void
    {
        $today = Carbon::today();

        // ── Cuotas únicas ─────────────────────────────────────────────────────
        $fees = Fee::where('type', 'once')
            ->whereIn('due_date', [
                $today->copy()->addDays(1)->toDateString(),
                $today->copy()->addDays(2)->toDateString(),
            ])
            ->with('tenant')
            ->get();

        foreach ($fees as $fee) {
            $daysLeft = $today->diffInDays(Carbon::parse($fee->due_date));
            $this->notifyPending($fee, $daysLeft);
        }

        // ── Cuotas recurrentes ────────────────────────────────────────────────
        $recurring = Fee::where('type', 'recurring')
            ->whereNotNull('recurring_day')
            ->with('tenant')
            ->get();

        foreach ($recurring as $fee) {
            $nextDue  = $this->nextDueDate($fee->recurring_day);
            $daysLeft = $today->diffInDays($nextDue);
            if (!in_array($daysLeft, [1, 2])) continue;
            $this->notifyPending($fee, $daysLeft);
        }

        $this->info('Fee reminders sent.');
    }

    private function notifyPending(Fee $fee, int $daysLeft): void
    {
        $pending = FeePayment::where('fee_id', $fee->id)
            ->where('status', 'pending')
            ->with('guardian')
            ->get();

        $title = $daysLeft === 1 ? '⚠️ Cuota vence mañana' : '📅 Cuota vence en 2 días';
        $body  = $fee->title . ' · $' . number_format($fee->amount, 0, ',', '.') . ' CLP';
        $slug  = $fee->tenant?->slug ?? '';

        foreach ($pending as $payment) {
            if (!$payment->guardian) continue;
            Notification::send($fee->tenant_id, $payment->guardian_id, $title, $body, 'fee_reminder', $slug);
        }
    }

    private function nextDueDate(int $day): Carbon
    {
        $today     = Carbon::today();
        $candidate = $today->copy()->day(min($day, $today->daysInMonth));

        if ($candidate->lte($today)) {
            $next      = $today->copy()->addMonth()->startOfMonth();
            $candidate = $next->day(min($day, $next->daysInMonth));
        }

        return $candidate;
    }
}
