<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Article;
use App\Models\ArticleMeta;
use App\Models\Category;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ArticleController extends Controller
{
    /**
     * Display a listing of articles (filtered by role and status).
     */
    public function index(Request $request): Response
    {
        $user = auth()->user();
        $query = Article::with(['author', 'meta', 'media', 'categories']);

        // Role-based filtering
        if ($user->isReporter()) {
            // Reporters see only their own articles
            $query->where('user_id', $user->id);
        } elseif ($user->isManager()) {
            // Managers see articles pending approval and published
            $query->whereIn('status', ['pending', 'published', 'rejected']);
        }
        // Admins see all articles (no filter)

        // Apply search and status filters
        $articles = $query
            ->when($request->search, fn ($q) => $q->where('title', 'like', "%{$request->search}%")
                ->orWhere('excerpt', 'like', "%{$request->search}%"))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->author_id, fn ($q) => $q->where('user_id', $request->author_id))
            ->latest('updated_at')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('articles/Index', [
            'articles'   => $articles,
            'filters'    => $request->only(['search', 'status', 'author_id']),
            'statuses'   => ['draft', 'pending', 'published', 'rejected'],
            'categories' => Category::active()->with('children')->orderBy('order')->get(),
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
        ]);
    }

    /**
     * Store a newly created article in storage.
     */
    public function store(Request $request)
    {
        $this->authorize('create', Article::class);

        $validated = $request->validate([
            'title'              => ['required', 'string', 'max:255'],
            'excerpt'            => ['required', 'string', 'max:500'],
            'content'            => ['required', 'string'],
            'featured_image'     => ['nullable', 'string'],
            'meta_title'         => ['nullable', 'string', 'max:60'],
            'meta_description'   => ['nullable', 'string', 'max:160'],
            'meta_keywords'      => ['nullable', 'string'],
            'og_image'           => ['nullable', 'string'],
            'canonical_url'      => ['nullable', 'url'],
            'category_ids'       => ['nullable', 'array'],
            'category_ids.*'     => ['integer', 'exists:categories,id'],
            'media_ids'          => ['nullable', 'array'],
            'media_ids.*'        => ['integer', 'exists:media,id'],
        ]);

        // Create the article
        $article = Article::create([
            'user_id'        => auth()->id(),
            'title'          => $validated['title'],
            'slug'           => $this->generateUniqueSlug($validated['title']),
            'excerpt'        => $validated['excerpt'],
            'content'        => $validated['content'],
            'featured_image' => $validated['featured_image'],
            'status'         => 'draft',
        ]);

        // Create metadata
        ArticleMeta::create([
            'article_id'      => $article->id,
            'meta_title'      => $validated['meta_title'] ?? $validated['title'],
            'meta_description'=> $validated['meta_description'] ?? $validated['excerpt'],
            'meta_keywords'   => $validated['meta_keywords'],
            'og_image'        => $validated['og_image'] ?? $validated['featured_image'],
            'canonical_url'   => $validated['canonical_url'],
        ]);

        // Attach categories if provided
        if (!empty($validated['category_ids'])) {
            $article->categories()->attach($validated['category_ids']);
        }

        // Attach media if provided
        if (!empty($validated['media_ids'])) {
            $article->media()->attach($validated['media_ids']);
        }

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
            'article' => $article->load(['author', 'meta', 'media', 'approvedBy']),
        ]);
    }

    /**
     * Show the form for editing the specified article.
     */
    public function edit(Article $article): Response
    {
        $this->authorize('update', $article);

        return Inertia::render('articles/Edit', [
            'article'    => $article->load(['meta', 'media', 'categories']),
            'authors'    => User::role('reporter')->get(['id', 'name', 'email']),
            'categories' => Category::active()->with('children')->orderBy('order')->get(),
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
            'excerpt'            => ['required', 'string', 'max:500'],
            'content'            => ['required', 'string'],
            'featured_image'     => ['nullable', 'string'],
            'meta_title'         => ['nullable', 'string', 'max:60'],
            'meta_description'   => ['nullable', 'string', 'max:160'],
            'meta_keywords'      => ['nullable', 'string'],
            'og_image'           => ['nullable', 'string'],
            'canonical_url'      => ['nullable', 'url'],
            'category_ids'       => ['nullable', 'array'],
            'category_ids.*'     => ['integer', 'exists:categories,id'],
            'media_ids'          => ['nullable', 'array'],
            'media_ids.*'        => ['integer', 'exists:media,id'],
        ]);

        // Update article
        $article->update([
            'title'          => $validated['title'],
            'excerpt'        => $validated['excerpt'],
            'content'        => $validated['content'],
            'featured_image' => $validated['featured_image'],
        ]);

        // Update metadata
        $article->meta()->updateOrCreate([], [
            'meta_title'      => $validated['meta_title'] ?? $validated['title'],
            'meta_description'=> $validated['meta_description'] ?? $validated['excerpt'],
            'meta_keywords'   => $validated['meta_keywords'],
            'og_image'        => $validated['og_image'] ?? $validated['featured_image'],
            'canonical_url'   => $validated['canonical_url'],
        ]);

        // Sync categories
        if (isset($validated['category_ids'])) {
            $article->categories()->sync($validated['category_ids']);
        }

        // Sync media
        if (isset($validated['media_ids'])) {
            $article->media()->sync($validated['media_ids']);
        }

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
        $this->authorize('update', $article);

        if (!$article->isDraft()) {
            return back()->with('error', 'Only draft articles can be submitted.');
        }

        $article->update(['status' => 'pending']);

        ActivityLog::record('submitted for review', 'submitted for review', $article);

        return back()->with('success', 'Article submitted for review.');
    }

    /**
     * Approve an article (Manager/Admin → Published).
     */
    public function approve(Article $article)
    {
        $this->authorize('approve', $article);

        if (!$article->isPending()) {
            return back()->with('error', 'Only pending articles can be approved.');
        }

        $article->update([
            'status'       => 'published',
            'approved_by'  => auth()->id(),
            'published_at' => now(),
        ]);

        ActivityLog::record('approved', 'approved', $article);

        return back()->with('success', 'Article approved and published successfully.');
    }

    /**
     * Reject an article (Manager/Admin).
     */
    public function reject(Request $request, Article $article)
    {
        $this->authorize('approve', $article);

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
    public function publish(Article $article)
    {
        $this->authorize('publish', $article);

        if ($article->isPublished()) {
            return back()->with('error', 'Article is already published.');
        }

        $article->update([
            'status'       => 'published',
            'approved_by'  => auth()->id(),
            'published_at' => now(),
        ]);

        ActivityLog::record('published', 'published', $article);

        return back()->with('success', 'Article published successfully.');
    }

    /**
     * Generate a unique slug for the article.
     */
    private function generateUniqueSlug(string $title): string
    {
        $slug = Str::slug($title);
        $originalSlug = $slug;
        $count = 1;

        while (Article::where('slug', $slug)->exists()) {
            $slug = "{$originalSlug}-{$count}";
            $count++;
        }

        return $slug;
    }
}
