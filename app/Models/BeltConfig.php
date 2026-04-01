<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BeltConfig extends Model
{
    protected $table = 'belt_configs';
    
    protected $fillable = [
        'category',
        'belt_rank',
        'next_belt',
        'classes_per_stripe',
        'total_for_belt',
        'min_age',
    ];
}
