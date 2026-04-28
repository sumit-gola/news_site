<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class AdVariant extends Model
{
    protected $fillable = [
        'advertisement_id',
        'label',
        'media_url',
        'embed_code',
        'cta_label',
        'weight',
        'impressions_count',
        'clicks_count',
    ];

    protected $casts = [
        'weight'            => 'integer',
        'impressions_count' => 'integer',
        'clicks_count'      => 'integer',
    ];

    protected $appends = ['media_full_url', 'ctr'];

    public function advertisement(): BelongsTo
    {
        return $this->belongsTo(Advertisement::class);
    }

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

    public function incrementImpressions(): void
    {
        $this->increment('impressions_count');
    }

    public function incrementClicks(): void
    {
        $this->increment('clicks_count');
    }
}
