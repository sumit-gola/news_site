<?php

use App\Models\Advertisement;
use App\Models\User;
use function Pest\Laravel\actingAs;
use function Pest\Laravel\patch;
use function Pest\Laravel\withoutMiddleware;

beforeEach(function (): void {
    withoutMiddleware();
    /** @var User $user */
    $user = User::factory()->create();

    actingAs($user);
});

it('applies bulk status and pin actions', function (): void {
    $ad = Advertisement::query()->create([
        'title' => 'Bulk Action Ad',
        'slug' => 'bulk-action-ad',
        'ad_type' => 'html',
        'html_code' => '<div>Ad</div>',
        'position' => 'sidebar',
        'pages' => ['home'],
        'priority' => 10,
        'rotation_type' => 'random',
        'status' => 'inactive',
    ]);

    patch('/admin/advertisements/bulk-action', [
        'action' => 'activate',
        'ids' => [$ad->id],
    ])->assertRedirect();

    expect($ad->fresh()->status)->toBe('active');

    patch('/admin/advertisements/bulk-action', [
        'action' => 'pin',
        'ids' => [$ad->id],
    ])->assertRedirect();

    expect((bool) $ad->fresh()->is_pinned)->toBeTrue();
});

it('duplicates advertisements through bulk action', function (): void {
    $ad = Advertisement::query()->create([
        'title' => 'Original Campaign',
        'slug' => 'original-campaign',
        'ad_type' => 'html',
        'html_code' => '<div>Original</div>',
        'position' => 'header',
        'pages' => ['home'],
        'priority' => 20,
        'rotation_type' => 'sequential',
        'status' => 'active',
    ]);

    patch('/admin/advertisements/bulk-action', [
        'action' => 'duplicate',
        'ids' => [$ad->id],
    ])->assertRedirect();

    expect(Advertisement::count())->toBe(2)
        ->and(Advertisement::query()->where('title', 'like', 'Original Campaign (Copy)%')->exists())->toBeTrue();
});
