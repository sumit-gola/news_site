<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\JsonResponse;
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

        // Get main categories with their children
        $categories = Category::main()
            ->when(!$request->include_inactive, fn ($q) => $q->active())
            ->with(['children' => function ($q) {
                $q->orderBy('order');
                if (!request()->include_inactive) {
                    $q->where('is_active', true);
                }
            }])
            ->orderBy('order')
            ->get();

        return Inertia::render('categories/Index', [
            'categories' => $categories,
            'include_inactive' => $request->boolean('include_inactive'),
        ]);
    }

    /**
     * Show form to create a new category.
     */
    public function create(Request $request): Response
    {
        $this->authorize('create', Category::class);

        // Parent categories for selection
        $parentCategories = Category::active()
            ->whereNull('parent_id')
            ->orderBy('name')
            ->get(['id', 'name']);

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
    public function store(Request $request): JsonResponse
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

        // Validate parent category is not self or descendant
        if ($validated['parent_id']) {
            $parent = Category::find($validated['parent_id']);
            if (!$parent || $parent->parent_id !== null) {
                // Only main categories can be parents
                return response()->json([
                    'error' => 'Parent must be a main category.',
                ], 422);
            }
        }

        $category = Category::create([
            'name'              => $validated['name'],
            'slug'              => $validated['slug'] ?? Str::slug($validated['name']),
            'description'       => $validated['description'],
            'parent_id'         => $validated['parent_id'],
            'featured_image'    => $validated['featured_image'],
            'color'             => $validated['color'] ?? '#6366f1',
            'icon'              => $validated['icon'],
            'meta_title'        => $validated['meta_title'],
            'meta_description'  => $validated['meta_description'],
            'meta_keywords'     => $validated['meta_keywords'],
            'og_image'          => $validated['og_image'],
            'order'             => $validated['order'] ?? 0,
            'is_active'         => $validated['is_active'] ?? true,
        ]);

        activity()
            ->performedOn($category)
            ->causedBy(auth()->user())
            ->log('created');

        return response()->json([
            'message'  => 'Category created successfully.',
            'category' => $category,
        ], 201);
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

        // Available parent categories (exclude self and descendants)
        $parentCategories = Category::active()
            ->whereNull('parent_id')
            ->where('id', '!=', $category->id)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('categories/Edit', [
            'category'           => $category->load(['parent', 'children']),
            'parentCategories'   => $parentCategories,
        ]);
    }

    /**
     * Update a category.
     */
    public function update(Request $request, Category $category): JsonResponse
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
        if ($validated['parent_id']) {
            if ($validated['parent_id'] === $category->id) {
                return response()->json([
                    'error' => 'Category cannot be its own parent.',
                ], 422);
            }

            // Check if parent is a descendant
            if (in_array($validated['parent_id'], $category->descendants()->pluck('id')->toArray())) {
                return response()->json([
                    'error' => 'Cannot set a descendant as parent.',
                ], 422);
            }
        }

        $category->update([
            'name'              => $validated['name'],
            'slug'              => $validated['slug'] ?? Str::slug($validated['name']),
            'description'       => $validated['description'],
            'parent_id'         => $validated['parent_id'],
            'featured_image'    => $validated['featured_image'],
            'color'             => $validated['color'],
            'icon'              => $validated['icon'],
            'meta_title'        => $validated['meta_title'],
            'meta_description'  => $validated['meta_description'],
            'meta_keywords'     => $validated['meta_keywords'],
            'og_image'          => $validated['og_image'],
            'order'             => $validated['order'],
            'is_active'         => $validated['is_active'],
        ]);

        activity()
            ->performedOn($category)
            ->causedBy(auth()->user())
            ->log('updated');

        return response()->json([
            'message'  => 'Category updated successfully.',
            'category' => $category->load(['parent', 'children']),
        ]);
    }

    /**
     * Delete a category (soft delete via archive).
     */
    public function destroy(Category $category): JsonResponse
    {
        $this->authorize('delete', $category);

        // Check if category has articles
        if ($category->articles()->exists()) {
            return response()->json([
                'error' => 'Cannot delete category with articles. Please reassign them first.',
            ], 422);
        }

        // Check if category has children
        if ($category->children()->exists()) {
            return response()->json([
                'error' => 'Cannot delete category with subcategories. Please delete or move them first.',
            ], 422);
        }

        activity()
            ->performedOn($category)
            ->causedBy(auth()->user())
            ->log('deleted');

        $category->delete();

        return response()->json(['message' => 'Category deleted successfully.']);
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
