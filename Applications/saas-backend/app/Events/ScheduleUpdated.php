<?php

namespace App\Events;

use App\Models\Schedule;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ScheduleUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public string $tenantSlug;
    public array $schedules;

    public function __construct(string $tenantSlug, int $tenantId)
    {
        $this->tenantSlug = $tenantSlug;
        $this->schedules = Schedule::where('tenant_id', $tenantId)
            ->with('students:id,name,photo,category')
            ->get()
            ->toArray();
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
