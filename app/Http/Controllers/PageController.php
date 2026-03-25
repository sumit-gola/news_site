<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Category;
use App\Models\Page;
use App\Services\HtmlSanitizer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PageController extends Controller
{
    // ─── Index ─────────────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Page::class);

        $query = Page::with(['author:id,name', 'category:id,name,color'])
            ->when($request->search, function ($q) use ($request) {
                $s = trim((string) $request->search);
                $q->where(fn ($qq) => $qq->where('title', 'like', "%{$s}%")->orWhere('slug', 'like', "%{$s}%"));
            })
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->category_id, fn ($q) => $q->where('category_id', $request->category_id))
            ->when($request->template, fn ($q) => $q->where('template', $request->template));

        $summary = [
            'total'     => (clone $query)->count(),
            'published' => (clone $query)->where('status', 'published')->count(),
            'draft'     => (clone $query)->where('status', 'draft')->count(),
            'featured'  => (clone $query)->where('is_featured', true)->count(),
        ];

        $pages = $query->latest('updated_at')->paginate(20)->withQueryString();

        return Inertia::render('pages/Index', [
            'pages'      => $pages,
            'summary'    => $summary,
            'filters'    => $request->only(['search', 'status', 'category_id', 'template']),
            'categories' => Category::active()->orderBy('name')->get(['id', 'name', 'color']),
            'can_manage' => $request->user()->can('create', Page::class),
            'flash'      => ['success' => session('success'), 'error' => session('error')],
        ]);
    }

    // ─── Create ────────────────────────────────────────────────────────────

    public function create(): Response
    {
        $this->authorize('create', Page::class);

        return Inertia::render('pages/Create', [
            'categories' => Category::active()->orderBy('name')->get(['id', 'name', 'color', 'parent_id']),
        ]);
    }

    // ─── Store ─────────────────────────────────────────────────────────────

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Page::class);

        $validated = $this->validatePageRequest($request);

        $page = Page::create([
            'title'         => $validated['title'],
            'slug'          => Page::generateUniqueSlug($validated['slug'] ?? Str::slug($validated['title'])),
            'excerpt'       => $this->norm($validated['excerpt'] ?? null),
            'content'       => HtmlSanitizer::clean($validated['content'] ?? ''),
            'featured_image'=> $this->norm($validated['featured_image'] ?? null),
            'category_id'   => $validated['category_id'] ?? null,
            'user_id'       => $request->user()->id,
            'status'        => $validated['status'] ?? 'draft',
            'template'      => $validated['template'] ?? 'default',
            'published_at'  => $this->resolvePublishDate($validated),
            'show_in_menu'  => $validated['show_in_menu'] ?? false,
            'is_featured'     => $validated['is_featured'] ?? false,
            'noindex'         => $validated['noindex'] ?? false,
            'order'           => $validated['order'] ?? 0,
            'meta_title'      => $this->norm($validated['meta_title'] ?? null),
            'meta_description'=> $this->norm($validated['meta_description'] ?? null),
            'meta_keywords'   => $this->norm($validated['meta_keywords'] ?? null),
            'og_image'        => $this->norm($validated['og_image'] ?? null),
            'canonical_url'   => $this->norm($validated['canonical_url'] ?? null),
        ]);

        ActivityLog::record('created', 'Page created', $page);

        return redirect()->route('pages.index')->with('success', 'Page "' . $page->title . '" created successfully.');
    }

    // ─── Edit ──────────────────────────────────────────────────────────────

    public function edit(Page $page): Response
    {
        $this->authorize('update', $page);

        return Inertia::render('pages/Edit', [
            'page'       => $page->load('category'),
            'categories' => Category::active()->orderBy('name')->get(['id', 'name', 'color', 'parent_id']),
        ]);
    }

    // ─── Update ────────────────────────────────────────────────────────────

    public function update(Request $request, Page $page): RedirectResponse
    {
        $this->authorize('update', $page);

        $validated = $this->validatePageRequest($request, $page);

        $slug = $validated['slug'] ?? Str::slug($validated['title']);
        if ($slug !== $page->slug) {
            $slug = Page::generateUniqueSlug($slug);
        }

        $page->update([
            'title'         => $validated['title'],
            'slug'          => $slug,
            'excerpt'       => $this->norm($validated['excerpt'] ?? null),
            'content'       => HtmlSanitizer::clean($validated['content'] ?? ''),
            'featured_image'=> $this->norm($validated['featured_image'] ?? null),
            'category_id'   => $validated['category_id'] ?? null,
            'status'        => $validated['status'] ?? $page->status,
            'template'      => $validated['template'] ?? $page->template,
            'published_at'  => $this->resolvePublishDate($validated, $page),
            'show_in_menu'  => $validated['show_in_menu'] ?? $page->show_in_menu,
            'is_featured'     => $validated['is_featured'] ?? $page->is_featured,
            'noindex'         => $validated['noindex'] ?? $page->noindex,
            'order'           => $validated['order'] ?? $page->order,
            'meta_title'      => $this->norm($validated['meta_title'] ?? null),
            'meta_description'=> $this->norm($validated['meta_description'] ?? null),
            'meta_keywords'   => $this->norm($validated['meta_keywords'] ?? null),
            'og_image'        => $this->norm($validated['og_image'] ?? null),
            'canonical_url'   => $this->norm($validated['canonical_url'] ?? null),
        ]);

        ActivityLog::record('updated', 'Page updated', $page);

        return redirect()->route('pages.index')->with('success', 'Page "' . $page->title . '" updated successfully.');
    }

    // ─── Destroy ───────────────────────────────────────────────────────────

    public function destroy(Page $page): RedirectResponse
    {
        $this->authorize('delete', $page);

        ActivityLog::record('deleted', 'Page deleted', $page);
        $page->delete();

        return redirect()->route('pages.index')->with('success', 'Page "' . $page->title . '" deleted.');
    }

    // ─── Duplicate ─────────────────────────────────────────────────────────

    public function duplicate(Page $page): RedirectResponse
    {
        $this->authorize('duplicate', $page);

        $clone = $page->replicate();
        $clone->title      = $page->title . ' (Copy)';
        $clone->slug       = Page::generateUniqueSlug(Str::slug($clone->title));
        $clone->status     = 'draft';
        $clone->published_at = null;
        $clone->views      = 0;
        $clone->save();

        ActivityLog::record('created', 'Page duplicated', $clone);

        return redirect()->route('pages.edit', $clone->slug)->with('success', "Page duplicated. Edit and publish when ready.");
    }

    // ─── Publish / Unpublish ───────────────────────────────────────────────

    public function publish(Page $page): RedirectResponse
    {
        $this->authorize('update', $page);

        $page->update([
            'status'       => 'published',
            'published_at' => $page->published_at ?? now(),
        ]);

        ActivityLog::record('published', 'Page published', $page);

        return back()->with('success', 'Page "' . $page->title . '" is now live.');
    }

    public function unpublish(Page $page): RedirectResponse
    {
        $this->authorize('update', $page);

        $page->update(['status' => 'draft']);

        ActivityLog::record('unpublished', 'Page unpublished', $page);

        return back()->with('success', 'Page "' . $page->title . '" moved to draft.');
    }

    // ─── Public view ───────────────────────────────────────────────────────

    public function showPublic(Page $page): Response
    {
        abort_unless($page->isPublished(), 404);

        // Increment view count without triggering model events
        $page->increment('views');

        // Fetch related pages from the same category
        $related = $page->category_id
            ? Page::published()
                ->where('category_id', $page->category_id)
                ->where('id', '!=', $page->id)
                ->limit(4)
                ->get(['id', 'title', 'slug', 'excerpt', 'featured_image', 'published_at'])
            : collect();

        return Inertia::render('public/PageShow', [
            'page'    => $page->load('author:id,name', 'category:id,name,color,slug'),
            'related' => $related,
        ]);
    }

    // ─── Private helpers ───────────────────────────────────────────────────

    private function validatePageRequest(Request $request, ?Page $page = null): array
    {
        $slugRule = ['nullable', 'string', 'max:120', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/'];
        if ($page) {
            $slugRule[] = Rule::unique('pages', 'slug')->ignore($page->id);
        } else {
            $slugRule[] = 'unique:pages,slug';
        }

        return $request->validate([
            'title'           => ['required', 'string', 'max:255'],
            'slug'            => $slugRule,
            'excerpt'         => ['nullable', 'string', 'max:500'],
            'content'         => ['nullable', 'string'],
            'featured_image'  => ['nullable', 'string'],
            'category_id'     => ['nullable', 'integer', 'exists:categories,id'],
            'status'          => ['nullable', Rule::in(['draft', 'published'])],
            'template'        => ['nullable', Rule::in(['default', 'full-width', 'landing'])],
            'published_at'    => ['nullable', 'date'],
            'show_in_menu'    => ['boolean'],
            'is_featured'     => ['boolean'],
            'noindex'         => ['boolean'],
            'order'           => ['nullable', 'integer', 'min:0'],
            'meta_title'      => ['nullable', 'string', 'max:60'],
            'meta_description'=> ['nullable', 'string', 'max:160'],
            'meta_keywords'   => ['nullable', 'string', 'max:255'],
            'og_image'        => ['nullable', 'string'],
            'canonical_url'   => ['nullable', 'url', 'max:500'],
        ]);
    }

    private function resolvePublishDate(array $validated, ?Page $page = null): ?\Carbon\Carbon
    {
        if (! empty($validated['published_at'])) {
            return \Carbon\Carbon::parse($validated['published_at']);
        }

        if (($validated['status'] ?? null) === 'published') {
            return $page?->published_at ?? now();
        }

        return $page?->published_at;
    }

    private function norm(?string $value): ?string
    {
        if ($value === null) return null;
        $trimmed = trim($value);
        return $trimmed === '' ? null : $trimmed;
    }
}
