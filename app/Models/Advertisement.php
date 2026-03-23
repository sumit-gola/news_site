<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Advertisement extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'advertiser_id',
        'ad_slot_id',
        'title',
        'slug',
        'description',
        'ad_type',
        'image_url',
        'image_path',
        'video_url',
        'html_code',
        'script_code',
        'size',
        'custom_width',
        'custom_height',
        'redirect_url',
        'target_url',
        'open_in_new_tab',
        'width',
        'height',
        'position',
        'pages',
        'category_ids',
        'start_date',
        'end_date',
        'daily_limit',
        'priority',
        'is_responsive',
        'targeting',
        'rotation_type',
        'status',
        'total_impressions',
        'total_clicks',
    ];

    protected $casts = [
        'open_in_new_tab' => 'boolean',
        'is_responsive' => 'boolean',
        'pages' => 'array',
        'category_ids' => 'array',
        'targeting' => 'array',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
    ];

    protected $appends = ['ctr'];

    public function advertiser(): BelongsTo
    {
        return $this->belongsTo(Advertiser::class);
    }

    public function slot(): BelongsTo
    {
        return $this->belongsTo(AdSlot::class, 'ad_slot_id');
    }

    public function performance(): HasMany
    {
        return $this->hasMany(AdPerformance::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active')
            ->where(function (Builder $q): void {
                $q->whereNull('start_date')->orWhere('start_date', '<=', now());
            })
            ->where(function (Builder $q): void {
                $q->whereNull('end_date')->orWhere('end_date', '>=', now());
            });
    }

    public function getCtrAttribute(): float
    {
        if ((int) $this->total_impressions === 0) {
            return 0;
        }

        return round(((int) $this->total_clicks / (int) $this->total_impressions) * 100, 2);
    }
}
