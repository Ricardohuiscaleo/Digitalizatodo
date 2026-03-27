<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SaasPaymentLog extends Model
{
    protected $fillable = [
        'tenant_id',
        'saas_plan_id',
        'amount',
        'currency',
        'status',
        'mp_preapproval_id',
        'mp_payment_id',
        'paid_at'
    ];

    protected $casts = [
        'paid_at' => 'datetime',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function saasPlan()
    {
        return $this->belongsTo(SaasPlan::class);
    }
}
