<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Fee extends Model
{
    protected $fillable = [
        'tenant_id', 'plan_id', 'title', 'description', 'amount', 'due_date',
        'target', 'type', 'recurring_day', 'billing_cycle', 'created_by',
    ];

    protected $casts = ['due_date' => 'date', 'amount' => 'float'];

    public function plan()     { return $this->belongsTo(Plan::class); }
    public function payments() { return $this->hasMany(FeePayment::class); }
    public function creator()  { return $this->belongsTo(User::class, 'created_by'); }
    public function tenant()   { return $this->belongsTo(\App\Models\Tenant::class); }
}
