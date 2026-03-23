<?php

namespace Database\Seeders;

use App\Models\AdSlot;
use Illuminate\Database\Seeder;

class AdSlotSeeder extends Seeder
{
    public function run(): void
    {
        $slots = [
            [
                'name' => 'Home Top Banner',
                'slug' => 'home-top-banner',
                'page' => 'home',
                'position' => 'header',
                'location' => 'header',
                'device_type' => 'all',
                'size' => '970x250, 728x90',
                'max_ads' => 1,
                'status' => 'active',
                'allowed_sizes' => ['970x250', '728x90'],
                'description' => 'Top hero area for homepage banner campaigns.',
                'is_active' => true,
            ],
            [
                'name' => 'Article Sidebar',
                'slug' => 'article-sidebar',
                'page' => 'article',
                'position' => 'sidebar',
                'location' => 'sidebar',
                'device_type' => 'all',
                'size' => '300x250, 300x600',
                'max_ads' => 1,
                'status' => 'active',
                'allowed_sizes' => ['300x250', '300x600'],
                'description' => 'Sticky sidebar ad slot on article pages.',
                'is_active' => true,
            ],
            [
                'name' => 'Article Inline',
                'slug' => 'article-inline',
                'page' => 'article',
                'position' => 'inline',
                'location' => 'inline',
                'device_type' => 'all',
                'size' => '728x90, 468x60',
                'max_ads' => 1,
                'status' => 'active',
                'allowed_sizes' => ['728x90', '468x60'],
                'description' => 'Inline ad block shown after paragraph 2.',
                'is_active' => true,
            ],
            [
                'name' => 'Category Header',
                'slug' => 'category-header',
                'page' => 'category',
                'position' => 'header',
                'location' => 'header',
                'device_type' => 'all',
                'size' => '970x90, 728x90',
                'max_ads' => 1,
                'status' => 'active',
                'allowed_sizes' => ['970x90', '728x90'],
                'description' => 'Header ad slot on category listing pages.',
                'is_active' => true,
            ],
            [
                'name' => 'Global Footer',
                'slug' => 'global-footer',
                'page' => null,
                'position' => 'footer',
                'location' => 'footer',
                'device_type' => 'all',
                'size' => '970x90, 728x90',
                'max_ads' => 1,
                'status' => 'active',
                'allowed_sizes' => ['970x90', '728x90'],
                'description' => 'Footer ad slot available site-wide.',
                'is_active' => true,
            ],
        ];

        foreach ($slots as $slot) {
            AdSlot::query()->updateOrCreate(
                ['slug' => $slot['slug']],
                $slot,
            );
        }

        $this->command?->info('AdSlotSeeder completed.');
    }
}
