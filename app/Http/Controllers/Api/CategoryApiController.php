<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Cache;

class CategoryApiController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $categories = Cache::remember('api_categories', 3600, fn () =>
            Category::active()
                ->with('children')
                ->whereNull('parent_id')
                ->orderBy('order')
                ->get()
        );

        return CategoryResource::collection($categories);
    }

    public function show(string $slug): CategoryResource
    {
        $category = Category::active()->where('slug', $slug)->with('children')->firstOrFail();
        return new CategoryResource($category);
    }
}
