<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PaymentStatusUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $payerId;
    public $status;
    public $tenantSlug;

    /**
     * Create a new event instance.
     */
    public function __construct($payerId, $status, $tenantSlug)
    {
        $this->payerId = $payerId;
        $this->status = $status;
        $this->tenantSlug = $tenantSlug;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('payments.' . $this->tenantSlug),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'payment.updated';
    }
}
