<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class StudentCheckedIn implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $studentId;
    public $studentName;
    public $studentPhoto;
    public $tenantSlug;

    /**
     * Create a new event instance.
     */
    public function __construct($studentId, $studentName, $studentPhoto, $tenantSlug)
    {
        $this->studentId = $studentId;
        $this->studentName = $studentName;
        $this->studentPhoto = $studentPhoto;
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
            new Channel('attendance.' . $this->tenantSlug),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'student.checked-in';
    }
}
