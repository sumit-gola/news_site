<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Page extends Model
{
    use HasFactory, SoftDeletes;

    protected $appends = ['featured_image_url', 'seo_meta'];

    protected $fillable = [
        'title',
        'slug',
        'excerpt',
        'content',
        'featured_image',
        'category_id',
        'user_id',
        'status',
        'template',
        'published_at',
        'show_in_menu',
        'is_featured',
        'noindex',
        'order',
        'views',
        // flat SEO columns
        'meta_title',
        'meta_description',
        'meta_keywords',
        'og_image',
        'canonical_url',
    ];

    protected $casts = [
        'published_at'  => 'datetime',
        'show_in_menu'  => 'boolean',
        'is_featured'   => 'boolean',
        'noindex'       => 'boolean',
        'created_at'    => 'datetime',
        'updated_at'    => 'datetime',
    ];

    // ─── Boot ──────────────────────────────────────────────────────────────

    public static function boot(): void
    {
        parent::boot();

        static::creating(function (Page $page) {
            if (! $page->slug) {
                $page->slug = static::generateUniqueSlug(Str::slug($page->title));
            }
        });
    }

    // ─── Relationships ─────────────────────────────────────────────────────

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    // ─── Scopes ────────────────────────────────────────────────────────────

    public function scopePublished($query)
    {
        return $query->where('status', 'published')->whereNotNull('published_at');
    }

    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    public function scopeInMenu($query)
    {
        return $query->where('show_in_menu', true);
    }

    // ─── Accessors ─────────────────────────────────────────────────────────

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

        return asset('storage/' . ltrim($path, '/'));
    }

    /**
     * Expose a `seo_meta` object for the frontend (assembled from flat columns).
     */
    public function getSeoMetaAttribute(): array
    {
        return [
            'meta_title'       => $this->meta_title,
            'meta_description' => $this->meta_description,
            'meta_keywords'    => $this->meta_keywords,
            'og_image'         => $this->og_image,
            'canonical_url'    => $this->canonical_url,
        ];
    }

    public function isPublished(): bool
    {
        return $this->status === 'published' && $this->published_at !== null;
    }

    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    public function getUrlAttribute(): string
    {
        return route('public.page.show', $this->slug);
    }

    // ─── Helpers ───────────────────────────────────────────────────────────

    public static function generateUniqueSlug(string $base): string
    {
        $slug     = $base ?: 'page';
        $original = $slug;
        $counter  = 1;

        while (static::withTrashed()->where('slug', $slug)->exists()) {
            $slug = "{$original}-{$counter}";
            $counter++;
        }

        return $slug;
    }
}
