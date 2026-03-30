<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdminEmail extends Model
{
    protected $fillable = [
        'direction',
        'from_email',
        'to_email',
        'subject',
        'content_html',
        'content_text',
        'is_read',
        'resend_id',
        'parent_id'
    ];

    public function parent()
    {
        return $this->belongsTo(AdminEmail::class, 'parent_id');
    }

    public function replies()
    {
        return $this->hasMany(AdminEmail::class, 'parent_id');
    }
}
