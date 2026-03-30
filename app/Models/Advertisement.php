<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
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
        'is_pinned',
        'is_house_ad',
        'is_fallback',
        'fallback_ad_id',
        'workflow_status',
        'reviewer_notes',
        'internal_comments',
        'recurrence_type',
        'recurrence_days',
        'frequency_cap_type',
        'frequency_cap_value',
        'device_targets',
        'geo_countries',
        'language_locales',
        'audience_tags',
        'utm_params',
        'has_video',
        'video_embed_url',
        'supported_sizes',
        'variant_enabled',
        'variant_a',
        'variant_b',
        'variant_split',
        'winner_metric',
        'daily_budget',
        'spent_amount',
        'last_served_at',
        'display_behavior',
        'display_config',
        'is_closable',
        'close_button_delay_seconds',
        'schedule_rules',
        'max_total_impressions',
        'max_daily_impressions',
        'url_patterns',
        'exclude_rules',
    ];

    protected $casts = [
        'open_in_new_tab' => 'boolean',
        'is_responsive' => 'boolean',
        'pages' => 'array',
        'category_ids' => 'array',
        'targeting' => 'array',
        'is_pinned' => 'boolean',
        'is_house_ad' => 'boolean',
        'is_fallback' => 'boolean',
        'recurrence_days' => 'array',
        'device_targets' => 'array',
        'geo_countries' => 'array',
        'language_locales' => 'array',
        'audience_tags' => 'array',
        'utm_params' => 'array',
        'has_video' => 'boolean',
        'supported_sizes' => 'array',
        'variant_enabled' => 'boolean',
        'variant_a' => 'array',
        'variant_b' => 'array',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'last_served_at' => 'datetime',
        'display_config' => 'array',
        'is_closable' => 'boolean',
        'schedule_rules' => 'array',
        'url_patterns' => 'array',
        'exclude_rules' => 'array',
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

    public function fallbackAd(): BelongsTo
    {
        return $this->belongsTo(self::class, 'fallback_ad_id');
    }

    public function fallbackFor(): HasOne
    {
        return $this->hasOne(self::class, 'fallback_ad_id');
    }

    public function auditEvents(): HasMany
    {
        return $this->hasMany(AdAuditEvent::class)->latest();
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
