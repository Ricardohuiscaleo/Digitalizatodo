<?php

namespace App\Events;

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
    public int $ts;

    public function __construct(string $tenantSlug, int $guardianId)
    {
        $this->tenantSlug = $tenantSlug;
        $this->guardianId = $guardianId;
        $this->ts = time();
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
