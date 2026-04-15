<?php

namespace App\Http\Middleware;

use App\Models\Advertisement;
use App\Models\Category;
use App\Models\Comment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        if ($user) {
            $user->loadMissing('roles');
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error'   => fn () => $request->session()->get('error'),
            ],
            'ads' => [
                'activeCount' => fn () => $this->activeAdCount(),
            ],
            'comments' => [
                'pendingCount' => fn () => $this->pendingCommentCount(),
            ],
            'navCategories' => fn () => $this->navCategories(),
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }

    private function activeAdCount(): int
    {
        if (!Schema::hasTable('advertisements')) {
            return 0;
        }

        return Advertisement::query()->active()->count();
    }

    private function pendingCommentCount(): int
    {
        if (!Schema::hasTable('comments')) {
            return 0;
        }

        return Comment::pending()->count();
    }

    private function navCategories(): mixed
    {
        if (!Schema::hasTable('categories')) {
            return [];
        }

        return Cache::remember('nav_categories_tree', 900, function () {
            return Category::query()
                ->where('is_active', true)
                ->whereNull('parent_id')
                ->orderBy('order')
                ->with([
                    'children' => fn ($q) => $q->where('is_active', true)->orderBy('order'),
                    'children.children' => fn ($q) => $q->where('is_active', true)->orderBy('order'),
                    'children.children.children' => fn ($q) => $q->where('is_active', true)->orderBy('order'),
                    'children.children.children.children' => fn ($q) => $q->where('is_active', true)->orderBy('order'),
                ])
                ->get();
        });
    }
}
