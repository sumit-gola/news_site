<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class Advertisement extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'title',
        'description',
        'media_url',
        'media_type',
        'redirect_url',
        'placement_type',
        'device_target',
        'start_datetime',
        'end_datetime',
        'status',
        'priority',
        'is_dismissible',
        'created_by',
    ];

    protected $casts = [
        'start_datetime'   => 'datetime',
        'end_datetime'     => 'datetime',
        'is_dismissible'   => 'boolean',
        'priority'         => 'integer',
        'impressions_count'=> 'integer',
        'clicks_count'     => 'integer',
    ];

    protected $appends = ['media_full_url'];

    // ─── Relationships ──────────────────────────────────────────────────────────

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // ─── Scopes ─────────────────────────────────────────────────────────────────

    /**
     * Only ads that are active and within their scheduled datetime window.
     */
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

    /**
     * Filter by placement type.
     */
    public function scopeForPlacement(Builder $query, string $placement): Builder
    {
        return $query->where('placement_type', $placement);
    }

    /**
     * Filter by device — matches the specific device OR 'all'.
     */
    public function scopeForDevice(Builder $query, string $device): Builder
    {
        return $query->where(function (Builder $q) use ($device) {
            $q->where('device_target', $device)->orWhere('device_target', 'all');
        });
    }

    // ─── Accessors ──────────────────────────────────────────────────────────────

    public function getMediaFullUrlAttribute(): ?string
    {
        if (!$this->media_url) {
            return null;
        }

        // Already an absolute URL (e.g. external CDN)
        if (str_starts_with($this->media_url, 'http')) {
            return $this->media_url;
        }

        return Storage::disk('public')->url($this->media_url);
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

    public function isScheduled(): bool
    {
        return $this->status === 'active'
            && $this->start_datetime !== null
            && $this->start_datetime->isFuture();
    }
}
