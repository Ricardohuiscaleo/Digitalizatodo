<?php

namespace App\Models;

use App\Events\NotificationSent;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    protected $fillable = ['tenant_id', 'user_id', 'title', 'body', 'type', 'read_at'];
    protected $casts = ['read_at' => 'datetime'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeUnread($query)
    {
        return $query->whereNull('read_at');
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Crea una notificación y emite el evento WebSocket.
     */
    public static function send(int $tenantId, int $userId, string $title, string $body, string $type, string $tenantSlug): self
    {
        $n = self::create([
            'tenant_id' => $tenantId,
            'user_id' => $userId,
            'title' => $title,
            'body' => $body,
            'type' => $type,
        ]);

        try {
            event(new NotificationSent($n->id, $title, $body, $type, $userId, $tenantSlug));
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('NotificationSent broadcast failed', ['error' => $e->getMessage()]);
        }

        return $n;
    }
}
