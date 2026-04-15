<?php

use App\Http\Controllers\CommentController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\PublicController;
use Illuminate\Support\Facades\Route;

// ── Public Frontend Routes ────────────────────────────────────────────────────

Route::get('/', [PublicController::class, 'home'])->name('home');
Route::get('/news', [PublicController::class, 'news'])->name('news.index');
Route::get('/news/{article:slug}', [PublicController::class, 'show'])->name('news.show');
Route::get('/category/{category:slug}', [PublicController::class, 'category'])->name('public.category.show');
Route::get('/tag/{tag:slug}', [PublicController::class, 'tag'])->name('public.tag.show');
Route::get('/author/{authorSlug}', [PublicController::class, 'author'])->name('public.author.show');
Route::get('/search', [PublicController::class, 'search'])->name('public.search');

// ── Comments ──────────────────────────────────────────────────────────────────
Route::post('/news/{article:slug}/comments', [CommentController::class, 'store'])->name('comments.store');
Route::delete('/comments/{comment}', [CommentController::class, 'destroy'])->middleware(['auth'])->name('comments.destroy');

// ── CMS Dynamic Pages ─────────────────────────────────────────────────────────
Route::get('/page/{page:slug}', [PageController::class, 'showPublic'])->name('public.page.show');

Route::get('/about-us', [PublicController::class, 'staticPage'])->defaults('slug', 'about-us')->name('public.about');
Route::get('/contact-us', [PublicController::class, 'staticPage'])->defaults('slug', 'contact-us')->name('public.contact');
Route::get('/privacy-policy', [PublicController::class, 'staticPage'])->defaults('slug', 'privacy-policy')->name('public.privacy');
Route::get('/terms-and-conditions', [PublicController::class, 'staticPage'])->defaults('slug', 'terms-and-conditions')->name('public.terms');
