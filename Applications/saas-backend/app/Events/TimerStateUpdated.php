<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TimerStateUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $status;
    public $initialSeconds;
    public $remainingSeconds;
    public $startedAt;
    public $tenantSlug;

    /**
     * Create a new event instance.
     */
    public function __construct($status, $initialSeconds, $remainingSeconds, $startedAt, $tenantSlug)
    {
        $this->status = $status;
        $this->initialSeconds = (int)$initialSeconds;
        $this->remainingSeconds = (int)$remainingSeconds;
        $this->startedAt = $startedAt;
        $this->tenantSlug = $tenantSlug;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('timer.' . $this->tenantSlug),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'timer.updated';
    }
}
