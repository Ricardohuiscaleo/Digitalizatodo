<?php
namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TenantUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $tenantId;
    public $type; // 'created', 'updated', 'reset_password'

    public function __construct($tenantId, $type = 'updated')
    {
        $this->tenantId = $tenantId;
        $this->type = $type;
    }

    public function broadcastOn(): array
    {
        return [new Channel('admin.global')];
    }

    public function broadcastAs(): string
    {
        return 'tenant.updated';
    }
}
