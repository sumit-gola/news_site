<?php

use App\Models\Advertisement;
use function Pest\Laravel\getJson;
use function Pest\Laravel\post;
use function Pest\Laravel\withoutMiddleware;

beforeEach(function (): void {
    withoutMiddleware();
});

it('matches ads using advanced targeting filters', function (): void {
    Advertisement::query()->create([
        'title' => 'Mobile Sports India',
        'slug' => 'mobile-sports-india',
        'ad_type' => 'html',
        'html_code' => '<div>Targeted</div>',
        'position' => 'sidebar',
        'pages' => ['home'],
        'priority' => 50,
        'rotation_type' => 'random',
        'status' => 'active',
        'workflow_status' => 'approved',
        'device_targets' => ['mobile'],
        'geo_countries' => ['IN'],
        'audience_tags' => ['sports'],
    ]);

    $response = getJson('/api/ad-slots?position=sidebar&page=home&country=IN&audience_tags=sports', [
        'User-Agent' => 'iPhone Mobile',
    ]);

    $response->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.title', 'Mobile Sports India');
});

it('falls back to fallback ad when frequency cap blocks primary ad', function (): void {
    $primary = Advertisement::query()->create([
        'title' => 'Capped Primary',
        'slug' => 'capped-primary',
        'ad_type' => 'html',
        'html_code' => '<div>Primary</div>',
        'position' => 'sidebar',
        'pages' => ['home'],
        'priority' => 99,
        'rotation_type' => 'random',
        'status' => 'active',
        'workflow_status' => 'approved',
        'frequency_cap_type' => 'session',
        'frequency_cap_value' => 1,
    ]);

    Advertisement::query()->create([
        'title' => 'Fallback Creative',
        'slug' => 'fallback-creative',
        'ad_type' => 'html',
        'html_code' => '<div>Fallback</div>',
        'position' => 'sidebar',
        'pages' => ['home'],
        'priority' => 1,
        'rotation_type' => 'random',
        'status' => 'active',
        'workflow_status' => 'approved',
        'is_fallback' => true,
    ]);

    post('/api/ad-slots/' . $primary->id . '/impression', [
        'page' => 'home',
        'position' => 'sidebar',
        'session_id' => 'session-1',
    ])->assertOk();

    $response = getJson('/api/ad-slots?position=sidebar&page=home&session_id=session-1');

    $response->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.title', 'Fallback Creative');
});
