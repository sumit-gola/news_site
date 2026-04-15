<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ArticleResource;
use App\Models\Article;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Cache;

class ArticleApiController extends Controller
{
    /**
     * GET /api/articles
     * Supports: ?search=, ?category=slug, ?tag=slug, ?status=, ?per_page=
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $request->validate([
            'per_page' => 'integer|min:1|max:50',
            'status'   => 'nullable|in:published',
        ]);

        $perPage = $request->integer('per_page', 15);

        $articles = Article::published()
            ->with(['author:id,name', 'categories:id,name,slug,color', 'tags:id,name,slug'])
            ->when($request->search, fn ($q, $s) => $q->search($s))
            ->when($request->category, fn ($q, $s) => $q->whereHas('categories', fn ($cq) => $cq->where('slug', $s)))
            ->when($request->tag, fn ($q, $s) => $q->whereHas('tags', fn ($tq) => $tq->where('slug', $s)))
            ->paginate($perPage);

        return ArticleResource::collection($articles);
    }

    /**
     * GET /api/articles/trending
     * Top 10 most viewed articles (cached 10 min).
     */
    public function trending(): AnonymousResourceCollection
    {
        $articles = Cache::remember('api_trending', 600, fn () =>
            Article::published()
                ->with(['author:id,name', 'categories:id,name,slug,color'])
                ->orderByDesc('views')
                ->limit(10)
                ->get()
        );

        return ArticleResource::collection($articles);
    }

    /**
     * GET /api/articles/breaking
     * Breaking news (cached 5 min).
     */
    public function breaking(): AnonymousResourceCollection
    {
        $articles = Cache::remember('api_breaking', 300, fn () =>
            Article::breaking()
                ->with(['author:id,name', 'categories:id,name,slug,color'])
                ->limit(8)
                ->get()
        );

        return ArticleResource::collection($articles);
    }

    /**
     * GET /api/articles/{slug}
     */
    public function show(string $slug): ArticleResource
    {
        $article = Article::published()
            ->with(['author:id,name', 'categories:id,name,slug,color', 'tags:id,name,slug', 'meta', 'approvedComments.replies'])
            ->where('slug', $slug)
            ->firstOrFail();

        $article->increment('views');

        return new ArticleResource($article);
    }
}
