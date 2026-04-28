<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class Advertisement extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'title',
        'description',
        'ad_type',
        'media_url',
        'media_type',
        'embed_code',
        'redirect_url',
        'cta_label',
        'bg_color',
        'placement_type',
        'device_target',
        'float_position',
        'float_animation',
        'popup_delay_seconds',
        'popup_frequency_minutes',
        'sticky_offset_px',
        'ab_testing_enabled',
        'start_datetime',
        'end_datetime',
        'status',
        'priority',
        'is_dismissible',
        'created_by',
    ];

    protected $casts = [
        'start_datetime'          => 'datetime',
        'end_datetime'            => 'datetime',
        'is_dismissible'          => 'boolean',
        'ab_testing_enabled'      => 'boolean',
        'priority'                => 'integer',
        'impressions_count'       => 'integer',
        'clicks_count'            => 'integer',
        'popup_delay_seconds'     => 'integer',
        'popup_frequency_minutes' => 'integer',
        'sticky_offset_px'        => 'integer',
    ];

    protected $appends = ['media_full_url', 'ctr'];

    // ─── Relationships ──────────────────────────────────────────────────────────

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function impressions(): HasMany
    {
        return $this->hasMany(AdImpression::class);
    }

    public function clicks(): HasMany
    {
        return $this->hasMany(AdClick::class);
    }

    public function schedule(): HasOne
    {
        return $this->hasOne(AdSchedule::class);
    }

    public function variants(): HasMany
    {
        return $this->hasMany(AdVariant::class)->orderBy('label');
    }

    // ─── Scopes ─────────────────────────────────────────────────────────────────

    public function scopeActive(Builder $query): Builder
    {
        $now = now();

        return $query->where('status', 'active')
            ->where(function (Builder $q) use ($now) {
                $q->whereNull('start_datetime')->orWhere('start_datetime', '<=', $now);
            })
            ->where(function (Builder $q) use ($now) {
                $q->whereNull('end_datetime')->orWhere('end_datetime', '>=', $now);
            });
    }

    public function scopeForPlacement(Builder $query, string $placement): Builder
    {
        return $query->where('placement_type', $placement);
    }

    public function scopeForDevice(Builder $query, string $device): Builder
    {
        return $query->where(function (Builder $q) use ($device) {
            $q->where('device_target', $device)->orWhere('device_target', 'all');
        });
    }

    public function scopeOfType(Builder $query, string $type): Builder
    {
        return $query->where('ad_type', $type);
    }

    // ─── Accessors ──────────────────────────────────────────────────────────────

    public function getMediaFullUrlAttribute(): ?string
    {
        if (!$this->media_url) return null;
        if (str_starts_with($this->media_url, 'http')) return $this->media_url;
        return Storage::disk('public')->url($this->media_url);
    }

    public function getCtrAttribute(): float
    {
        if ($this->impressions_count === 0) return 0.0;
        return round(($this->clicks_count / $this->impressions_count) * 100, 2);
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────

    public function incrementImpressions(): void
    {
        $this->increment('impressions_count');
    }

    public function incrementClicks(): void
    {
        $this->increment('clicks_count');
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isHtmlBased(): bool
    {
        return in_array($this->media_type, ['html', 'script']);
    }

    /**
     * Select a variant by weighted random. Returns null when A/B is off.
     */
    public function selectVariant(): ?AdVariant
    {
        if (!$this->ab_testing_enabled) return null;

        $variants = $this->variants;
        if ($variants->isEmpty()) return null;

        $totalWeight = $variants->sum('weight');
        $random = mt_rand(1, max($totalWeight, 1));
        $cumulative = 0;

        foreach ($variants as $variant) {
            $cumulative += $variant->weight;
            if ($random <= $cumulative) return $variant;
        }

        return $variants->first();
    }
}
