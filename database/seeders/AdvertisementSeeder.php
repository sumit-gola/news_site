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

        $allPages = ['home', 'article', 'category', 'search', 'news', 'tag', 'page'];

        // Build one "Advertise Here" ad per position (18 total)
        $positions = [
            ['position' => 'header',              'slug' => 'header-banner',         'w' => 970, 'h' => 250, 'label' => 'Header Banner'],
            ['position' => 'sidebar',             'slug' => 'sidebar-ad',            'w' => 300, 'h' => 250, 'label' => 'Sidebar'],
            ['position' => 'inline',              'slug' => 'inline-ad',             'w' => 728, 'h' => 90,  'label' => 'Inline'],
            ['position' => 'footer',              'slug' => 'footer-banner',         'w' => 970, 'h' => 90,  'label' => 'Footer'],
            ['position' => 'popup',               'slug' => 'popup-ad',              'w' => 400, 'h' => 300, 'label' => 'Popup'],
            ['position' => 'below_nav',           'slug' => 'below-nav',             'w' => 970, 'h' => 90,  'label' => 'Below Nav'],
            ['position' => 'left_sidebar_top',    'slug' => 'left-sidebar-top',      'w' => 160, 'h' => 600, 'label' => 'Left Sidebar Top'],
            ['position' => 'left_sidebar_bottom', 'slug' => 'left-sidebar-bottom',   'w' => 160, 'h' => 600, 'label' => 'Left Sidebar Bottom'],
            ['position' => 'right_sidebar_top',   'slug' => 'right-sidebar-top',     'w' => 300, 'h' => 250, 'label' => 'Right Sidebar Top'],
            ['position' => 'right_sidebar_bottom','slug' => 'right-sidebar-bottom',  'w' => 300, 'h' => 250, 'label' => 'Right Sidebar Bottom'],
            ['position' => 'in_article',          'slug' => 'in-article',            'w' => 728, 'h' => 90,  'label' => 'In Article'],
            ['position' => 'between_articles',    'slug' => 'between-articles',      'w' => 728, 'h' => 90,  'label' => 'Between Articles'],
            ['position' => 'sticky_top',          'slug' => 'sticky-top',            'w' => 970, 'h' => 90,  'label' => 'Sticky Top'],
            ['position' => 'sticky_bottom',       'slug' => 'sticky-bottom',         'w' => 970, 'h' => 90,  'label' => 'Sticky Bottom'],
            ['position' => 'floating_bottom_right','slug' => 'floating-bottom-right','w' => 300, 'h' => 250, 'label' => 'Floating Bottom Right'],
            ['position' => 'floating_bottom_left','slug' => 'floating-bottom-left',  'w' => 300, 'h' => 250, 'label' => 'Floating Bottom Left'],
            ['position' => 'full_screen_overlay', 'slug' => 'full-screen-overlay',   'w' => 640, 'h' => 480, 'label' => 'Full Screen Overlay'],
            ['position' => 'notification_bar',    'slug' => 'notification-bar',      'w' => 970, 'h' => 60,  'label' => 'Notification Bar'],
        ];

        $count = 0;
        foreach ($positions as $index => $p) {
            $slot = $slots->get($p['slug']);
            if (!$slot) {
                $this->command?->warn("Slot '{$p['slug']}' not found — skipping {$p['label']}.");
                continue;
            }

            $title = "Advertise Here — {$p['label']} ({$p['w']}×{$p['h']})";
            $bg = $this->colorForIndex($index);

            $html = '<div style="'
                . "width:100%;height:{$p['h']}px;max-width:{$p['w']}px;"
                . "background:{$bg};display:flex;flex-direction:column;align-items:center;justify-content:center;"
                . 'border:2px dashed rgba(255,255,255,0.5);border-radius:8px;font-family:Arial,sans-serif;color:#fff;text-align:center;'
                . '">'
                . '<span style="font-size:22px;font-weight:900;letter-spacing:1px;">ADVERTISE HERE</span>'
                . "<span style=\"font-size:12px;margin-top:6px;opacity:0.85;\">{$p['label']} · {$p['w']}×{$p['h']}</span>"
                . '</div>';

            $categorySample = min(2, count($categoryIds));
            $selectedCats = $categorySample > 0 ? (array) Arr::random($categoryIds, $categorySample) : [];

            $ad = Advertisement::withTrashed()->updateOrCreate(
                ['slug' => Str::slug($title)],
                [
                    'advertiser_id' => $advertisers[$index % $advertisers->count()]->id,
                    'ad_slot_id' => $slot->id,
                    'title' => $title,
                    'slug' => Str::slug($title),
                    'description' => "Placeholder ad for the {$p['label']} position.",
                    'ad_type' => 'html',
                    'image_url' => null,
                    'image_path' => null,
                    'video_url' => null,
                    'html_code' => $html,
                    'script_code' => null,
                    'size' => "{$p['w']}x{$p['h']}",
                    'custom_width' => $p['w'],
                    'custom_height' => $p['h'],
                    'redirect_url' => 'https://example.com/advertise',
                    'target_url' => 'https://example.com/advertise',
                    'open_in_new_tab' => true,
                    'width' => $p['w'],
                    'height' => $p['h'],
                    'position' => $p['position'],
                    'pages' => $allPages,
                    'category_ids' => $selectedCats,
                    'start_date' => now()->subDays(5),
                    'end_date' => now()->addYear(),
                    'daily_limit' => null,
                    'priority' => 10,
                    'is_responsive' => true,
                    'targeting' => [
                        'pages' => $allPages,
                        'category_ids' => $selectedCats,
                        'position' => $p['position'],
                    ],
                    'rotation_type' => 'random',
                    'status' => 'active',
                    'display_behavior' => 'standard',
                    'display_config' => [],
                    'is_closable' => false,
                    'close_button_delay_seconds' => 0,
                    'schedule_rules' => [],
                    'max_total_impressions' => null,
                    'max_daily_impressions' => null,
                    'url_patterns' => [],
                    'exclude_rules' => [],
                    'deleted_at' => null,
                ],
            );

            // Seed some performance data
            $impressions = fake()->numberBetween(500, 5000);
            $clicks = fake()->numberBetween(10, (int) floor($impressions * 0.08));
            $ad->update(['total_impressions' => $impressions, 'total_clicks' => $clicks]);

            for ($day = 0; $day < 7; $day++) {
                $di = fake()->numberBetween(30, 400);
                $dc = fake()->numberBetween(1, (int) max(1, floor($di * 0.08)));
                AdPerformance::query()->updateOrCreate(
                    ['advertisement_id' => $ad->id, 'date' => now()->subDays($day)->toDateString()],
                    ['impressions' => $di, 'clicks' => $dc, 'ctr' => $di > 0 ? round(($dc / $di) * 100, 4) : 0],
                );
            }

            $count++;
        }

        $this->command?->info("AdvertisementSeeder completed — {$count} 'Advertise Here' ads seeded (all 18 positions).");
    }

    private function colorForIndex(int $i): string
    {
        $palette = [
            '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
            '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
            '#a855f7', '#f43f5e', '#d946ef', '#0ea5e9', '#84cc16',
            '#f59e0b', '#10b981', '#6d28d9',
        ];

        return $palette[$i % count($palette)];
    }
}
