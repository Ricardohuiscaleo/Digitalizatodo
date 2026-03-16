<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppUpdate;
use Illuminate\Http\JsonResponse;

class AppUpdateController extends Controller
{
    public function index(): JsonResponse
    {
        $updates = AppUpdate::orderByDesc('published_at')->limit(20)->get();

        return response()->json([
            'latest' => $updates->first()?->version,
            'updates' => $updates->map(fn($u) => [
                'id' => $u->id,
                'version' => $u->version,
                'title' => $u->title,
                'description' => $u->description,
                'target' => $u->target,
                'published_at' => $u->published_at->format('d M, Y'),
            ]),
        ]);
    }
}
