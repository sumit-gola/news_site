<?php

use App\Http\Controllers\PublicController;
use Illuminate\Support\Facades\Route;

// ── Public Frontend Routes ────────────────────────────────────────────────────

Route::get('/', [PublicController::class, 'home'])->name('home');
Route::get('/news', [PublicController::class, 'news'])->name('news.index');
Route::get('/news/{article:slug}', [PublicController::class, 'show'])->name('news.show');
Route::get('/category/{category:slug}', [PublicController::class, 'category'])->name('public.category.show');
Route::get('/search', [PublicController::class, 'search'])->name('public.search');
