<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class StudentCheckedOut implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $studentId;
    public $studentName;
    public $tenantSlug;

    public function __construct($studentId, $studentName, $tenantSlug)
    {
        $this->studentId = $studentId;
        $this->studentName = $studentName;
        $this->tenantSlug = $tenantSlug;
    }

    public function broadcastOn(): array
    {
        return [new Channel('attendance.' . $this->tenantSlug)];
    }

    public function broadcastAs(): string
    {
        return 'student.checked-out';
    }
}
