<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ArticleMeta extends Model
{
    protected $table = 'article_meta';

    protected $fillable = [
        'article_id',
        'meta_title',
        'meta_description',
        'meta_keywords',
        'og_image',
        'canonical_url',
        'read_time',
        'word_count',
    ];

    protected $casts = [
        'read_time' => 'integer',
        'word_count' => 'integer',
    ];

    /**
     * The article this metadata belongs to.
     */
    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class);
    }

    /**
     * Get effective meta title (fallback to article title).
     */
    public function getEffectiveMetaTitleAttribute(): string
    {
        return $this->meta_title ?? $this->article->title;
    }

    /**
     * Get effective meta description (fallback to excerpt).
     */
    public function getEffectiveMetaDescriptionAttribute(): string
    {
        return $this->meta_description ?? $this->article->excerpt;
    }
}
