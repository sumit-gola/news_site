<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

/**
 * Category Model — hierarchical news categories with many-to-many article relationship.
 *
 * Features:
 * - Parent-child hierarchy (main categories and subcategories)
 * - Many-to-many with articles
 * - SEO metadata support
 * - Featured images and custom styling (color, icon)
 * - Active/inactive status
 * - Slug auto-generation
 */
class Category extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'parent_id',
        'name',
        'slug',
        'description',
        'featured_image',
        'color',
        'icon',
        'meta_title',
        'meta_description',
        'meta_keywords',
        'og_image',
        'order',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'order'     => 'integer',
    ];

    // ─── Relationships ──────────────────────────────────────────────────────────

    /**
     * Parent category (if this is a subcategory).
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    /**
     * Child categories (subcategories).
     */
    public function children(): HasMany
    {
        return $this->hasMany(Category::class, 'parent_id')->orderBy('order');
    }

    /**
     * Active children with recursive eager-loading for nav menus.
     */
    public function activeChildren(): HasMany
    {
        return $this->hasMany(Category::class, 'parent_id')
            ->where('is_active', true)
            ->with('activeChildren')
            ->orderBy('order');
    }

    /**
     * All articles in this category.
     */
    public function articles(): BelongsToMany
    {
        return $this->belongsToMany(Article::class, 'article_category')
            ->withTimestamps()
            ->orderBy('articles.published_at', 'desc');
    }

    // ─── Scopes ─────────────────────────────────────────────────────────────────

    /**
     * Only active categories.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Only main categories (no parent).
     */
    public function scopeMain($query)
    {
        return $query->whereNull('parent_id');
    }

    /**
     * Get categories with their children eager loaded.
     */
    public function scopeWithChildren($query)
    {
        return $query->with('children');
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────

    /**
     * Get all ancestor categories (parents, grandparents, etc).
     */
    public function ancestors(): Collection
    {
        $ancestors = new Collection();
        $parent = $this->parent;

        while ($parent) {
            $ancestors->push($parent);
            $parent = $parent->parent;
        }

        return $ancestors->reverse();
    }

    /**
     * Get all descendant categories (children, grandchildren, etc).
     */
    public function descendants(): Collection
    {
        $descendants = new Collection();

        foreach ($this->children as $child) {
            $descendants->push($child);
            $descendants = $descendants->merge($child->descendants());
        }

        return $descendants;
    }

    /**
     * Get breadcrumb path (ancestors + self).
     */
    public function breadcrumbs(): Collection
    {
        return $this->ancestors()->push($this);
    }

    /**
     * Check if this category has children.
     */
    public function hasChildren(): bool
    {
        return $this->children()->exists();
    }

    /**
     * Check if this is a main category (no parent).
     */
    public function isMain(): bool
    {
        return $this->parent_id === null;
    }

    /**
     * Get effective meta title (with fallback).
     */
    public function getEffectiveMetaTitleAttribute(): string
    {
        return $this->meta_title ?? $this->name;
    }

    /**
     * Get effective meta description (with fallback).
     */
    public function getEffectiveMetaDescriptionAttribute(): string
    {
        return $this->meta_description ?? Str::limit($this->description, 160);
    }

    /**
     * Get articles count (published only).
     */
    public function getArticlesCountAttribute(): int
    {
        return $this->articles()->where('status', 'published')->count();
    }

    // ─── Accessors & Mutators ──────────────────────────────────────────────────

    /**
     * Get the route key name for slug-based routing.
     */
    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    // ─── Boot Methods ──────────────────────────────────────────────────────────

    /**
     * Auto-generate slug from name on creation.
     */
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (self $category) {
            if (!$category->slug) {
                $category->slug = static::generateUniqueSlug($category->name);
            }
        });

        static::updating(function (self $category) {
            if ($category->isDirty('name') && !$category->isDirty('slug')) {
                $category->slug = static::generateUniqueSlug($category->name, $category->id);
            }
        });
    }

    /**
     * Generate unique slug for category.
     */
    private static function generateUniqueSlug(string $name, ?int $exceptId = null): string
    {
        $slug = Str::slug($name);
        $originalSlug = $slug;
        $count = 1;

        while (true) {
            $query = static::where('slug', $slug);

            if ($exceptId) {
                $query->where('id', '!=', $exceptId);
            }

            if (! $query->exists()) {
                break;
            }

            $slug = "{$originalSlug}-{$count}";
            $count++;
        }

        return $slug;
    }
}
