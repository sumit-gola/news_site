<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AdSlot extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'page',
        'position',
        'location',
        'device_type',
        'size',
        'max_ads',
        'status',
        'allowed_sizes',
        'description',
        'is_active',
    ];

    protected $casts = [
        'allowed_sizes' => 'array',
        'is_active' => 'boolean',
        'max_ads' => 'integer',
    ];

    public function advertisements(): HasMany
    {
        return $this->hasMany(Advertisement::class);
    }
}
