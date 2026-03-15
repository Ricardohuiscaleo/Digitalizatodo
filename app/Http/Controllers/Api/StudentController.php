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
                'enrollments' => fn($q) => $q->where('status', 'active'),
                'attendances' => fn($q) => $q->where('date', now()->format('Y-m-d'))
            ])
            ->get()
            ->map(function ($student) {
                // Calcular si tiene pagos pendientes
                $pendingPayments = $student->enrollments->sum(fn($e) => $e->payments()->where('status', 'pending')->count());
                $todayAttendance = $student->attendances->first();

                return [
                    'id' => $student->id,
                    'name' => $student->name,
                    'category' => $student->category,
                    'photo' => $student->photo,
                    'has_debt' => $pendingPayments > 0,
                    'pending_count' => $pendingPayments,
                    'today_status' => $todayAttendance ? $todayAttendance->status : null,
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

    // Resto del CRUD...
    public function store(Request $request) {}
    public function show(string $id) {}
    public function update(Request $request, string $id) {}
    public function destroy(string $id) {}
}