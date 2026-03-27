<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CommentController extends Controller
{
    // ─── Dashboard ────────────────────────────────────────────────────────────

    public function dashboard(): Response
    {
        $total    = Comment::withTrashed()->count();
        $trashed  = Comment::onlyTrashed()->count();
        $active   = Comment::count();
        $pending  = Comment::pending()->count();
        $approved = Comment::approved()->count();
        $rejected = Comment::where('status', 'rejected')->count();
        $spam     = Comment::where('status', 'spam')->count();

        $todayCount = Comment::withTrashed()->whereDate('created_at', today())->count();
        $weekCount  = Comment::withTrashed()->where('created_at', '>=', now()->startOfWeek())->count();
        $memberCount = Comment::whereNotNull('user_id')->count();
        $guestCount  = Comment::whereNull('user_id')->count();

        $approvalRate = ($approved + $rejected) > 0
            ? round(($approved / ($approved + $rejected)) * 100)
            : 0;

        $topArticles = Comment::approved()
            ->select('article_id', DB::raw('COUNT(*) as comment_count'))
            ->with('article:id,title,slug')
            ->groupBy('article_id')
            ->orderByDesc('comment_count')
            ->limit(5)
            ->get()
            ->map(fn ($row) => [
                'article' => $row->article ? ['id' => $row->article->id, 'title' => $row->article->title, 'slug' => $row->article->slug] : null,
                'count'   => $row->comment_count,
            ]);

        $recent = Comment::withTrashed()
            ->with(['user:id,name', 'article:id,title,slug'])
            ->orderByDesc('created_at')
            ->limit(8)
            ->get()
            ->map(fn (Comment $c) => $this->serialize($c));

        // Daily trend: last 7 days
        $trend = collect(range(6, 0))->map(function ($daysAgo) {
            $date = now()->subDays($daysAgo)->toDateString();

            return [
                'date'  => $date,
                'label' => now()->subDays($daysAgo)->format('D'),
                'count' => Comment::withTrashed()->whereDate('created_at', $date)->count(),
            ];
        });

        return Inertia::render('admin/comments/Dashboard', [
            'stats' => [
                'total'        => $total,
                'active'       => $active,
                'trashed'      => $trashed,
                'pending'      => $pending,
                'approved'     => $approved,
                'rejected'     => $rejected,
                'spam'         => $spam,
                'today'        => $todayCount,
                'this_week'    => $weekCount,
                'members'      => $memberCount,
                'guests'       => $guestCount,
                'approval_rate'=> $approvalRate,
            ],
            'topArticles' => $topArticles,
            'recent'      => $recent,
            'trend'       => $trend,
        ]);
    }

    // ─── Index ────────────────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $perPage = min(max((int) $request->integer('per_page', 20), 10), 100);
        $sortDir = $request->string('sort_dir', 'desc')->toString() === 'asc' ? 'asc' : 'desc';
        $trashed = $request->boolean('trashed', false);

        $query = $trashed
            ? Comment::onlyTrashed()->with(['user:id,name', 'article:id,title,slug'])
            : Comment::with(['user:id,name', 'article:id,title,slug']);

        $comments = $query
            ->when(!$trashed && $request->status, fn ($q) => $q->where('status', $request->status))
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

        return Inertia::render('admin/comments/index', [
            'comments' => $comments,
            'filters'  => $request->only(['status', 'article_id', 'search', 'sort_dir', 'per_page', 'trashed']),
            'summary'  => [
                'total'    => Comment::count(),
                'pending'  => Comment::pending()->count(),
                'approved' => Comment::approved()->count(),
                'rejected' => Comment::where('status', 'rejected')->count(),
                'spam'     => Comment::where('status', 'spam')->count(),
                'trashed'  => Comment::onlyTrashed()->count(),
            ],
        ]);
    }

    // ─── Moderation ───────────────────────────────────────────────────────────

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

    // ─── Edit ─────────────────────────────────────────────────────────────────

    public function update(Request $request, Comment $comment): RedirectResponse
    {
        $validated = $request->validate([
            'body'   => ['required', 'string', 'min:1', 'max:5000'],
            'status' => ['required', Rule::in(['pending', 'approved', 'rejected', 'spam'])],
        ]);

        $comment->update($validated);

        return back()->with('success', 'Comment updated.');
    }

    // ─── Delete / Restore ─────────────────────────────────────────────────────

    public function destroy(Comment $comment): RedirectResponse
    {
        $comment->delete(); // soft delete

        return back()->with('success', 'Comment moved to trash.');
    }

    public function restore(int $comment): RedirectResponse
    {
        $model = Comment::withTrashed()->findOrFail($comment);
        $model->restore();

        return back()->with('success', 'Comment restored.');
    }

    public function forceDestroy(int $comment): RedirectResponse
    {
        $model = Comment::withTrashed()->findOrFail($comment);
        $model->forceDelete();

        return back()->with('success', 'Comment permanently deleted.');
    }

    // ─── Bulk ─────────────────────────────────────────────────────────────────

    public function bulkAction(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'action' => ['required', Rule::in(['approve', 'reject', 'spam', 'delete', 'restore', 'force_delete'])],
            'ids'    => ['required', 'array', 'min:1'],
            'ids.*'  => ['integer'],
        ]);

        $comments = in_array($validated['action'], ['restore', 'force_delete'])
            ? Comment::withTrashed()->whereIn('id', $validated['ids'])->get()
            : Comment::whereIn('id', $validated['ids'])->get();

        $count = $comments->count();

        foreach ($comments as $comment) {
            match ($validated['action']) {
                'approve'      => $comment->update(['status' => 'approved']),
                'reject'       => $comment->update(['status' => 'rejected']),
                'spam'         => $comment->update(['status' => 'spam']),
                'delete'       => $comment->delete(),
                'restore'      => $comment->restore(),
                'force_delete' => $comment->forceDelete(),
            };
        }

        return back()->with('success', "Applied to {$count} comment(s).");
    }

    // ─── Serializer ───────────────────────────────────────────────────────────

    private function serialize(Comment $c): array
    {
        return [
            'id'           => $c->id,
            'body'         => $c->body,
            'status'       => $c->status,
            'author_name'  => $c->author_name,
            'author_initials' => $c->author_initials,
            'guest_email'  => $c->guest_email,
            'ip_address'   => $c->ip_address,
            'parent_id'    => $c->parent_id,
            'article'      => $c->article ? ['id' => $c->article->id, 'title' => $c->article->title, 'slug' => $c->article->slug] : null,
            'user'         => $c->user ? ['id' => $c->user->id, 'name' => $c->user->name] : null,
            'created_at'   => $c->created_at?->toISOString(),
            'deleted_at'   => $c->deleted_at?->toISOString(),
        ];
    }
}
