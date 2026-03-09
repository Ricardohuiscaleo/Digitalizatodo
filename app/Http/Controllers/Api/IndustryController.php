<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Industry;
use Illuminate\Http\Request;

class IndustryController extends Controller
{
    /**
     * Display a listing of active industries.
     */
    public function index()
    {
        try {
            $industries = Industry::where('active', true)->get();
            return response()->json($industries);
        }
        catch (\Exception $e) {
            return response()->json([
                'error' => 'Error fetching industries',
