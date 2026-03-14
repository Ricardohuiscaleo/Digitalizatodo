<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class StudentRegistered implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $studentCount;
    public $guardianName;
    public $tenantSlug;

    /**
     * Create a new event instance.
     */
    public function __construct($studentCount, $guardianName, $tenantSlug)
    {
        $this->studentCount = $studentCount;
        $this->guardianName = $guardianName;
        $this->tenantSlug = $tenantSlug;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('dashboard.' . $this->tenantSlug),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'student.registered';
    }
}
