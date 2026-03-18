<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FeePayment extends Model
{
    protected $fillable = [
        'fee_id', 'tenant_id', 'guardian_id', 'student_id',
        'status', 'payment_method', 'proof_url', 'paid_at', 'approved_by', 'notes',
    ];

    protected $casts = ['paid_at' => 'datetime'];

    public function fee()      { return $this->belongsTo(Fee::class); }
    public function guardian() { return $this->belongsTo(Guardian::class); }
    public function student()  { return $this->belongsTo(Student::class); }
}
