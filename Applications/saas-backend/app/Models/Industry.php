<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Industry extends Model
{
    /** @var bool */
    public $incrementing = false;

    /** @var string */
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'name',
        'active',
        'icon',
    ];

    protected $casts = [
        'active' => 'boolean',
    ];
}
