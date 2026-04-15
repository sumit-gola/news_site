<?php

use App\Http\Controllers\Admin\CommentController as AdminCommentController;
use App\Http\Controllers\Admin\MediaController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\AdAnalyticsController;
use App\Http\Controllers\Admin\AdSlotController;
use App\Http\Controllers\Admin\AdvertisementController;
use App\Http\Controllers\Admin\AdvertiserController;
use App\Http\Controllers\Api\AdSlotController as PublicAdSlotController;
use App\Http\Controllers\Api\MediaController as ApiMediaController;
use App\Http\Controllers\ArticleController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\EditorImageController;
use App\Http\Controllers\PageController;
use App\Models\ActivityLog;
use App\Models\Advertisement;
use App\Models\Article;
use App\Models\Category;
use App\Models\Comment;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        // Article stats
        $totalArticles     = Article::count();
        $publishedArticles = Article::where('status', 'published')->count();
        $pendingArticles   = Article::where('status', 'pending')->count();
        $draftArticles     = Article::where('status', 'draft')->count();
        $rejectedArticles  = Article::where('status', 'rejected')->count();

        // User stats
        $totalUsers  = User::count();
        $activeUsers = User::where('status', 'active')->count();

        // Comment stats
        $totalComments   = Comment::count();
        $pendingComments = Comment::where('status', 'pending')->count();

        // Category & Tag stats
        $totalCategories  = Category::count();
        $activeCategories = Category::where('is_active', true)->count();
        $totalTags        = Tag::count();

        // Ad stats
        $activeAds = Advertisement::where('status', 'active')->count();
        $totalAds  = Advertisement::count();

        // Recent articles (last 8)
        $recentArticles = Article::with(['author:id,name', 'categories:id,name'])
            ->latest()
            ->take(8)
            ->get(['id', 'title', 'slug', 'status', 'user_id', 'published_at', 'created_at']);

        // Pending articles for review (last 5)
        $pendingReview = Article::with(['author:id,name'])
            ->where('status', 'pending')
            ->latest()
            ->take(5)
            ->get(['id', 'title', 'slug', 'user_id', 'created_at']);

        // Recent comments (last 5 pending)
        $recentComments = Comment::with(['article:id,title,slug', 'user:id,name'])
            ->where('status', 'pending')
            ->latest()
            ->take(5)
            ->get(['id', 'body', 'status', 'guest_name', 'user_id', 'article_id', 'created_at']);

        // Top categories by article count
        $topCategories = Category::withCount(['articles' => fn ($q) => $q->where('status', 'published')])
            ->orderByDesc('articles_count')
            ->take(5)
            ->get(['id', 'name', 'slug', 'color']);

        // Recent activity
        $recentActivity = ActivityLog::with('user:id,name')
            ->latest()
            ->take(8)
            ->get(['id', 'user_id', 'action', 'description', 'created_at']);

        return Inertia::render('dashboard', [
            'stats' => [
                'articles' => [
                    'total'     => $totalArticles,
                    'published' => $publishedArticles,
                    'pending'   => $pendingArticles,
                    'draft'     => $draftArticles,
                    'rejected'  => $rejectedArticles,
                ],
                'users' => [
                    'total'  => $totalUsers,
                    'active' => $activeUsers,
                ],
                'comments' => [
                    'total'   => $totalComments,
                    'pending' => $pendingComments,
                ],
                'categories' => [
                    'total'  => $totalCategories,
                    'active' => $activeCategories,
                ],
                'tags'       => $totalTags,
                'active_ads' => $activeAds,
                'total_ads'  => $totalAds,
            ],
            'recentArticles' => $recentArticles,
            'pendingReview'  => $pendingReview,
            'recentComments' => $recentComments,
            'topCategories'  => $topCategories,
            'recentActivity' => $recentActivity,
        ]);
    })->name('dashboard');
});

