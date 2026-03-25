<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantTerm extends Model
{
    protected $fillable = [
        'tenant_id',
        'content',
        'active',
        'version',
    ];

    protected $casts = [
        'active' => 'boolean',
        'version' => 'integer',
    ];

    /**
     * Get the tenant that owns these terms.
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
