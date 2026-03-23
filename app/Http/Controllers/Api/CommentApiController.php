<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CommentResource;
use App\Models\Article;
use App\Models\Comment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CommentApiController extends Controller
{
    /**
     * GET /api/articles/{slug}/comments
     * Returns approved, top-level comments with replies.
     */
    public function index(string $slug): AnonymousResourceCollection
    {
        $article = Article::published()->where('slug', $slug)->firstOrFail();

        $comments = Comment::approved()
            ->topLevel()
            ->where('article_id', $article->id)
            ->with('replies')
            ->latest()
            ->paginate(20);

        return CommentResource::collection($comments);
    }

    /**
     * POST /api/articles/{slug}/comments
     * Guests and auth users can post comments.
     */
    public function store(Request $request, string $slug): JsonResponse
    {
        $article = Article::published()
            ->where('slug', $slug)
            ->where('allow_comments', true)
            ->firstOrFail();

        $data = $request->validate([
            'body'         => 'required|string|min:3|max:2000',
            'author_name'  => 'required_without:auth_user|nullable|string|max:100',
            'author_email' => 'nullable|email|max:255',
            'parent_id'    => 'nullable|integer|exists:comments,id',
        ]);

        $comment = Comment::create([
            'article_id'   => $article->id,
            'user_id'      => $request->user()?->id,
            'parent_id'    => $data['parent_id'] ?? null,
            'author_name'  => $request->user()?->name ?? $data['author_name'],
            'author_email' => $data['author_email'] ?? null,
            'body'         => $data['body'],
            'status'       => 'pending', // all comments require moderation
            'ip_address'   => $request->ip(),
        ]);

        return response()->json([
            'message' => 'Comment submitted and awaiting moderation.',
            'comment' => new CommentResource($comment),
        ], 201);
    }
}