// ── Admin Routes ──────────────────────────────────────────────────────────────
Route::prefix('admin')->name('admin.')->middleware(['auth', 'verified', 'role:admin'])->group(function () {

    // User Management
    Route::get('users', [UserController::class, 'index'])->name('users.index');
    Route::post('users', [UserController::class, 'store'])->name('users.store');
    Route::put('users/{user}', [UserController::class, 'update'])->name('users.update');
    Route::delete('users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
    Route::delete('users', [UserController::class, 'bulkDestroy'])->name('users.bulk-destroy');
    Route::patch('users/{user}/toggle-status', [UserController::class, 'toggleStatus'])->name('users.toggle-status');

    // Role & Permission Management
    Route::get('roles', [RoleController::class, 'index'])->name('roles.index');
    Route::post('roles', [RoleController::class, 'store'])->name('roles.store');
    Route::put('roles/{role}', [RoleController::class, 'update'])->name('roles.update');
    Route::delete('roles/{role}', [RoleController::class, 'destroy'])->name('roles.destroy');

    // Admin publishing shortcut
    Route::get('articles', [ArticleController::class, 'adminIndex'])->name('articles.index');
    Route::post('articles/{article}/publish', [ArticleController::class, 'publish'])->name('articles.publish');

    // Comment Management
    Route::get('comments/dashboard', [AdminCommentController::class, 'dashboard'])->name('comments.dashboard');
    Route::get('comments', [AdminCommentController::class, 'index'])->name('comments.index');
    Route::patch('comments/bulk-action', [AdminCommentController::class, 'bulkAction'])->name('comments.bulk-action');
    Route::put('comments/{comment}', [AdminCommentController::class, 'update'])->name('comments.update');
    Route::patch('comments/{comment}/approve', [AdminCommentController::class, 'approve'])->name('comments.approve');
    Route::patch('comments/{comment}/reject', [AdminCommentController::class, 'reject'])->name('comments.reject');
    Route::patch('comments/{comment}/spam', [AdminCommentController::class, 'spam'])->name('comments.spam');
    Route::patch('comments/{comment}/restore', [AdminCommentController::class, 'restore'])->name('comments.restore');
    Route::delete('comments/{comment}/force', [AdminCommentController::class, 'forceDestroy'])->name('comments.force-destroy');
    Route::delete('comments/{comment}', [AdminCommentController::class, 'destroy'])->name('comments.destroy');

    // Media Library
    Route::get('media', [MediaController::class, 'index'])->name('media.index');
    Route::post('media', [MediaController::class, 'store'])->name('media.store');
    Route::put('media/{media}', [MediaController::class, 'update'])->name('media.update');
    Route::delete('media/bulk', [MediaController::class, 'bulkDestroy'])->name('media.bulk-destroy');
    Route::delete('media/{media}', [MediaController::class, 'destroy'])->name('media.destroy');

    // Advertisement Management
    Route::get('advertisements/analytics', [AdAnalyticsController::class, 'index'])->name('advertisements.analytics');
    Route::get('advertisements/analytics/export', [AdAnalyticsController::class, 'export'])->name('advertisements.analytics.export');
    Route::patch('advertisements/bulk-action', [AdvertisementController::class, 'bulkAction'])->name('advertisements.bulk-action');
    Route::patch('advertisements/{advertisement}/toggle-status', [AdvertisementController::class, 'toggleStatus'])->name('advertisements.toggle-status');
    Route::resource('advertisements', AdvertisementController::class);
    Route::resource('advertisers', AdvertiserController::class)->except(['show']);
    Route::resource('ad-slots', AdSlotController::class)->except(['show']);
});

// ── Authenticated Routes ──────────────────────────────────────────────────────
Route::middleware(['auth', 'verified'])->group(function () {

    // ── Category Management ──
    Route::get('categories', [CategoryController::class, 'index'])->name('categories.index');
    Route::get('categories/create', [CategoryController::class, 'create'])->name('categories.create');
    Route::post('categories', [CategoryController::class, 'store'])->name('categories.store');
    Route::get('categories/{category}/edit', [CategoryController::class, 'edit'])->name('categories.edit');
    Route::put('categories/{category}', [CategoryController::class, 'update'])->name('categories.update');
    Route::delete('categories/{category}', [CategoryController::class, 'destroy'])->name('categories.destroy');
    Route::post('categories/reorder', [CategoryController::class, 'reorder'])->name('categories.reorder');
    Route::get('categories/list', [CategoryController::class, 'list'])->name('categories.list');

    // ── Editor Image Upload ──
    Route::post('editor/images/upload', [EditorImageController::class, 'upload'])->name('editor.images.upload');

    // ── CMS Page Management ──
    Route::get('pages', [PageController::class, 'index'])->name('pages.index');
    Route::get('pages/create', [PageController::class, 'create'])->name('pages.create');
    Route::post('pages', [PageController::class, 'store'])->name('pages.store');
    Route::get('pages/{page:slug}/edit', [PageController::class, 'edit'])->name('pages.edit');
    Route::put('pages/{page:slug}', [PageController::class, 'update'])->name('pages.update');
    Route::delete('pages/{page:slug}', [PageController::class, 'destroy'])->name('pages.destroy');
    Route::post('pages/{page:slug}/duplicate', [PageController::class, 'duplicate'])->name('pages.duplicate');
    Route::patch('pages/{page:slug}/publish', [PageController::class, 'publish'])->name('pages.publish');
    Route::patch('pages/{page:slug}/unpublish', [PageController::class, 'unpublish'])->name('pages.unpublish');

    // ── Article Management ──
    Route::get('articles', [ArticleController::class, 'index'])->name('articles.index');
    Route::get('articles/create', [ArticleController::class, 'create'])->name('articles.create');
    Route::post('articles', [ArticleController::class, 'store'])->name('articles.store');
    Route::get('articles/{article}', [ArticleController::class, 'show'])->name('articles.show');
    Route::get('articles/{article}/edit', [ArticleController::class, 'edit'])->name('articles.edit');
    Route::put('articles/{article}', [ArticleController::class, 'update'])->name('articles.update');
    Route::delete('articles/{article}', [ArticleController::class, 'destroy'])->name('articles.destroy');
    Route::post('articles/{article}/submit', [ArticleController::class, 'submit'])->name('articles.submit');
    Route::post('articles/{article}/approve', [ArticleController::class, 'approve'])->name('articles.approve');
    Route::post('articles/{article}/reject', [ArticleController::class, 'reject'])->name('articles.reject');
});

// ── Manager Dashboard ─────────────────────────────────────────────────────────
Route::middleware(['auth', 'verified', 'role:admin,manager'])->group(function () {
    Route::get('manager/dashboard', function () {
        return Inertia::render('manager/dashboard', [
            'stats' => [
                'total_categories'  => Category::count(),
                'active_categories' => Category::where('is_active', true)->count(),
                'pending_articles'  => Article::where('status', 'pending')->count(),
                'published_articles'=> Article::where('status', 'published')->count(),
            ],
        ]);
    })->name('manager.dashboard');
});

// ── Reporter Dashboard ────────────────────────────────────────────────────────
Route::middleware(['auth', 'verified', 'role:admin,manager,reporter'])->group(function () {
    Route::get('reporter/dashboard', function () {
        $user = request()->user();

        return Inertia::render('reporter/dashboard', [
            'stats' => [
                'total_categories' => Category::where('is_active', true)->count(),
                'my_drafts'        => Article::where('user_id', $user->id)->where('status', 'draft')->count(),
                'my_published'     => Article::where('user_id', $user->id)->where('status', 'published')->count(),
            ],
        ]);
    })->name('reporter.dashboard');
});

require __DIR__.'/settings.php';

Route::middleware(['auth'])->get('/api/media', [ApiMediaController::class, 'index'])->name('api.media.index');

Route::get('/api/ad-slots', [PublicAdSlotController::class, 'index'])->name('api.ad-slots.index');
Route::post('/api/ad-slots/{advertisement}/impression', [PublicAdSlotController::class, 'trackImpression'])->name('api.ad-slots.impression');
Route::post('/api/ad-slots/{advertisement}/click', [PublicAdSlotController::class, 'trackClick'])->name('api.ad-slots.click');
Route::post('/api/ad-slots/{advertisement}/dismiss', [PublicAdSlotController::class, 'dismiss'])->name('api.ad-slots.dismiss');
