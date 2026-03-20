<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PushSubscription extends Model
{
    protected $fillable = ['user_id', 'tenant_id', 'endpoint', 'public_key', 'auth_token'];
}
