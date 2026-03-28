<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Student;
use Illuminate\Support\Facades\Storage;

class StudentController extends Controller
{
    protected $imageService;

    public function __construct(\App\Services\ImageService $imageService)
    {
        $this->imageService = $imageService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $tenant = app('currentTenant');
        $tenantId = $tenant->id;

        // Si es apoderado, filtramos por sus alumnos. (simplificado: asume Auth->user() => guardian asociado)
        $user = $request->user();
        if ($user && $user->role === 'guardian') {
            $studentIds = \App\Models\GuardianStudent::where('guardian_id', $user->id)->pluck('student_id');
            $query = Student::where('tenant_id', $tenantId)->whereIn('id', $studentIds);
        } else {
            // Admins/Profes ven todos
            $query = Student::where('tenant_id', $tenantId);
        }

        $students = $query
            ->with([
                'course',
                'enrollments.payments',
                'attendances' => fn($q) => $q->where('date', now()->format('Y-m-d'))
            ])
            ->get()
            ->map(function ($student) {
                $bp = $student->belt_progress;
                
                return [
                    'id' => $student->id,
                    'name' => $student->name,
                    'category' => $student->category,
                    'photo' => $student->photo,
                    'course_id' => $student->course_id,
                    'course_name' => $student->course ? $student->course->name : null,
                    'has_debt' => !$student->is_updated,
                    'payment_status' => $student->is_updated ? 'paid' : 'overdue',
                    'payerStatus' => $student->is_updated ? 'paid' : 'overdue',
                    'belt_rank' => $student->belt_rank,
                    'degrees' => $bp['degrees'],
                    'total_attendances' => $bp['system_classes'],
                    'previous_classes' => $bp['real_classes'] - $bp['system_classes'],
                    'belt_classes_at_promotion' => (int)($student->belt_classes_at_promotion ?? 0),
                    'modality' => $student->modality,
                    'gender' => $student->gender,
                    'weight' => $student->weight,
                    'height' => $student->height,
                    'today_status' => $bp['today_status'],
                    'belt_progress' => $bp,
                ];
            });

        return response()->json(['students' => $students]);
    }

    /**
     * Upload photo for a specific student
     */
    public function uploadPhoto(Request $request, $tenant, $id)
    {
        // Sin límites rígidos, aceptamos archivos grandes (ej: 50MB) para procesar en el servidor
        $request->validate([
            'photo' => 'required|image|mimes:jpeg,png,jpg,webp,heic|max:51200', 
        ]);

        $tenant = app('currentTenant');
        $tenantId = $tenant->id;

        $student = Student::where('tenant_id', $tenantId)->findOrFail($id);

        // Security check for Guardian
        $user = $request->user();
        if ($user && $user->role === 'guardian') {
            $isAssociated = \App\Models\GuardianStudent::where('guardian_id', $user->id)
                ->where('student_id', $student->id)
                ->exists();
            
            if (!$isAssociated) {
                return response()->json(['error' => 'No autorizado'], 403);
            }
        }

        if ($request->hasFile('photo')) {
            $file = $request->file('photo');
            
            try {
                // Optimizar y convertir a WebP
                $optimizedPath = $this->imageService->optimize($file, 150, 150, 80);
                
                $filename = "student_{$student->id}_" . time() . ".webp";
                $s3Path = "tenants/{$tenantId}/students/{$filename}";

                // Subir a S3 el archivo optimizado (sin ACL 'public' para evitar error)
                $uploaded = Storage::disk('s3')->put($s3Path, file_get_contents($optimizedPath));
                
                // Limpiar archivo temporal
                unlink($optimizedPath);

                if ($uploaded) {
                    $url = Storage::disk('s3')->url($s3Path);

                    // Actualizar modelo
                    $student->photo = $url;
                    $student->save();

                    return response()->json([
                        'message' => 'Foto optimizada y actualizada correctamente',
                        'photo_url' => $url
                    ]);
                }
                
                return response()->json(['error' => 'Error al guardar en almacenamiento'], 500);

            } catch (\Exception $e) {
                \Log::error("Error optimizando imagen: " . $e->getMessage());
                return response()->json(['error' => 'Error al procesar la imagen: ' . $e->getMessage()], 500);
            }
        }

        return response()->json(['error' => 'No se recibió ninguna imagen'], 400);
    }

    public function update(Request $request, $tenant, $id)
    {
        $tenantModel = app('currentTenant');
        $student = Student::where('tenant_id', $tenantModel->id)->findOrFail($id);

        $user = $request->user();
        if ($user && $user->role === 'guardian') {
            $isAssociated = \App\Models\GuardianStudent::where('guardian_id', $user->id)
                ->where('student_id', $student->id)->exists();
            if (!$isAssociated) return response()->json(['error' => 'No autorizado'], 403);
        }

        $validated = $request->validate([
            'name'  => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
        ]);

        $student->update($validated);

        return response()->json([
            'message' => 'Perfil actualizado correctamente',
            'student' => $student
        ]);
    }

