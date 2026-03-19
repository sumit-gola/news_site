<?php

use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\CategoryController;
use App\Models\Category;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
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
});

// ── Manager Dashboard ─────────────────────────────────────────────────────────
Route::middleware(['auth', 'verified', 'role:admin,manager'])->group(function () {
    Route::get('manager/dashboard', function () {
        return Inertia::render('manager/dashboard', [
            'stats' => [
                'total_categories'  => Category::count(),
                'active_categories' => Category::where('is_active', true)->count(),
            ],
        ]);
    })->name('manager.dashboard');
});

// ── Reporter Dashboard ────────────────────────────────────────────────────────
Route::middleware(['auth', 'verified', 'role:admin,manager,reporter'])->group(function () {
    Route::get('reporter/dashboard', function () {
        return Inertia::render('reporter/dashboard', [
            'stats' => [
                'total_categories' => Category::where('is_active', true)->count(),
            ],
        ]);
    })->name('reporter.dashboard');
});

// ── Public Category Routes ────────────────────────────────────────────────────
Route::get('category/{category:slug}', [CategoryController::class, 'show_public'])->name('public.category.show');

require __DIR__.'/settings.php';
