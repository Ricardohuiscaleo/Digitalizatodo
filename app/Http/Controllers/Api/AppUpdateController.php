<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppUpdate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AppUpdateController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $target = $request->query('target'); // staff, student, o null para todos

        $updates = AppUpdate::orderByDesc('published_at')
            ->when($target, fn($q) => $q->where('target', $target)->orWhere('target', 'all'))
            ->limit(20)
            ->get()
            ->map(fn($u) => [
                'id' => $u->id,
                'version' => $u->version,
                'title' => $u->title,
                'description' => $u->description,
                'target' => $u->target,
                'published_at' => $u->published_at->format('d M, Y'),
            ]);

        return response()->json([
            'latest' => $updates->first()?->only(['version', 'title']),
            'updates' => $updates,
        ]);
    }
}
