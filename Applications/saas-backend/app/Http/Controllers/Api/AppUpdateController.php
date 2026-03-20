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
        $target   = $request->query('target');
        $industry = $request->query('industry');

        $updates = AppUpdate::orderByDesc('published_at')
            ->when($target, fn($q) => $q->where(fn($q2) =>
                $q2->where('target', $target)->orWhere('target', 'all')
            ))
            ->when($industry, fn($q) => $q->where(fn($q2) =>
                $q2->where('industry', $industry)->orWhereNull('industry')
            ))
            ->limit(20)
            ->get();

        $mapped = $updates->map(fn($u) => [
            'id'           => $u->id,
            'version'      => $u->version,
            'title'        => $u->title,
            'description'  => $u->description,
            'target'       => $u->target,
            'industry'     => $u->industry,
            'published_at' => $u->published_at?->format('d M, Y') ?? '',
        ]);

        $first = $updates->first();

        return response()->json([
            'latest'  => $first ? ['version' => $first->version, 'title' => $first->title] : null,
            'updates' => $mapped,
        ]);
    }
}
