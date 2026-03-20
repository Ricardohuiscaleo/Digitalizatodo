<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ScheduleUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public string $tenantSlug;

    public function __construct(string $tenantSlug)
    {
        $this->tenantSlug = $tenantSlug;
    }

    public function broadcastOn(): array
    {
        return [new Channel('attendance.' . $this->tenantSlug)];
    }

    public function broadcastAs(): string
    {
        return 'schedule.updated';
    }
}
