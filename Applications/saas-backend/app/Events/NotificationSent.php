<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NotificationSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $notificationId;
    public string $title;
    public string $body;
    public string $type;
    public int $userId;
    public string $tenantSlug;

    public function __construct(int $notificationId, string $title, string $body, string $type, int $userId, string $tenantSlug)
    {
        $this->notificationId = $notificationId;
        $this->title = $title;
        $this->body = $body;
        $this->type = $type;
        $this->userId = $userId;
        $this->tenantSlug = $tenantSlug;
    }

    public function broadcastOn(): array
    {
        // Canal público por tenant+user (no requiere auth endpoint)
        return [new Channel("notifications.{$this->tenantSlug}.{$this->userId}")];
    }

    public function broadcastAs(): string
    {
        return 'notification.sent';
    }
}
