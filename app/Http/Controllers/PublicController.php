<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\Category;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
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
            ->when($request->get('author'), fn ($q, $authorId) => $q->where('user_id', (int) $authorId))
            ->when($request->get('from_date'), fn ($q, $fromDate) => $q->whereDate('published_at', '>=', $fromDate))
            ->when($request->get('to_date'), fn ($q, $toDate) => $q->whereDate('published_at', '<=', $toDate))
            ->when($request->get('sort') === 'popular', fn ($q) => $q->orderByDesc('views'))
            ->when($request->get('sort') === 'latest' || !$request->get('sort'), fn ($q) => $q->orderByDesc('published_at'))
            ->when($request->get('sort') === 'oldest', fn ($q) => $q->orderBy('published_at'))
            ->when($request->get('sort') === 'title', fn ($q) => $q->orderBy('title'))
            ->paginate((int) $request->integer('per_page', 12))
            ->withQueryString()
            ->through(fn (Article $a) => $this->articleCardData($a));

        return Inertia::render('public/NewsIndex', [
            'articles'      => $articles,
            'filters'       => $request->only(['q', 'category', 'tag', 'author', 'from_date', 'to_date', 'sort', 'per_page']),
            'categories'    => Category::active()->whereNull('parent_id')->orderBy('order')->get(['id', 'name', 'slug', 'color']),
            'tags'          => Tag::orderBy('name')->limit(30)->get(['id', 'name', 'slug']),
            'authors'       => User::query()
                ->whereHas('roles', fn ($q) => $q->where('name', 'reporter'))
                ->whereHas('articles', fn ($q) => $q->where('status', 'published'))
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn (User $user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'slug' => $this->authorSlug($user),
                ]),
            'navCategories' => $this->navCategories(),
        ]);
    }

    // ─── Home Page ───────────────────────────────────────────────────────────

    public function home(): Response
    {
        $featured = Article::published()
            ->with(['author:id,name', 'categories:id,name,color,slug'])
            ->limit(6)
            ->get()
            ->map(fn (Article $a) => $this->articleCardData($a));

        $latest = Article::published()
            ->with(['author:id,name', 'categories:id,name,color,slug'])
            ->latest('published_at')
            ->limit(10)
            ->get()
            ->map(fn (Article $a) => $this->articleCardData($a));

        $trending = Article::published()
            ->with(['author:id,name', 'categories:id,name,color,slug'])
            ->orderByDesc('views')
            ->limit(10)
            ->get()
            ->map(fn (Article $a) => $this->articleCardData($a));

        $editorPicks = Article::published()
            ->with(['author:id,name', 'categories:id,name,color,slug'])
            ->inRandomOrder()
            ->limit(4)
            ->get()
            ->map(fn (Article $a) => $this->articleCardData($a));

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
                    ->get()
                    ->map(fn (Article $a) => $this->articleCardData($a));

                return array_merge($cat->toArray(), ['articles' => $articles]);
            })
            ->filter(fn ($group) => count($group['articles']) > 0)
            ->values();

        return Inertia::render('public/Home', [
            'featured'       => $featured,
            'latest'         => $latest,
            'trending'       => $trending,
            'editorPicks'    => $editorPicks,
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

        $trendingSidebar = Article::published()
            ->with(['author:id,name', 'categories:id,name,color,slug'])
            ->orderByDesc('views')
            ->where('id', '!=', $article->id)
            ->limit(6)
            ->get();

        return Inertia::render('public/ArticleShow', [
            'article'       => $this->articleCardData($article),
            'related'       => $related->map(fn (Article $a) => $this->articleCardData($a)),
            'trending'      => $trendingSidebar->map(fn (Article $a) => $this->articleCardData($a)),
            'navCategories' => $this->navCategories(),
        ]);
    }

    // ─── Category Page ────────────────────────────────────────────────────────

    public function category(Request $request, Category $category): Response
    {
        abort_unless($category->is_active, 404);

        $articles = Article::published()
            ->with(['author:id,name', 'categories:id,name,color,slug'])
            ->whereHas('categories', fn ($q) => $q->where('categories.id', $category->id))
            ->when($request->get('tag'), fn ($q, $slug) => $q->whereHas('tags', fn ($tq) => $tq->where('slug', $slug)))
            ->when($request->get('sort') === 'popular', fn ($q) => $q->orderByDesc('views'))
            ->when($request->get('sort') === 'latest' || !$request->get('sort'), fn ($q) => $q->orderByDesc('published_at'))
            ->when($request->get('sort') === 'oldest', fn ($q) => $q->orderBy('published_at'))
            ->paginate(12)
            ->withQueryString()
            ->through(fn (Article $a) => $this->articleCardData($a));

        $category->load(['parent:id,name,slug', 'children' => fn ($q) => $q->where('is_active', true)->orderBy('order')]);

        return Inertia::render('public/Category', [
            'category'      => $category,
            'articles'      => $articles,
            'filters'       => $request->only(['sort', 'tag']),
            'tags'          => Tag::query()
                ->whereHas('articles', fn ($q) => $q->whereHas('categories', fn ($cq) => $cq->where('categories.id', $category->id)))
                ->orderBy('name')
                ->limit(30)
                ->get(['id', 'name', 'slug']),
            'navCategories' => $this->navCategories(),
        ]);
    }

    // ─── Tag Page ──────────────────────────────────────────────────────────────

    public function tag(Request $request, Tag $tag): Response
    {
        $articles = Article::published()
            ->with(['author:id,name', 'categories:id,name,color,slug', 'tags:id,name,slug'])
            ->whereHas('tags', fn ($q) => $q->where('tags.id', $tag->id))
            ->when($request->get('sort') === 'popular', fn ($q) => $q->orderByDesc('views'))
            ->when($request->get('sort') === 'latest' || !$request->get('sort'), fn ($q) => $q->orderByDesc('published_at'))
            ->when($request->get('sort') === 'oldest', fn ($q) => $q->orderBy('published_at'))
            ->paginate(12)
            ->withQueryString()
            ->through(fn (Article $a) => $this->articleCardData($a));

        return Inertia::render('public/Tag', [
            'tag'           => $tag,
            'articles'      => $articles,
            'filters'       => $request->only(['sort']),
            'navCategories' => $this->navCategories(),
        ]);
    }

    // ─── Author Page ───────────────────────────────────────────────────────────

    public function author(Request $request, string $authorSlug): Response
    {
        $author = $this->resolveAuthorBySlug($authorSlug);

        abort_unless($author !== null, 404);

        $articles = Article::published()
            ->with(['author:id,name', 'categories:id,name,color,slug', 'tags:id,name,slug'])
            ->where('user_id', $author->id)
            ->when($request->get('sort') === 'popular', fn ($q) => $q->orderByDesc('views'))
            ->when($request->get('sort') === 'latest' || !$request->get('sort'), fn ($q) => $q->orderByDesc('published_at'))
            ->when($request->get('sort') === 'oldest', fn ($q) => $q->orderBy('published_at'))
            ->paginate(12)
            ->withQueryString()
            ->through(fn (Article $a) => $this->articleCardData($a));

        return Inertia::render('public/Author', [
            'author' => [
                'id' => $author->id,
                'name' => $author->name,
                'slug' => $this->authorSlug($author),
                'bio' => 'Staff journalist covering breaking stories and in-depth reporting.',
            ],
            'articles' => $articles,
            'filters' => $request->only(['sort']),
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
                ->when($request->get('category'), fn ($query, $slug) => $query->whereHas('categories', fn ($catQuery) => $catQuery->where('slug', $slug)))
                ->when($request->get('sort') === 'popular', fn ($query) => $query->orderByDesc('views'))
                ->when($request->get('sort') === 'latest' || !$request->get('sort'), fn ($query) => $query->orderByDesc('published_at'))
                ->when($request->get('sort') === 'oldest', fn ($query) => $query->orderBy('published_at'))
                ->paginate(12)
                ->withQueryString()
                ->through(fn (Article $a) => $this->articleCardData($a));
        }

        return Inertia::render('public/Search', [
            'results'       => $results,
            'query'         => $q,
            'filters'       => $request->only(['category', 'sort']),
            'categories'    => Category::active()->whereNull('parent_id')->orderBy('order')->get(['id', 'name', 'slug', 'color']),
            'navCategories' => $this->navCategories(),
        ]);
    }

    // ─── Static Pages ──────────────────────────────────────────────────────────

    public function staticPage(string $slug): Response
    {
        $pages = [
            'about-us' => [
                'title' => 'About Us',
                'description' => 'NewsPortal delivers timely, factual, and independent journalism across politics, tech, business, sports, and world affairs.',
                'content' => [
                    'We are a digital-first newsroom focused on clarity, speed, and trust.',
                    'Our editorial workflow is designed to verify sources before publishing.',
                    'We cover stories that matter with context, not just headlines.',
                ],
            ],
            'contact-us' => [
                'title' => 'Contact Us',
                'description' => 'Reach our editorial desk, advertising team, or technical support.',
                'content' => [
                    'Editorial: editor@newsportal.com',
                    'Advertising: ads@newsportal.com',
                    'General Inquiries: support@newsportal.com',
                ],
            ],
            'privacy-policy' => [
                'title' => 'Privacy Policy',
                'description' => 'How we collect, process, and protect your data while using NewsPortal.',
                'content' => [
                    'We collect minimal analytics and account data required to operate the service.',
                    'We do not sell personal data to third parties.',
                    'You can request account data export or deletion at any time.',
                ],
            ],
            'terms-and-conditions' => [
                'title' => 'Terms & Conditions',
                'description' => 'Rules for using the NewsPortal website, content, and services.',
                'content' => [
                    'Content is provided for informational purposes.',
                    'Unauthorized scraping and republication are prohibited.',
                    'Use of the platform implies acceptance of these terms.',
                ],
            ],
        ];

        abort_unless(isset($pages[$slug]), 404);

        return Inertia::render('public/StaticPage', [
            'page' => array_merge(['slug' => $slug], $pages[$slug]),
            'navCategories' => $this->navCategories(),
        ]);
    }

    // ─── Helper ───────────────────────────────────────────────────────────────

    private function navCategories(): array
    {
        $categories = Category::active()
            ->whereNull('parent_id')
            ->with('activeChildren')
            ->orderBy('order')
            ->get(['id', 'name', 'slug', 'color', 'icon']);

        return $this->mapCategoryChildren($categories);
    }

    /**
     * Recursively map 'activeChildren' → 'children' for frontend consumption.
     */
    private function mapCategoryChildren(\Illuminate\Support\Collection $categories): array
    {
        return $categories->map(function (Category $cat) {
            $data = [
                'id'    => $cat->id,
                'name'  => $cat->name,
                'slug'  => $cat->slug,
                'color' => $cat->color,
                'icon'  => $cat->icon,
            ];

            $children = $cat->relationLoaded('activeChildren')
                ? $cat->activeChildren
                : collect();

            $data['children'] = $children->isNotEmpty()
                ? $this->mapCategoryChildren($children)
                : [];

            return $data;
        })->all();
    }

    private function articleCardData(Article $article): array
    {
        $articleData = $article->toArray();

        return array_merge($articleData, [
            'featured_image_url' => $article->featured_image_url,
            'author_slug' => $article->author ? $this->authorSlug($article->author) : null,
        ]);
    }

    private function authorSlug(User $user): string
    {
        return Str::slug($user->name) . '-' . $user->id;
    }

    private function resolveAuthorBySlug(string $slug): ?User
    {
        $id = null;

        if (preg_match('/-(\d+)$/', $slug, $matches) === 1) {
            $id = (int) $matches[1];
        }

        if ($id !== null) {
            return User::find($id);
        }

        return User::query()
            ->whereRaw('LOWER(name) LIKE ?', [str_replace('-', ' ', Str::lower($slug))])
            ->first();
    }
}
