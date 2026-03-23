<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Article;
use App\Models\ArticleMeta;
use App\Models\Category;
use App\Models\Tag;
use App\Models\User;
use App\Services\HtmlSanitizer;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ArticleController extends Controller
{
    /**
     * Display a listing of articles (filtered by role and status).
     */
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Article::class);

        /** @var User $user */
        $user = $request->user();
        $query = Article::query();

        // Role-based filtering
        if ($user->isReporter()) {
            // Reporters see only their own articles
            $query->where('user_id', $user->id);
        } elseif ($user->isManager()) {
            // Managers see articles pending approval and published
            $query->whereIn('status', ['pending', 'published', 'rejected']);
        }
        // Admins see all articles (no filter)

        $query
            ->when($request->search, function ($builder) use ($request) {
                $search = trim((string) $request->search);

                $builder->where(function ($searchQuery) use ($search) {
                    $searchQuery
                        ->where('title', 'like', "%{$search}%")
                        ->orWhere('excerpt', 'like', "%{$search}%");
                });
            })
            ->when($request->author_id, fn ($builder) => $builder->where('user_id', $request->author_id))
            ->when($request->category_id, fn ($builder) => $builder->whereHas('categories', fn ($categoryQuery) => $categoryQuery->where('categories.id', $request->category_id)))
            ->when($request->tag_id, fn ($builder) => $builder->whereHas('tags', fn ($tagQuery) => $tagQuery->where('tags.id', $request->tag_id)));

        $summaryBaseQuery = clone $query;

        $summary = [
            'total'     => (clone $summaryBaseQuery)->count(),
            'draft'     => (clone $summaryBaseQuery)->where('status', 'draft')->count(),
            'pending'   => (clone $summaryBaseQuery)->where('status', 'pending')->count(),
            'published' => (clone $summaryBaseQuery)->where('status', 'published')->count(),
            'rejected'  => (clone $summaryBaseQuery)->where('status', 'rejected')->count(),
        ];

        $articles = $query
            ->with(['author', 'meta', 'categories', 'tags'])
            ->when($request->status, fn ($builder) => $builder->where('status', $request->status))
            ->latest('updated_at')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Article $article) => $this->serializeArticleForManagement($article, $user));

        return Inertia::render('articles/Index', [
            'articles'   => $articles,
            'filters'    => $request->only(['search', 'status', 'author_id', 'category_id', 'tag_id']),
            'statuses'   => ['draft', 'pending', 'published', 'rejected'],
            'summary'    => $summary,
            'authors'    => User::role('reporter')->orderBy('name')->get(['id', 'name']),
            'categories' => Category::active()->with('children')->orderBy('order')->get(),
            'tags'       => Tag::orderBy('name')->get(['id', 'name', 'slug']),
        ]);
    }

    /**
     * Display admin article management table (all articles + filters).
     */
    public function adminIndex(Request $request): Response
    {
        $this->authorize('viewAny', Article::class);

        /** @var User $user */
        $user = $request->user();

        abort_unless($user->isAdmin(), 403);

        $query = Article::query()
            ->when($request->search, function ($builder) use ($request) {
                $search = trim((string) $request->search);

                $builder->where(function ($searchQuery) use ($search) {
                    $searchQuery
                        ->where('title', 'like', "%{$search}%")
                        ->orWhere('excerpt', 'like', "%{$search}%");
                });
            })
            ->when($request->author_id, fn ($builder) => $builder->where('user_id', $request->author_id))
            ->when($request->category_id, fn ($builder) => $builder->whereHas('categories', fn ($categoryQuery) => $categoryQuery->where('categories.id', $request->category_id)))
            ->when($request->tag_id, fn ($builder) => $builder->whereHas('tags', fn ($tagQuery) => $tagQuery->where('tags.id', $request->tag_id)))
            ->when($request->from_date, fn ($builder) => $builder->whereDate('updated_at', '>=', $request->from_date))
            ->when($request->to_date, fn ($builder) => $builder->whereDate('updated_at', '<=', $request->to_date));

        $summary = [
            'total'     => (clone $query)->count(),
            'draft'     => (clone $query)->where('status', 'draft')->count(),
            'pending'   => (clone $query)->where('status', 'pending')->count(),
            'published' => (clone $query)->where('status', 'published')->count(),
            'rejected'  => (clone $query)->where('status', 'rejected')->count(),
        ];

        $articles = $query
            ->with(['author', 'meta', 'categories', 'tags'])
            ->when($request->status, fn ($builder) => $builder->where('status', $request->status))
            ->latest('updated_at')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (Article $article) => $this->serializeArticleForManagement($article, $user));

        return Inertia::render('admin/articles/index', [
            'articles'   => $articles,
            'filters'    => $request->only(['search', 'status', 'author_id', 'category_id', 'tag_id', 'from_date', 'to_date']),
            'statuses'   => ['draft', 'pending', 'published', 'rejected'],
            'summary'    => $summary,
            'authors'    => User::orderBy('name')->get(['id', 'name']),
            'categories' => Category::active()->orderBy('order')->get(['id', 'name']),
            'tags'       => Tag::orderBy('name')->get(['id', 'name', 'slug']),
        ]);
    }

    /**
     * Show the form for creating a new article.
     */
    public function create(): Response
    {
        $this->authorize('create', Article::class);

        return Inertia::render('articles/Create', [
            'article'    => null,
            'authors'    => User::role('reporter')->get(['id', 'name', 'email']),
            'categories' => Category::active()->with('children')->orderBy('order')->get(),
            'tags'       => Tag::orderBy('name')->get(['id', 'name', 'slug']),
        ]);
    }

    /**
     * Store a newly created article in storage.
     */
    public function store(Request $request)
    {
        $this->authorize('create', Article::class);

        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'title'              => ['required', 'string', 'max:255'],
            'slug'               => ['nullable', 'string', 'max:255', Rule::unique('articles', 'slug')],
            'excerpt'            => ['required', 'string', 'max:500'],
            'content'            => ['required', 'string'],
            'featured_image'     => ['nullable', 'string'],
            'meta_title'         => ['nullable', 'string', 'max:60'],
            'meta_description'   => ['nullable', 'string', 'max:160'],
            'meta_keywords'      => ['nullable', 'string'],
            'og_image'           => ['nullable', 'string'],
            'canonical_url'      => ['nullable', 'url'],
            'published_at'       => ['nullable', 'date'],
            'category_ids'       => ['nullable', 'array'],
            'category_ids.*'     => ['integer', 'exists:categories,id'],
            'tag_names'          => ['nullable', 'array'],
            'tag_names.*'        => ['string', 'max:50'],
        ]);

        // Create the article
        $article = Article::create([
            'user_id'        => $user->id,
            ...$this->buildArticlePayload($validated),
            'status'         => 'draft',
        ]);

        // Create metadata
        ArticleMeta::create(array_merge(
            ['article_id' => $article->id],
            $this->buildMetaPayload($validated),
        ));

        // Attach categories if provided
        if (!empty($validated['category_ids'])) {
            $article->categories()->attach($validated['category_ids']);
        }

        // Attach tags if provided
        $this->syncTags($article, $validated['tag_names'] ?? null);

        ActivityLog::record('created', 'created', $article);

        return redirect()->route('articles.edit', $article)->with('success', 'Article created successfully. Edit and submit for review.');
    }

    /**
     * Display the specified article.
     */
    public function show(Article $article): Response
    {
        $this->authorize('view', $article);

        // Increment view count for published articles
        if ($article->isPublished()) {
            $article->increment('views');
        }

        return Inertia::render('articles/Show', [
            'article' => $article->load(['author', 'meta', 'categories', 'tags', 'approvedBy']),
        ]);
    }

    /**
     * Show the form for editing the specified article.
     */
    public function edit(Article $article): Response
    {
        $this->authorize('update', $article);

        return Inertia::render('articles/Edit', [
            'article'    => $article->load(['meta', 'categories', 'tags']),
            'authors'    => User::role('reporter')->get(['id', 'name', 'email']),
            'categories' => Category::active()->with('children')->orderBy('order')->get(),
            'tags'       => Tag::orderBy('name')->get(['id', 'name', 'slug']),
        ]);
    }

    /**
     * Update the specified article in storage.
     */
    public function update(Request $request, Article $article)
    {
        $this->authorize('update', $article);

        $validated = $request->validate([
            'title'              => ['required', 'string', 'max:255'],
            'slug'               => ['nullable', 'string', 'max:255', Rule::unique('articles', 'slug')->ignore($article->id)],
            'excerpt'            => ['required', 'string', 'max:500'],
            'content'            => ['required', 'string'],
            'featured_image'     => ['nullable', 'string'],
            'meta_title'         => ['nullable', 'string', 'max:60'],
            'meta_description'   => ['nullable', 'string', 'max:160'],
            'meta_keywords'      => ['nullable', 'string'],
            'og_image'           => ['nullable', 'string'],
            'canonical_url'      => ['nullable', 'url'],
            'published_at'       => ['nullable', 'date'],
            'category_ids'       => ['nullable', 'array'],
            'category_ids.*'     => ['integer', 'exists:categories,id'],
            'tag_names'          => ['nullable', 'array'],
            'tag_names.*'        => ['string', 'max:50'],
        ]);

        // Update article
        $article->update($this->buildArticlePayload($validated, $article));

        // Update metadata
        $article->meta()->updateOrCreate([], $this->buildMetaPayload($validated));

        // Sync categories
        if (isset($validated['category_ids'])) {
            $article->categories()->sync($validated['category_ids']);
        }

        // Sync tags
        $this->syncTags($article, $validated['tag_names'] ?? null);

        ActivityLog::record('updated', 'updated', $article);

        return back()->with('success', 'Article updated successfully.');
    }

    /**
     * Delete the specified article (soft delete).
     */
    public function destroy(Article $article)
    {
        $this->authorize('delete', $article);

        ActivityLog::record('deleted', 'deleted', $article);

        $article->delete();

        return back()->with('success', 'Article deleted successfully.');
    }

    /**
     * Submit article for approval (Reporter → Pending).
     */
    public function submit(Article $article)
    {
        $this->authorize('submitForApproval', $article);

        if (!$article->isDraft()) {
            return back()->with('error', 'Only draft articles can be submitted.');
        }

        if (!$article->categories()->exists()) {
            return back()->with('error', 'Add at least one category before submitting for review.');
        }

        $article->update(['status' => 'pending']);

        ActivityLog::record('submitted for review', 'submitted for review', $article);

        return back()->with('success', 'Article submitted for review.');
    }

    /**
     * Approve an article (Manager/Admin → Published).
     */
    public function approve(Request $request, Article $article)
    {
        $this->authorize('approve', $article);

        /** @var User $user */
        $user = $request->user();

        if (!$article->isPending()) {
            return back()->with('error', 'Only pending articles can be approved.');
        }

        $article->update([
            'status'       => 'published',
            'approved_by'  => $user->id,
            'published_at' => now(),
        ]);

        ActivityLog::record('approved', 'approved', $article);

        return back()->with('success', 'Article approved and published successfully.');
    }

    /**
     * Reject an article (Manager/Admin).
     */
    public function reject(Article $article)
    {
        $this->authorize('reject', $article);

        if (!$article->isPending()) {
            return back()->with('error', 'Only pending articles can be rejected.');
        }

        $article->update(['status' => 'rejected']);

        ActivityLog::record('rejected', 'rejected', $article);

        return back()->with('success', 'Article rejected.');
    }

    /**
     * Publish a draft or rejected article (Admin only).
     */
    public function publish(Request $request, Article $article)
    {
        $this->authorize('publish', $article);

        /** @var User $user */
        $user = $request->user();

        if ($article->isPublished()) {
            return back()->with('error', 'Article is already published.');
        }

        $article->update([
            'status'       => 'published',
            'approved_by'  => $user->id,
            'published_at' => now(),
        ]);

        ActivityLog::record('published', 'published', $article);

        return back()->with('success', 'Article published successfully.');
    }

    /**
     * Build the persisted article payload from validated form input.
     */
    private function buildArticlePayload(array $validated, ?Article $article = null): array
    {
        return [
            'title'          => trim($validated['title']),
            'slug'           => $this->resolveSlug($validated, $article),
            'excerpt'        => trim($validated['excerpt']),
            'content'        => HtmlSanitizer::clean($validated['content']),
            'featured_image' => $this->normalizeOptionalValue($validated['featured_image'] ?? null),
            'published_at'   => $validated['published_at'] ?? null,
        ];
    }

    /**
     * Build the persisted metadata payload from validated form input.
     */
    private function buildMetaPayload(array $validated): array
    {
        return [
            'meta_title'       => $this->normalizeOptionalValue($validated['meta_title'] ?? $validated['title']),
            'meta_description' => $this->normalizeOptionalValue($validated['meta_description'] ?? $validated['excerpt']),
            'meta_keywords'    => $this->normalizeOptionalValue($validated['meta_keywords'] ?? null),
            'og_image'         => $this->normalizeOptionalValue($validated['og_image'] ?? ($validated['featured_image'] ?? null)),
            'canonical_url'    => $this->normalizeOptionalValue($validated['canonical_url'] ?? null),
        ];
    }

    /**
     * Resolve the canonical slug for create and update flows.
     */
    private function resolveSlug(array $validated, ?Article $article = null): string
    {
        if (!empty($validated['slug'])) {
            return $this->generateUniqueSlug($validated['slug'], $article?->id);
        }

        if ($article !== null && $article->title === $validated['title'] && !empty($article->slug)) {
            return $article->slug;
        }

        return $this->generateUniqueSlug($validated['title'], $article?->id);
    }

    /**
     * Generate a unique slug for the article.
     */
    private function generateUniqueSlug(string $title, ?int $ignoreId = null): string
    {
        $slug = Str::slug($title);
        $originalSlug = $slug;
        $count = 1;

        while (Article::where('slug', $slug)
            ->when($ignoreId !== null, fn ($query) => $query->whereKeyNot($ignoreId))
            ->exists()) {
            $slug = "{$originalSlug}-{$count}";
            $count++;
        }

        return $slug;
    }

    /**
     * Normalize optional string values before persistence.
     */
    private function normalizeOptionalValue(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $normalized = trim($value);

        return $normalized === '' ? null : $normalized;
    }

    /**
     * Serialize a managed article row with explicit UI permissions.
     */
    private function serializeArticleForManagement(Article $article, User $user): array
    {
        return array_merge($article->toArray(), [
            'permissions' => [
                'view'    => $user->can('view', $article),
                'update'  => $user->can('update', $article),
                'delete'  => $user->can('delete', $article),
                'submit'  => $user->can('submitForApproval', $article),
                'approve' => $user->can('approve', $article),
                'reject'  => $user->can('reject', $article),
                'publish' => $user->can('publish', $article),
            ],
        ]);
    }

    /**
     * Sync article tags, creating tags that do not exist yet.
     */
    private function syncTags(Article $article, ?array $tagNames): void
    {
        if (empty($tagNames)) {
            $article->tags()->sync([]);
            return;
        }

        $tagIds = collect($tagNames)
            ->filter(fn ($name) => is_string($name) && trim($name) !== '')
            ->map(fn ($name) => trim($name))
            ->unique()
            ->map(function (string $name) {
                $tag = Tag::firstOrCreate(
                    ['slug' => Str::slug($name)],
                    ['name' => $name],
                );

                if ($tag->name !== $name) {
                    $tag->update(['name' => $name]);
                }

                return $tag->id;
            })
            ->values()
            ->all();

        $article->tags()->sync($tagIds);
    }
}
