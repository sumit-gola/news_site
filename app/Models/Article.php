<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Article extends Model
{
    use HasFactory, SoftDeletes;

    protected $appends = [
        'featured_image_url',
    ];

    protected $fillable = [
        'title',
        'slug',
        'content',
        'excerpt',
        'featured_image',
        'user_id',
        'status',
        'approved_by',
        'published_at',
    ];

    protected $casts = [
        'published_at'  => 'datetime',
        'created_at'    => 'datetime',
        'updated_at'    => 'datetime',
    ];

    // ─── Relationships ─────────────────────────────────────────────────────

    /**
     * The user who authored the article.
     */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * The user who approved the article.
     */
    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * The article's SEO metadata.
     */
    public function meta(): HasOne
    {
        return $this->hasOne(ArticleMeta::class);
    }

    /**
     * Categories this article belongs to.
     */
    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class, 'article_category')
                    ->withTimestamps();
    }

    /**
     * Tags attached to this article.
     */
    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class, 'article_tag');
    }

    // ─── Scopes ────────────────────────────────────────────────────────────

    public function scopePublished($query)
    {
        return $query->where('status', 'published')
                     ->whereNotNull('published_at')
                     ->orderByDesc('published_at');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    public function scopeByAuthor($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    // ─── Mutators ──────────────────────────────────────────────────────────

    /**
     * Auto-generate slug if not provided.
     */
    public static function boot()
    {
        parent::boot();

        static::creating(function ($article) {
            if (!$article->slug) {
                $article->slug = Str::slug($article->title) . '-' . uniqid();
            }
        });
    }

    // ─── Accessors / Methods ──────────────────────────────────────────────

    /**
     * Check if article is published.
     */
    public function isPublished(): bool
    {
        return $this->status === 'published' && $this->published_at !== null;
    }

    /**
     * Check if article is pending approval.
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Check if article is a draft.
     */
    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    /**
     * Get featured image URL or placeholder.
     */
    public function getFeaturedImageUrl(): string
    {
        if ($this->featured_image) {
            return asset('storage/' . $this->featured_image);
        }
        return 'https://via.placeholder.com/1200x630?text=No+Image';
    }

    /**
     * Get a normalized featured image URL suitable for internal and public views.
     */
    public function getFeaturedImageUrlAttribute(): ?string
    {
        $path = trim((string) $this->featured_image);

        if ($path === '') {
            return null;
        }

        if (Str::startsWith($path, ['http://', 'https://', '//'])) {
            return $path;
        }

        if (Str::startsWith($path, '/storage/')) {
            return asset(ltrim($path, '/'));
        }

        if (Str::startsWith($path, '/')) {
            return url($path);
        }

        return asset('storage/' . ltrim($path, '/'));
    }

    /**
     * Calculate read time in minutes.
     */
    public function getReadTimeAttribute(): int
    {
        $wordCount = str_word_count(strip_tags($this->content));
        return (int) ceil($wordCount / 200); // 200 words per minute average
    }

    /**
     * Get word count.
     */
    public function getWordCountAttribute(): int
    {
        return str_word_count(strip_tags($this->content));
    }

    /**
     * Get public-facing URL for this article.
     */
    public function getUrlAttribute(): string
    {
        return route('news.show', $this->slug);
    }
}
