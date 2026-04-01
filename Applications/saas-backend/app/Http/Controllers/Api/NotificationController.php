<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guardian;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        // Guardians no tienen notificaciones en el sistema (user_id es de staff)
        if ($request->user() instanceof Guardian) {
            return response()->json(['unread' => 0, 'notifications' => []]);
        }

        $notifications = Notification::forUser($request->user()->id)
            ->where('tenant_id', app('currentTenant')->id)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get()
            ->map(fn($n) => [
                'id' => $n->id,
                'title' => $n->title,
                'body' => $n->body,
                'type' => $n->type,
                'read' => $n->read_at !== null,
                'created_at' => $n->created_at->diffForHumans(),
            ]);

        $unread = Notification::forUser($request->user()->id)
            ->where('tenant_id', app('currentTenant')->id)
            ->unread()
            ->count();

        return response()->json(['unread' => $unread, 'notifications' => $notifications]);
    }

    public function read(Request $request, int $id): JsonResponse
    {
        if ($request->user() instanceof Guardian) {
            return response()->json(['ok' => true]);
        }

        Notification::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['ok' => true]);
    }

    public function readAll(Request $request): JsonResponse
    {
        if ($request->user() instanceof Guardian) {
            return response()->json(['ok' => true]);
        }

        Notification::forUser($request->user()->id)
            ->where('tenant_id', app('currentTenant')->id)
            ->unread()
            ->update(['read_at' => now()]);

        return response()->json(['ok' => true]);
    }
}
