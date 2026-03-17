<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PaymentStatusUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $payerId;
    public $status;
    public $tenantSlug;

    public function __construct($payerId, $status, $tenantSlug)
    {
        $this->payerId = $payerId;
        $this->status = $status;
        $this->tenantSlug = $tenantSlug;
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('payments.' . $this->tenantSlug),
        ];
    }

    public function broadcastAs(): string
    {
        return 'payment.updated';
    }
}
