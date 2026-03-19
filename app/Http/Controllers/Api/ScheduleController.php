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
            'day_of_week' => 'required|integer|min:0|max:6',
            'start_time'  => 'required|date_format:H:i',
            'end_time'    => 'required|date_format:H:i|after:start_time',
            'capacity'    => 'nullable|integer|min:1',
            'student_ids' => 'nullable|array',
            'student_ids.*' => 'exists:students,id'
        ]);

        return DB::transaction(function () use ($validated, $tenant) {
            $schedule = Schedule::create([
                'tenant_id'   => $tenant->id,
                'name'        => $validated['name'] ?? null,
                'subject'     => $validated['subject'] ?? null,
                'day_of_week' => $validated['day_of_week'],
                'start_time'  => $validated['start_time'],
                'end_time'    => $validated['end_time'],
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

    public function update(Request $request, $id)
    {
        $tenant = app('currentTenant');
        $schedule = Schedule::where('tenant_id', $tenant->id)->findOrFail($id);

        $validated = $request->validate([
            'name'        => 'nullable|string|max:255',
            'subject'     => 'nullable|string|max:100',
            'day_of_week' => 'required|integer|min:0|max:6',
            'start_time'  => 'required|date_format:H:i',
            'end_time'    => 'required|date_format:H:i|after:start_time',
            'capacity'    => 'nullable|integer|min:1',
            'student_ids' => 'nullable|array',
            'student_ids.*' => 'exists:students,id'
        ]);

        return DB::transaction(function () use ($validated, $schedule) {
            $schedule->update([
                'name'        => $validated['name'] ?? null,
                'subject'     => $validated['subject'] ?? null,
                'day_of_week' => $validated['day_of_week'],
                'start_time'  => $validated['start_time'],
                'end_time'    => $validated['end_time'],
                'capacity'    => $validated['capacity'] ?? null,
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

    public function destroy($id)
    {
        $tenant = app('currentTenant');
        $schedule = Schedule::where('tenant_id', $tenant->id)->findOrFail($id);
        
        $schedule->delete();

        return response()->json([
            'message' => 'Schedule deleted successfully'
        ]);
    }

    public function assignStudents(Request $request, $id)
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
