<?php

namespace Database\Seeders;

use App\Models\AdPerformance;
use App\Models\AdSlot;
use App\Models\Advertisement;
use App\Models\Advertiser;
use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

class AdvertisementSeeder extends Seeder
{
    public function run(): void
    {
        $advertisers = Advertiser::query()->where('is_active', true)->get();
        $slots = AdSlot::query()->where('is_active', true)->get()->keyBy('slug');
        $categoryIds = Category::query()->where('is_active', true)->pluck('id')->all();

        if ($advertisers->isEmpty() || $slots->isEmpty()) {
            $this->command?->warn('AdvertisementSeeder skipped: advertisers or ad slots missing.');
            return;
        }

        $ads = [
            [
                'title' => 'Upgrade Your Team With AI Tools',
                'ad_type' => 'image',
                'image_path' => 'https://picsum.photos/seed/ad-1/970/250',
                'target_url' => 'https://example.com/ai-tools',
                'open_in_new_tab' => true,
                'width' => 970,
                'height' => 250,
                'position' => 'header',
                'pages' => ['home'],
                'slot_slug' => 'home-top-banner',
                'priority' => 10,
                'rotation_type' => 'random',
                'status' => 'active',
                'start_date' => now()->subDays(10),
                'end_date' => now()->addDays(20),
            ],
            [
                'title' => 'Invest Smarter In 2026',
                'ad_type' => 'html',
                'html_code' => '<div style="padding:14px;border:1px solid #e5e7eb;border-radius:8px;font-family:Arial,sans-serif;"><h4 style="margin:0 0 8px;">Market Insights Weekly</h4><p style="margin:0 0 10px;">Get expert portfolio ideas every Monday.</p><a href="https://example.com/invest" target="_blank" rel="noreferrer">Start Free</a></div>',
                'target_url' => 'https://example.com/invest',
                'open_in_new_tab' => true,
                'width' => 300,
                'height' => 250,
                'position' => 'sidebar',
                'pages' => ['article', 'category'],
                'slot_slug' => 'article-sidebar',
                'priority' => 8,
                'rotation_type' => 'sequential',
                'status' => 'active',
                'start_date' => now()->subDays(3),
                'end_date' => now()->addDays(45),
            ],
            [
                'title' => 'Book Your Summer Escape',
                'ad_type' => 'script',
                'script_code' => '<script>document.write("<div style=\\"padding:12px;border:1px dashed #94a3b8;border-radius:8px;font-family:Arial,sans-serif;\\">Travel Deals: Up to 40% OFF</div>");</script>',
                'target_url' => 'https://example.com/travel',
                'open_in_new_tab' => true,
                'width' => 728,
                'height' => 90,
                'position' => 'inline',
                'pages' => ['article'],
                'slot_slug' => 'article-inline',
                'priority' => 6,
                'rotation_type' => 'random',
                'status' => 'active',
                'start_date' => now()->subDays(1),
                'end_date' => now()->addDays(30),
            ],
            [
                'title' => 'Health Checkup Camp',
                'ad_type' => 'image',
                'image_path' => 'https://picsum.photos/seed/ad-4/970/90',
                'target_url' => 'https://example.com/health-camp',
                'open_in_new_tab' => true,
                'width' => 970,
                'height' => 90,
                'position' => 'header',
                'pages' => ['category'],
                'slot_slug' => 'category-header',
                'priority' => 7,
                'rotation_type' => 'sequential',
                'status' => 'active',
                'start_date' => now()->subDays(7),
                'end_date' => now()->addDays(14),
            ],
            [
                'title' => 'Footer Promo: Developer Conference',
                'ad_type' => 'image',
                'image_path' => 'https://picsum.photos/seed/ad-5/970/90',
                'target_url' => 'https://example.com/devconf',
                'open_in_new_tab' => true,
                'width' => 970,
                'height' => 90,
                'position' => 'footer',
                'pages' => ['home', 'article', 'category', 'search'],
                'slot_slug' => 'global-footer',
                'priority' => 5,
                'rotation_type' => 'random',
                'status' => 'paused',
                'start_date' => now()->subDays(15),
                'end_date' => now()->addDays(5),
            ],
        ];

        foreach ($ads as $index => $data) {
            $slot = $slots->get($data['slot_slug']);

            if (!$slot) {
                continue;
            }

            $categorySampleCount = min(2, count($categoryIds));
            $selectedCategoryIds = $categorySampleCount > 0
                ? (array) Arr::random($categoryIds, $categorySampleCount)
                : [];

            $ad = Advertisement::query()->updateOrCreate(
                ['title' => $data['title']],
                [
                    'advertiser_id' => $advertisers[$index % $advertisers->count()]->id,
                    'ad_slot_id' => $slot->id,
                    'title' => $data['title'],
                    'slug' => Str::slug($data['title']),
                    'description' => $data['title'],
                    'ad_type' => $data['ad_type'],
                    'image_url' => $data['image_path'] ?? null,
                    'image_path' => $data['image_path'] ?? null,
                    'video_url' => null,
                    'html_code' => $data['html_code'] ?? null,
                    'script_code' => $data['script_code'] ?? null,
                    'size' => (($data['width'] ?? null) && ($data['height'] ?? null))
                        ? ($data['width'] . 'x' . $data['height'])
                        : 'custom',
                    'custom_width' => $data['width'] ?? null,
                    'custom_height' => $data['height'] ?? null,
                    'redirect_url' => $data['target_url'] ?? null,
                    'target_url' => $data['target_url'] ?? null,
                    'open_in_new_tab' => $data['open_in_new_tab'],
                    'width' => $data['width'] ?? null,
                    'height' => $data['height'] ?? null,
                    'position' => $data['position'],
                    'pages' => $data['pages'],
                    'category_ids' => $selectedCategoryIds,
                    'start_date' => $data['start_date'],
                    'end_date' => $data['end_date'],
                    'daily_limit' => null,
                    'priority' => $data['priority'],
                    'is_responsive' => true,
                    'targeting' => [
                        'pages' => $data['pages'],
                        'category_ids' => $selectedCategoryIds,
                        'position' => $data['position'],
                    ],
                    'rotation_type' => $data['rotation_type'],
                    'status' => $data['status'],
                ],
            );

            $impressions = fake()->numberBetween(1200, 12000);
            $clicks = fake()->numberBetween(30, (int) floor($impressions * 0.12));

            $ad->update([
                'total_impressions' => $impressions,
                'total_clicks' => $clicks,
            ]);

            for ($day = 0; $day < 14; $day++) {
                $dailyImpressions = fake()->numberBetween(40, 700);
                $dailyClicks = fake()->numberBetween(1, (int) floor($dailyImpressions * 0.12));

                AdPerformance::query()->updateOrCreate(
                    [
                        'advertisement_id' => $ad->id,
                        'date' => now()->subDays($day)->toDateString(),
                    ],
                    [
                        'impressions' => $dailyImpressions,
                        'clicks' => $dailyClicks,
                        'ctr' => $dailyImpressions > 0 ? round(($dailyClicks / $dailyImpressions) * 100, 4) : 0,
                    ],
                );
            }
        }

        $this->command?->info('AdvertisementSeeder completed.');
    }
}
