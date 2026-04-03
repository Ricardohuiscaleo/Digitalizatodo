<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TimerState;
use App\Events\TimerStateUpdated;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class TimerController extends Controller
{
    /**
     * Obtiene el estado actual del cronómetro para el tenant.
     * GET /api/{tenant}/timer
     */
    public function getState(): JsonResponse
    {
        $tenant = app('currentTenant');
        
        $state = TimerState::firstOrCreate(
            ['tenant_id' => $tenant->id],
            [
                'status' => 'idle',
                'view' => 'clock',
                'initial_seconds' => 300,
                'remaining_seconds' => 300,
                'started_at' => null,
            ]
        );

        $stateData = $state->toArray();
        $stateData['started_at'] = $state->started_at ? $state->started_at->toISOString() : null;

        return response()->json([
            'state' => $stateData,
            'server_time' => now('UTC')->toISOString()
        ]);
    }

    /**
     * Actualiza el estado del cronómetro y dispara el evento de broadcasting.
     * POST /api/{tenant}/timer/update
     */
    public function updateState(Request $request): JsonResponse
    {
        $tenant = app('currentTenant');
        
        $request->validate([
            'status' => 'required|in:idle,running,paused,finished',
            'view' => 'sometimes|string|in:clock,menu,timer',
            'initial_seconds' => 'required|integer',
            'remaining_seconds' => 'required|integer',
            'started_at' => 'nullable' // ISO String or null
        ]);

        // Validar que si el estado es de cronómetro, la vista sea de cronómetro
        $view = $request->view ?? 'timer';
        if (in_array($request->status, ['running', 'paused', 'finished'])) {
            $view = 'timer';
        }

        $state = TimerState::firstOrCreate(['tenant_id' => $tenant->id]);
        $serverTime = now('UTC');
        $startedAt = $request->status === 'running' 
            ? ($request->started_at ? \Carbon\Carbon::parse($request->started_at)->setTimezone('UTC') : $serverTime) 
            : null;

        $state->update([
            'status' => $request->status,
            'view' => $view,
            'initial_seconds' => $request->initial_seconds,
            'remaining_seconds' => $request->remaining_seconds,
            'started_at' => $startedAt,
            'last_synced_at' => $serverTime,
        ]);

        // Broadcast the update
        try {
            event(new TimerStateUpdated(
                $state->status,
                $state->initial_seconds,
                $state->remaining_seconds,
                $state->started_at ? $state->started_at->toISOString() : null,
                $tenant->slug,
                $state->view
            ));
        } catch (\Throwable $e) {
            Log::warning('Broadcast timer-update failed', ['error' => $e->getMessage()]);
        }

        $freshState = $state->fresh();
        $stateData = $freshState->toArray();
        $stateData['started_at'] = $freshState->started_at ? $freshState->started_at->toISOString() : null;

        return response()->json([
            'success' => true,
            'state' => $stateData
        ]);
    }
}
