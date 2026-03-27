<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\Comment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    public function store(Request $request, Article $article): RedirectResponse
    {
        abort_unless($article->status === 'published', 404);

        $user = $request->user();

        $validated = $request->validate([
            'body'        => ['required', 'string', 'min:3', 'max:2000'],
            'parent_id'   => ['nullable', 'integer', 'exists:comments,id'],
            'guest_name'  => $user ? ['nullable'] : ['required', 'string', 'max:100'],
            'guest_email' => $user ? ['nullable'] : ['required', 'email', 'max:191'],
        ]);

        // Validate parent belongs to this article and is top-level (max 1 level nesting)
        if (!empty($validated['parent_id'])) {
            $parent = Comment::where('id', $validated['parent_id'])
                ->where('article_id', $article->id)
                ->whereNull('parent_id') // only reply to top-level
                ->first();

            abort_unless($parent !== null, 422, 'Invalid parent comment.');
        }

        // Admins/managers get auto-approved; guests and regular users go pending
        $autoApprove = $user && $user->roles()->whereIn('name', ['admin', 'manager'])->exists();

        Comment::create([
            'article_id'  => $article->id,
            'user_id'     => $user?->id,
            'parent_id'   => $validated['parent_id'] ?? null,
            'body'        => $validated['body'],
            'status'      => $autoApprove ? 'approved' : 'pending',
            'guest_name'  => $user ? null : $validated['guest_name'],
            'guest_email' => $user ? null : $validated['guest_email'],
            'ip_address'  => $request->ip(),
        ]);

        $message = $autoApprove
            ? 'Comment posted successfully.'
            : 'Comment submitted and awaiting moderation.';

        return back()->with('success', $message);
    }

    public function destroy(Request $request, Comment $comment): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user && ($comment->isOwnedBy($user->id) || $user->roles()->where('name', 'admin')->exists()), 403);

        $comment->delete();

        return back()->with('success', 'Comment deleted.');
    }
}
