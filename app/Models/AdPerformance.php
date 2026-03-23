<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdPerformance extends Model
{
    protected $table = 'ad_performance';

    protected $fillable = [
        'advertisement_id',
        'date',
        'impressions',
        'clicks',
        'ctr',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    public function advertisement(): BelongsTo
    {
        return $this->belongsTo(Advertisement::class);
    }
}
