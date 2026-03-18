<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    protected $fillable = [
        'tenant_id',
        'title',
        'description',
        'amount',
        'category',
        'receipt_photo',
        'product_photo',
        'expense_date',
        'created_by',
    ];

    protected $casts = [
        'expense_date' => 'date',
        'amount' => 'decimal:2',
    ];

    public function tenant() { return $this->belongsTo(Tenant::class); }
    public function creator() { return $this->belongsTo(User::class, 'created_by'); }
}
