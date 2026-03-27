<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CommentController extends Controller
{
    public function index(Request $request): Response
    {
        $perPage  = min(max((int) $request->integer('per_page', 20), 10), 100);
        $sortDir  = $request->string('sort_dir', 'desc')->toString() === 'asc' ? 'asc' : 'desc';

        $comments = Comment::withTrashed(false)
            ->with(['user:id,name', 'article:id,title,slug'])
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->article_id, fn ($q) => $q->where('article_id', $request->integer('article_id')))
            ->when($request->search, function ($q) use ($request) {
                $term = '%' . trim((string) $request->search) . '%';
                $q->where(function ($inner) use ($term) {
                    $inner->where('body', 'like', $term)
                        ->orWhere('guest_name', 'like', $term)
                        ->orWhere('guest_email', 'like', $term);
                });
            })
            ->orderBy('created_at', $sortDir)
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (Comment $c) => $this->serialize($c));

        return Inertia::render('admin/comments/Index', [
            'comments' => $comments,
            'filters'  => $request->only(['status', 'article_id', 'search', 'sort_dir', 'per_page']),
            'summary'  => [
                'total'    => Comment::count(),
                'pending'  => Comment::pending()->count(),
                'approved' => Comment::approved()->count(),
                'rejected' => Comment::where('status', 'rejected')->count(),
                'spam'     => Comment::where('status', 'spam')->count(),
            ],
        ]);
    }

    public function approve(Comment $comment): RedirectResponse
    {
        $comment->update(['status' => 'approved']);

        return back()->with('success', 'Comment approved.');
    }

    public function reject(Comment $comment): RedirectResponse
    {
        $comment->update(['status' => 'rejected']);

        return back()->with('success', 'Comment rejected.');
    }

    public function spam(Comment $comment): RedirectResponse
    {
        $comment->update(['status' => 'spam']);

        return back()->with('success', 'Comment marked as spam.');
    }

    public function destroy(Comment $comment): RedirectResponse
    {
        $comment->delete();

        return back()->with('success', 'Comment deleted.');
    }

    public function bulkAction(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'action' => ['required', Rule::in(['approve', 'reject', 'spam', 'delete'])],
            'ids'    => ['required', 'array', 'min:1'],
            'ids.*'  => ['integer', 'exists:comments,id'],
        ]);

        $comments = Comment::whereIn('id', $validated['ids'])->get();
        $count    = $comments->count();

        foreach ($comments as $comment) {
            match ($validated['action']) {
                'approve' => $comment->update(['status' => 'approved']),
                'reject'  => $comment->update(['status' => 'rejected']),
                'spam'    => $comment->update(['status' => 'spam']),
                'delete'  => $comment->delete(),
            };
        }

        return back()->with('success', "Applied to {$count} comment(s).");
    }

    private function serialize(Comment $c): array
    {
        return [
            'id'          => $c->id,
            'body'        => $c->body,
            'status'      => $c->status,
            'author_name' => $c->author_name,
            'guest_email' => $c->guest_email,
            'ip_address'  => $c->ip_address,
            'parent_id'   => $c->parent_id,
            'article'     => $c->article ? ['id' => $c->article->id, 'title' => $c->article->title, 'slug' => $c->article->slug] : null,
            'user'        => $c->user ? ['id' => $c->user->id, 'name' => $c->user->name] : null,
            'created_at'  => $c->created_at?->toISOString(),
        ];
    }
}
