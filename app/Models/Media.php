<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Media extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'media';

    protected $fillable = [
        'user_id',
        'file_name',
        'file_path',
        'file_type',
        'mime_type',
        'file_size',
        'width',
        'height',
        'alt_text',
    ];

    protected $casts = [
        'file_size' => 'integer',
        'width'     => 'integer',
        'height'    => 'integer',
    ];

    // ─── Relationships ─────────────────────────────────────────────────────

    /**
     * The user who uploaded this media.
     */
    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Articles using this media.
     */
    public function articles(): BelongsToMany
    {
        return $this->belongsToMany(Article::class, 'article_media')
                    ->withPivot('order')
                    ->withTimestamps();
    }

    // ─── Scopes ────────────────────────────────────────────────────────────

    public function scopeImages($query)
    {
        return $query->where('file_type', 'image');
    }

    public function scopeVideos($query)
    {
        return $query->where('file_type', 'video');
    }

    public function scopeDocuments($query)
    {
        return $query->where('file_type', 'document');
    }

    public function scopeByUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    // ─── Accessors / Methods ──────────────────────────────────────────────

    /**
     * Get full URL for the media file.
     */
    public function getUrlAttribute(): string
    {
        return url('storage/' . $this->file_path);
    }

    /**
     * Check if media is an image.
     */
    public function isImage(): bool
    {
        return $this->file_type === 'image';
    }

    /**
     * Check if media is a video.
     */
    public function isVideo(): bool
    {
        return $this->file_type === 'video';
    }

    /**
     * Get human-readable file size.
     */
    public function getHumanFileSizeAttribute(): string
    {
        $bytes = $this->file_size;
        $units = ['B', 'KB', 'MB', 'GB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= (1 << (10 * $pow));

        return round($bytes, 2) . ' ' . $units[$pow];
    }

    /**
     * Get media thumbnail URL (for images).
     */
    public function getThumbnailUrl(): string
    {
        if ($this->isImage()) {
            return $this->url;
        }
        return 'https://via.placeholder.com/200x200?text=No+Preview';
    }
}
