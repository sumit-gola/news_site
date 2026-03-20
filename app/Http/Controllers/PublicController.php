<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\Category;
use App\Models\Tag;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PublicController extends Controller
{
    // ─── News Listing ────────────────────────────────────────────────────────

    public function news(Request $request): Response
    {
        $query = Article::published()
            ->with(['author:id,name', 'categories:id,name,color,slug', 'tags:id,name,slug']);

        $articles = $query
            ->when($request->get('q'), function ($q, $search) {
                $q->where(function ($inner) use ($search) {
                    $inner->where('title', 'like', "%{$search}%")
                        ->orWhere('excerpt', 'like', "%{$search}%")
                        ->orWhereHas('tags', fn ($tagQuery) => $tagQuery->where('tags.name', 'like', "%{$search}%"));
                });
            })
            ->when($request->get('category'), fn ($q, $slug) => $q->whereHas('categories', fn ($catQuery) => $catQuery->where('slug', $slug)))
            ->when($request->get('tag'), fn ($q, $slug) => $q->whereHas('tags', fn ($tagQuery) => $tagQuery->where('slug', $slug)))
            ->paginate(12)
            ->withQueryString()
            ->through(fn ($a) => array_merge($a->toArray(), [
                'featured_image_url' => $a->featured_image ? asset('storage/' . $a->featured_image) : null,
            ]));

        return Inertia::render('public/NewsIndex', [
            'articles'      => $articles,
            'filters'       => $request->only(['q', 'category', 'tag']),
            'categories'    => Category::active()->whereNull('parent_id')->orderBy('order')->get(['id', 'name', 'slug', 'color']),
            'tags'          => Tag::orderBy('name')->limit(30)->get(['id', 'name', 'slug']),
            'navCategories' => $this->navCategories(),
        ]);
    }

    // ─── Home Page ───────────────────────────────────────────────────────────

    public function home(): Response
    {
        $featured = Article::published()
            ->with(['author:id,name', 'categories:id,name,color,slug'])
            ->limit(6)
            ->get();

        $trending = Article::published()
            ->with(['author:id,name', 'categories:id,name,color,slug'])
            ->orderByDesc('views')
            ->limit(10)
            ->get();

        // Per-category article groups (top 5 active main categories)
        $categoryGroups = Category::active()
            ->whereNull('parent_id')
            ->orderBy('order')
            ->limit(6)
            ->get(['id', 'name', 'slug', 'color', 'icon', 'description'])
            ->map(function (Category $cat) {
                $articles = Article::published()
                    ->with(['author:id,name', 'categories:id,name,color,slug'])
                    ->whereHas('categories', fn ($q) => $q->where('categories.id', $cat->id))
                    ->limit(4)
                    ->get();

                return array_merge($cat->toArray(), ['articles' => $articles]);
            })
            ->filter(fn ($group) => count($group['articles']) > 0)
            ->values();

        return Inertia::render('public/Home', [
            'featured'       => $featured,
            'trending'       => $trending,
            'categoryGroups' => $categoryGroups,
            'navCategories'  => $this->navCategories(),
        ]);
    }

    // ─── Article Detail ───────────────────────────────────────────────────────

    public function show(Article $article): Response
    {
        abort_unless($article->status === 'published', 404);

        $article->increment('views');
        $article->load(['author:id,name', 'categories:id,name,color,slug', 'tags:id,name,slug', 'meta']);

        $catIds  = $article->categories->pluck('id');
        $related = Article::published()
            ->with(['author:id,name', 'categories:id,name,color,slug'])
            ->whereHas('categories', fn ($q) => $q->whereIn('categories.id', $catIds))
            ->where('id', '!=', $article->id)
            ->limit(4)
            ->get();

        return Inertia::render('public/ArticleShow', [
            'article'       => array_merge($article->toArray(), [
                'featured_image_url' => $article->featured_image
                    ? asset('storage/' . $article->featured_image)
                    : null,
            ]),
            'related'       => $related->map(fn ($a) => array_merge($a->toArray(), [
                'featured_image_url' => $a->featured_image ? asset('storage/' . $a->featured_image) : null,
            ])),
            'navCategories' => $this->navCategories(),
        ]);
    }

    // ─── Category Page ────────────────────────────────────────────────────────

    public function category(Category $category): Response
    {
        abort_unless($category->is_active, 404);

        $articles = Article::published()
            ->with(['author:id,name', 'categories:id,name,color,slug'])
            ->whereHas('categories', fn ($q) => $q->where('categories.id', $category->id))
            ->paginate(12)
            ->withQueryString()
            ->through(fn ($a) => array_merge($a->toArray(), [
                'featured_image_url' => $a->featured_image ? asset('storage/' . $a->featured_image) : null,
            ]));

        $category->load(['parent:id,name,slug', 'children' => fn ($q) => $q->where('is_active', true)->orderBy('order')]);

        return Inertia::render('public/Category', [
            'category'      => $category,
            'articles'      => $articles,
            'navCategories' => $this->navCategories(),
        ]);
    }

    // ─── Search ───────────────────────────────────────────────────────────────

    public function search(Request $request): Response
    {
        $q       = trim($request->get('q', ''));
        $results = null;

        if ($q !== '') {
            $results = Article::published()
                ->with(['author:id,name', 'categories:id,name,color,slug'])
                ->where(function ($query) use ($q) {
                    $query->where('title',   'like', "%{$q}%")
                        ->orWhere('excerpt', 'like', "%{$q}%")
                        ->orWhereHas('tags', fn ($tq) => $tq->where('tags.name', 'like', "%{$q}%"));
                })
                ->paginate(12)
                ->withQueryString()
                ->through(fn ($a) => array_merge($a->toArray(), [
                    'featured_image_url' => $a->featured_image ? asset('storage/' . $a->featured_image) : null,
                ]));
        }

        return Inertia::render('public/Search', [
            'results'       => $results,
            'query'         => $q,
            'navCategories' => $this->navCategories(),
        ]);
    }

    // ─── Helper ───────────────────────────────────────────────────────────────

    private function navCategories(): \Illuminate\Support\Collection
    {
        return Category::active()
            ->whereNull('parent_id')
            ->orderBy('order')
            ->get(['id', 'name', 'slug', 'color']);
    }
}
