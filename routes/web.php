<?php

use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\ArticleController;
use App\Http\Controllers\MediaController;
use Illuminate\Support\Facades\Route;
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

    // Article publishing (Admin can publish directly)
    Route::post('articles/{article}/publish', [ArticleController::class, 'publish'])->name('articles.publish');
});

// ── Authenticated Routes (Reporters, Managers, Admins) ──────────────────────────
Route::middleware(['auth', 'verified'])->group(function () {

    // ── Articles CRUD ──
    Route::get('articles', [ArticleController::class, 'index'])->name('articles.index');
    Route::get('articles/create', [ArticleController::class, 'create'])->name('articles.create');
    Route::post('articles', [ArticleController::class, 'store'])->name('articles.store');
    Route::get('articles/{article}', [ArticleController::class, 'show'])->name('articles.show');
    Route::get('articles/{article}/edit', [ArticleController::class, 'edit'])->name('articles.edit');
    Route::put('articles/{article}', [ArticleController::class, 'update'])->name('articles.update');
    Route::delete('articles/{article}', [ArticleController::class, 'destroy'])->name('articles.destroy');

    // ── Article Workflow ──
    Route::post('articles/{article}/submit', [ArticleController::class, 'submit'])->name('articles.submit');
    Route::post('articles/{article}/approve', [ArticleController::class, 'approve'])->name('articles.approve');
    Route::post('articles/{article}/reject', [ArticleController::class, 'reject'])->name('articles.reject');

    // ── Media Management ──
    Route::get('media', [MediaController::class, 'index'])->name('media.index');
    Route::post('media', [MediaController::class, 'store'])->name('media.store');
    Route::get('media/{media}', [MediaController::class, 'show'])->name('media.show');
    Route::put('media/{media}', [MediaController::class, 'update'])->name('media.update');
    Route::delete('media/{media}', [MediaController::class, 'destroy'])->name('media.destroy');
    Route::delete('media', [MediaController::class, 'destroyMultiple'])->name('media.bulk-destroy');
});

// ── Manager Routes (Dashboard) ────────────────────────────────────────────────────
Route::middleware(['auth', 'verified', 'role:admin,manager'])->group(function () {
    Route::inertia('manager/dashboard', 'manager/Dashboard')->name('manager.dashboard');
});

// ── Reporter Routes (Dashboard) ───────────────────────────────────────────────────
Route::middleware(['auth', 'verified', 'role:admin,manager,reporter'])->group(function () {
    Route::inertia('reporter/dashboard', 'reporter/Dashboard')->name('reporter.dashboard');
});

// ── Public Article Routes ────────────────────────────────────────────────────────
Route::get('articles/{article:slug}', [ArticleController::class, 'show'])->name('public.article.show');

require __DIR__.'/settings.php';
