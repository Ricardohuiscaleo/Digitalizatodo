<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppUpdate extends Model
{
    protected $fillable = ['version', 'title', 'description', 'target', 'published_at'];
    protected $casts = ['published_at' => 'datetime'];
}
