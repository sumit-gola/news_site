<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    /**
     * Display categories tree structure (hierarchical).
     */
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Category::class);

        $includeInactive = $request->boolean('include_inactive');

        // Load 3 levels deep: main → children → grandchildren
        $categories = Category::main()
            ->when(!$includeInactive, fn ($q) => $q->active())
            ->with(['children' => function ($q) use ($includeInactive) {
                $q->orderBy('order');
                if (!$includeInactive) $q->where('is_active', true);
                $q->with(['children' => function ($q2) use ($includeInactive) {
                    $q2->orderBy('order');
                    if (!$includeInactive) $q2->where('is_active', true);
                }]);
            }])
            ->orderBy('order')
            ->get();

        // Flat list for the category combobox in the modal
        $allCategories = Category::orderBy('name')->get(['id', 'name', 'color', 'parent_id', 'is_active']);

        return Inertia::render('categories/Index', [
            'categories'      => $categories,
            'allCategories'   => $allCategories,
            'include_inactive' => $includeInactive,
            'can_manage'      => $request->user()->can('create', Category::class),
            'flash'           => [
                'success' => session('success'),
                'error'   => session('error'),
            ],
        ]);
    }

    /**
     * Show form to create a new category.
     */
    public function create(Request $request): Response
    {
        $this->authorize('create', Category::class);

        // All active categories for combobox (supports any depth as parent)
        $parentCategories = Category::active()->orderBy('name')->get(['id', 'name', 'color', 'parent_id', 'is_active']);

        // Get parent if editing subcategory
        $parent = null;
        if ($request->parent_id) {
            $parent = Category::find($request->parent_id);
        }

        return Inertia::render('categories/Create', [
            'parentCategories' => $parentCategories,
            'parent'           => $parent,
        ]);
    }

    /**
     * Store a new category.
     */
    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Category::class);

        $validated = $request->validate([
            'name'              => ['required', 'string', 'max:100'],
            'slug'              => ['nullable', 'string', 'max:100', 'unique:categories'],
            'description'       => ['nullable', 'string', 'max:1000'],
            'parent_id'         => ['nullable', 'integer', 'exists:categories,id'],
            'featured_image'    => ['nullable', 'string'],
            'color'             => ['nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'icon'              => ['nullable', 'string', 'max:50'],
            'meta_title'        => ['nullable', 'string', 'max:60'],
            'meta_description'  => ['nullable', 'string', 'max:160'],
            'meta_keywords'     => ['nullable', 'string'],
            'og_image'          => ['nullable', 'string'],
            'order'             => ['nullable', 'integer', 'min:0'],
            'is_active'         => ['boolean'],
        ]);

        // Validate parent exists (no depth limit — supports sub-sub-categories)
        if (!empty($validated['parent_id'])) {
            if (!Category::find($validated['parent_id'])) {
                return back()->withErrors(['parent_id' => 'Selected parent category does not exist.'])->withInput();
            }
        }

        $category = Category::create([
            'name'              => $validated['name'],
            'slug'              => $validated['slug'] ?? Str::slug($validated['name']),
            'description'       => $validated['description'] ?? null,
            'parent_id'         => $validated['parent_id'] ?? null,
            'featured_image'    => $validated['featured_image'] ?? null,
            'color'             => $validated['color'] ?? '#6366f1',
            'icon'              => $validated['icon'] ?? null,
            'meta_title'        => $validated['meta_title'] ?? null,
            'meta_description'  => $validated['meta_description'] ?? null,
            'meta_keywords'     => $validated['meta_keywords'] ?? null,
            'og_image'          => $validated['og_image'] ?? null,
            'order'             => $validated['order'] ?? 0,
            'is_active'         => $validated['is_active'] ?? true,
        ]);

        ActivityLog::record('created', 'Category created', $category);

        return redirect()->route('categories.index')
            ->with('success', 'Category created successfully.');
    }

    /**
     * Display a specific category.
     */
    public function show(Category $category): JsonResponse
    {
        $this->authorize('view', $category);

        return response()->json([
            'category'    => $category->load(['parent', 'children']),
            'articles'    => $category->articles()
                ->published()
                ->paginate(20),
        ]);
    }

    /**
     * Show form to edit a category.
     */
    public function edit(Category $category): Response
    {
        $this->authorize('update', $category);

        // All active categories except self and its descendants
        $excludeIds = array_merge([$category->id], $category->descendants()->pluck('id')->toArray());
        $parentCategories = Category::active()
            ->whereNotIn('id', $excludeIds)
            ->orderBy('name')
            ->get(['id', 'name', 'color', 'parent_id', 'is_active']);

        return Inertia::render('categories/Edit', [
            'category'           => $category->load(['parent', 'children']),
            'parentCategories'   => $parentCategories,
        ]);
    }

    /**
     * Update a category.
     */
    public function update(Request $request, Category $category): RedirectResponse
    {
        $this->authorize('update', $category);

        $validated = $request->validate([
            'name'              => ['required', 'string', 'max:100'],
            'slug'              => ['nullable', 'string', 'max:100', 'unique:categories,slug,' . $category->id],
            'description'       => ['nullable', 'string', 'max:1000'],
            'parent_id'         => ['nullable', 'integer', 'exists:categories,id'],
            'featured_image'    => ['nullable', 'string'],
            'color'             => ['nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'icon'              => ['nullable', 'string', 'max:50'],
            'meta_title'        => ['nullable', 'string', 'max:60'],
            'meta_description'  => ['nullable', 'string', 'max:160'],
            'meta_keywords'     => ['nullable', 'string'],
            'og_image'          => ['nullable', 'string'],
            'order'             => ['nullable', 'integer', 'min:0'],
            'is_active'         => ['boolean'],
        ]);

        // Prevent circular parent-child relationships
        if (!empty($validated['parent_id'])) {
            if ($validated['parent_id'] === $category->id) {
                return back()->withErrors(['parent_id' => 'Category cannot be its own parent.'])->withInput();
            }
            if (in_array($validated['parent_id'], $category->descendants()->pluck('id')->toArray())) {
                return back()->withErrors(['parent_id' => 'Cannot set a descendant as parent.'])->withInput();
            }
        }

        $category->update([
            'name'              => $validated['name'],
            'slug'              => $validated['slug'] ?? Str::slug($validated['name']),
            'description'       => $validated['description'] ?? null,
            'parent_id'         => $validated['parent_id'] ?? null,
            'featured_image'    => $validated['featured_image'] ?? null,
            'color'             => $validated['color'] ?? $category->color,
            'icon'              => $validated['icon'] ?? null,
            'meta_title'        => $validated['meta_title'] ?? null,
            'meta_description'  => $validated['meta_description'] ?? null,
            'meta_keywords'     => $validated['meta_keywords'] ?? null,
            'og_image'          => $validated['og_image'] ?? null,
            'order'             => $validated['order'] ?? $category->order,
            'is_active'         => $validated['is_active'] ?? $category->is_active,
        ]);

        ActivityLog::record('updated', 'Category updated', $category);

        return redirect()->route('categories.index')
            ->with('success', 'Category updated successfully.');
    }

    /**
     * Delete a category (soft delete via archive).
     */
    public function destroy(Category $category): RedirectResponse
    {
        $this->authorize('delete', $category);

        if ($category->articles()->exists()) {
            return back()->with('error', 'Cannot delete category with articles. Please reassign them first.');
        }

        if ($category->children()->exists()) {
            return back()->with('error', 'Cannot delete category with subcategories. Please delete or move them first.');
        }

        ActivityLog::record('deleted', 'Category deleted', $category);

        $category->delete();

        return redirect()->route('categories.index')
            ->with('success', 'Category deleted successfully.');
    }

    /**
     * Reorder categories (drag and drop).
     */
    public function reorder(Request $request): JsonResponse
    {
        $this->authorize('update', Category::class);

        $validated = $request->validate([
            'categories' => ['required', 'array'],
            'categories.*.id' => ['required', 'integer', 'exists:categories,id'],
            'categories.*.order' => ['required', 'integer', 'min:0'],
            'categories.*.parent_id' => ['nullable', 'integer', 'exists:categories,id'],
        ]);

        foreach ($validated['categories'] as $item) {
            Category::where('id', $item['id'])
                ->update([
                    'order'     => $item['order'],
                    'parent_id' => $item['parent_id'],
                ]);
        }

        return response()->json(['message' => 'Categories reordered successfully.']);
    }

    /**
     * Get categories as flat list (for select dropdowns).
     */
    public function list(): JsonResponse
    {
        return response()->json([
            'categories' => Category::active()
                ->orderBy('name')
                ->get(['id', 'name', 'parent_id']),
        ]);
    }

    /**
     * Get category with its articles for public view.
     */
    public function show_public(Category $category)
    {
        if (!$category->is_active) {
            abort(404);
        }

        return Inertia::render('categories/Show', [
            'category' => $category->load([
                'parent',
                'children' => function ($q) {
                    $q->where('is_active', true)->orderBy('order');
                },
            ]),
            'articles' => $category->articles()
                ->published()
                ->paginate(15),
            'breadcrumbs' => $category->breadcrumbs(),
        ]);
    }
}
