<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Industry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class IndustryController extends Controller
{
    /**
     * Display a listing of active industries.
     */
    public function index()
    {
        try {
            // Log para debuggear por qué devuelve vacío
            $allCount = Industry::count();
            $activeCount = Industry::where('active', true)->count();

            Log::info('Industry API Debug', [
                'total_count' => $allCount,
                'active_count' => $activeCount,
                'sql' => Industry::where('active', true)->toSql()
            ]);

            $industries = Industry::where('active', true)->get();
            return response()->json($industries);
        }
        catch (\Exception $e) {
            Log::error('Industry API Error', ['message' => $e->getMessage()]);
            return response()->json([
                'error' => 'Error fetching industries',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
