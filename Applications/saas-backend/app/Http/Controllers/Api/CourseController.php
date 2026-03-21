<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Course;

class CourseController extends Controller
{
    /**
     * List all courses for the tenant.
     */
    public function index(Request $request)
    {
        $tenant = app('currentTenant');
        $courses = Course::where('tenant_id', $tenant->id)->get();

        return response()->json(['courses' => $courses]);
    }

    /**
     * Store a new course.
     */
    public function store(Request $request)
    {
        $tenant = app('currentTenant');
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'level' => 'nullable|string|max:50',
        ]);

        $course = Course::create([
            'tenant_id' => $tenant->id,
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'level' => $validated['level'] ?? null,
        ]);

        return response()->json([
            'message' => 'Curso creado correctamente',
            'course' => $course
        ], 201);
    }

    /**
     * Remove the specified course.
     */
    public function destroy($tenant, $id)
    {
        $tenantModel = app('currentTenant');
        $course = Course::where('tenant_id', $tenantModel->id)->findOrFail($id);
        
        $course->delete();

        return response()->json(['message' => 'Curso eliminado correctamente']);
    }
}
