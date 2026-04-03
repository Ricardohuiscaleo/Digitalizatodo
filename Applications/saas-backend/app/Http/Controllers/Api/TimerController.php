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

        return response()->json([
            'state' => $state,
            'server_time' => now()->toISOString()
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

        $state = TimerState::updateOrCreate(
            ['tenant_id' => $tenant->id],
            [
                'status' => $request->status,
                'view' => $request->view ?? 'timer', // Default a timer si se está actualizando el estado de tiempo
                'initial_seconds' => $request->initial_seconds,
                'remaining_seconds' => $request->remaining_seconds,
                'started_at' => $request->status === 'running' ? ($request->started_at ?? now()) : null,
                'last_synced_at' => now(),
            ]
        );

        // Broadcast the update
        try {
            event(new TimerStateUpdated(
                $state->status,
                $state->initial_seconds,
                $state->remaining_seconds,
                $state->status === 'running' ? ($state->started_at ? $state->started_at->toISOString() : now()->toISOString()) : null,
                $tenant->slug,
                $state->view
            ));
        } catch (\Throwable $e) {
            Log::warning('Broadcast timer-update failed', ['error' => $e->getMessage()]);
        }

        return response()->json([
            'success' => true,
            'state' => $state
        ]);
    }
}