    public function updateBjj(Request $request, $tenant, $id)
    {
        $tenantModel = app('currentTenant');
        $student = Student::where('tenant_id', $tenantModel->id)->findOrFail($id);

        $user = $request->user();
        if ($user && $user->role === 'guardian') {
            $isAssociated = \App\Models\GuardianStudent::where('guardian_id', $user->id)
                ->where('student_id', $student->id)->exists();
            if (!$isAssociated) return response()->json(['error' => 'No autorizado'], 403);
        }

        $validated = $request->validate([
            'belt_rank'        => 'nullable|string',
            'degrees'          => 'nullable|integer',
            'modality'         => 'nullable|string',
            'previous_classes' => 'nullable|integer',
            'birth_date'       => 'nullable|date',
            'gender'           => 'nullable|string',
            'weight'           => 'nullable|numeric',
            'height'           => 'nullable|numeric',
            'category'         => 'nullable|string',
            'promote'          => 'nullable|boolean',
        ]);

        $promote = $validated['promote'] ?? false;
        unset($validated['promote']);

        if ($promote) {
            // Cuando se promociona, guardamos cuántas clases lleva acumuladas (sistema + anteriores)
            // para que el contador del nuevo cinturón empiece en 0.
            $inSystem = $student->attendances()->where('status', 'present')->count();
            $totalBefore = $inSystem + ($validated['previous_classes'] ?? $student->previous_classes ?? 0);
            $validated['belt_classes_at_promotion'] = $totalBefore;
        }

        $student->update($validated);

        return response()->json([
            'message' => 'Perfil BJJ actualizado correctamente',
            'student' => $student
        ]);
    }
    public function store(Request $request) {}
    public function show(Request $request, $tenant, $id)
    {
        $tenantModel = app('currentTenant');
        $student = Student::where('tenant_id', $tenantModel->id)
            ->with(['course', 'enrollments.payments'])
            ->findOrFail($id);

        $user = $request->user();
        if ($user && $user->role === 'guardian') {
            $isAssociated = \App\Models\GuardianStudent::where('guardian_id', $user->id)
                ->where('student_id', $student->id)->exists();
            if (!$isAssociated) return response()->json(['error' => 'No autorizado'], 403);
        }

        $bp = $student->belt_progress;
        
        $data = [
            'id' => $student->id,
            'name' => $student->name,
            'phone' => $student->phone,
            'email' => $student->email,
            'category' => $student->category,
            'photo' => $student->photo,
            'course_id' => $student->course_id,
            'course_name' => $student->course ? $student->course->name : null,
            'has_debt' => !$student->is_updated,
            'payment_status' => $student->is_updated ? 'paid' : 'overdue',
            'belt_rank' => $student->belt_rank,
            'degrees' => $bp['degrees'],
            'total_attendances' => $bp['system_classes'],
            'previous_classes' => $bp['real_classes'] - $bp['system_classes'],
            'belt_classes_at_promotion' => (int)($student->belt_classes_at_promotion ?? 0),
            'modality' => $student->modality,
            'gender' => $student->gender,
            'weight' => $student->weight,
            'height' => $student->height,
            'birth_date' => $student->birth_date,
            'belt_progress' => $bp,
        ];

        return response()->json(['student' => $data]);
    }

    public function updateName(Request $request, $tenant, $id)
    {
        $tenant  = app('currentTenant');
        $student = Student::where('tenant_id', $tenant->id)->findOrFail($id);

        $user = $request->user();
        if ($user && $user->role === 'guardian') {
            $isAssociated = \App\Models\GuardianStudent::where('guardian_id', $user->id)
                ->where('student_id', $student->id)->exists();
            if (!$isAssociated) return response()->json(['error' => 'No autorizado'], 403);
        }

        $validated = $request->validate(['name' => 'required|string|max:255']);
        $student->update(['name' => $validated['name']]);

        return response()->json(['message' => 'Nombre actualizado', 'student' => $student]);
    }


    public function updateCourse(Request $request, $tenant, $id)
    {
        $tenantModel = app('currentTenant');
        $student = Student::where('tenant_id', $tenantModel->id)->findOrFail($id);

        $validated = $request->validate([
            'course_id' => 'nullable|exists:courses,id'
        ]);

        $student->update(['course_id' => $validated['course_id']]);

        return response()->json([
            'message' => 'Curso actualizado correctamente',
            'student' => $student->load('course')
        ]);
    }

    public function destroy(string $id) {}
}