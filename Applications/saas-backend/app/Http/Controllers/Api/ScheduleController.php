<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Schedule;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ScheduleController extends Controller
{
    public function index(Request $request)
    {
        $tenant = app('currentTenant');
        if (!$tenant) {
            return response()->json(['error' => 'Tenant not found'], 404);
        }

        $schedules = Schedule::where('tenant_id', $tenant->id)
            ->with('students:id,name,photo,category')
            ->get();

        return response()->json([
            'schedules' => $schedules
        ]);
    }

    public function store(Request $request)
    {
        $tenant = app('currentTenant');
        if (!$tenant) {
            return response()->json(['error' => 'Tenant not found'], 404);
        }

        $validated = $request->validate([
            'name'        => 'nullable|string|max:255',
            'subject'     => 'nullable|string|max:100',
            'color'       => 'nullable|string|max:20',
            'day_of_week' => 'required|integer|min:0|max:6',
            'start_time'  => ['required', 'regex:/^\d{2}:\d{2}(:\d{2})?$/'],
            'end_time'    => ['required', 'regex:/^\d{2}:\d{2}(:\d{2})?$/'],
            'capacity'    => 'nullable|integer|min:1',
            'student_ids' => 'nullable|array',
            'student_ids.*' => 'exists:students,id'
        ]);

        return DB::transaction(function () use ($validated, $tenant) {
            $schedule = Schedule::create([
                'tenant_id'   => $tenant->id,
                'name'        => $validated['name'] ?? null,
                'subject'     => $validated['subject'] ?? null,
                'color'       => $validated['color'] ?? null,
                'day_of_week' => $validated['day_of_week'],
                'start_time'  => substr($validated['start_time'], 0, 5),
                'end_time'    => substr($validated['end_time'], 0, 5),
                'capacity'    => $validated['capacity'] ?? null,
            ]);

            if (!empty($validated['student_ids'])) {
                $schedule->students()->sync($validated['student_ids']);
            }

            return response()->json([
                'message' => 'Schedule created successfully',
                'schedule' => $schedule->load('students:id,name,photo')
            ], 201);
        });
    }

    public function update(Request $request, $tenant, $id)
    {
        $tenant = app('currentTenant');
        $schedule = Schedule::where('tenant_id', $tenant->id)->findOrFail($id);

        $validated = $request->validate([
            'name'        => 'nullable|string|max:255',
            'subject'     => 'nullable|string|max:100',
            'color'       => 'nullable|string|max:20',
            'day_of_week' => 'sometimes|integer|min:0|max:6',
            'start_time'  => ['sometimes', 'regex:/^\d{2}:\d{2}(:\d{2})?$/'],
            'end_time'    => ['sometimes', 'regex:/^\d{2}:\d{2}(:\d{2})?$/'],
            'capacity'    => 'nullable|integer|min:1',
            'student_ids' => 'nullable|array',
            'student_ids.*' => 'exists:students,id'
        ]);

        return DB::transaction(function () use ($validated, $schedule) {
            $schedule->update([
                'name'        => array_key_exists('name', $validated) ? $validated['name'] : $schedule->name,
                'subject'     => array_key_exists('subject', $validated) ? $validated['subject'] : $schedule->subject,
                'color'       => array_key_exists('color', $validated) ? $validated['color'] : $schedule->color,
                'day_of_week' => $validated['day_of_week'] ?? $schedule->day_of_week,
                'start_time'  => $validated['start_time'] ?? $schedule->start_time,
                'end_time'    => $validated['end_time'] ?? $schedule->end_time,
                'capacity'    => $validated['capacity'] ?? $schedule->capacity,
            ]);

            if (isset($validated['student_ids'])) {
                $schedule->students()->sync($validated['student_ids']);
            }

            return response()->json([
                'message' => 'Schedule updated successfully',
                'schedule' => $schedule->load('students:id,name,photo')
            ]);
        });
    }

    public function destroy($tenant, $id)
    {
        $tenant = app('currentTenant');
        $schedule = Schedule::where('tenant_id', $tenant->id)->findOrFail($id);
        
        $schedule->delete();

        return response()->json([
            'message' => 'Schedule deleted successfully'
        ]);
    }

    public function assignStudents(Request $request, $tenant, $id)
    {
        $tenant = app('currentTenant');
        $schedule = Schedule::where('tenant_id', $tenant->id)->findOrFail($id);

        $validated = $request->validate([
            'student_ids' => 'required|array',
            'student_ids.*' => 'exists:students,id'
        ]);

        $schedule->students()->sync($validated['student_ids']);

        return response()->json([
            'message' => 'Students assigned successfully',
            'schedule' => $schedule->load('students:id,name,photo')
        ]);
    }
}
