<?php

namespace Database\Seeders;

use App\Models\AdSlot;
use Illuminate\Database\Seeder;

class AdSlotSeeder extends Seeder
{
    public function run(): void
    {
        $slots = [
            // 1. header
            ['name' => 'Header Banner', 'slug' => 'header-banner', 'position' => 'header', 'size' => '970x250, 728x90', 'allowed_sizes' => ['970x250', '728x90'], 'description' => 'Top banner across the full width of the page.'],
            // 2. sidebar
            ['name' => 'Sidebar Ad', 'slug' => 'sidebar-ad', 'position' => 'sidebar', 'size' => '300x250, 300x600', 'allowed_sizes' => ['300x250', '300x600'], 'description' => 'Standard sidebar ad unit.'],
            // 3. inline
            ['name' => 'Inline Ad', 'slug' => 'inline-ad', 'position' => 'inline', 'size' => '728x90, 468x60', 'allowed_sizes' => ['728x90', '468x60'], 'description' => 'Inline ad between content blocks.'],
            // 4. footer
            ['name' => 'Footer Banner', 'slug' => 'footer-banner', 'position' => 'footer', 'size' => '970x90, 728x90', 'allowed_sizes' => ['970x90', '728x90'], 'description' => 'Footer ad slot available site-wide.'],
            // 5. popup
            ['name' => 'Popup Ad', 'slug' => 'popup-ad', 'position' => 'popup', 'size' => '400x300', 'allowed_sizes' => ['400x300', '500x400'], 'description' => 'Popup modal ad overlay.'],
            // 6. below_nav
            ['name' => 'Below Navigation', 'slug' => 'below-nav', 'position' => 'below_nav', 'size' => '970x90, 728x90', 'allowed_sizes' => ['970x90', '728x90'], 'description' => 'Slim banner right below the navigation bar.'],
            // 7. left_sidebar_top
            ['name' => 'Left Sidebar Top', 'slug' => 'left-sidebar-top', 'position' => 'left_sidebar_top', 'size' => '160x600, 120x600', 'allowed_sizes' => ['160x600', '120x600'], 'description' => 'Top of the left sidebar.'],
            // 8. left_sidebar_bottom
            ['name' => 'Left Sidebar Bottom', 'slug' => 'left-sidebar-bottom', 'position' => 'left_sidebar_bottom', 'size' => '160x600, 120x600', 'allowed_sizes' => ['160x600', '120x600'], 'description' => 'Bottom of the left sidebar.'],
            // 9. right_sidebar_top
            ['name' => 'Right Sidebar Top', 'slug' => 'right-sidebar-top', 'position' => 'right_sidebar_top', 'size' => '300x250, 300x600', 'allowed_sizes' => ['300x250', '300x600'], 'description' => 'Top of the right sidebar.'],
            // 10. right_sidebar_bottom
            ['name' => 'Right Sidebar Bottom', 'slug' => 'right-sidebar-bottom', 'position' => 'right_sidebar_bottom', 'size' => '300x250', 'allowed_sizes' => ['300x250'], 'description' => 'Bottom of the right sidebar.'],
            // 11. in_article
            ['name' => 'In Article', 'slug' => 'in-article', 'position' => 'in_article', 'size' => '728x90, 468x60', 'allowed_sizes' => ['728x90', '468x60'], 'description' => 'Ad inserted within article body content.'],
            // 12. between_articles
            ['name' => 'Between Articles', 'slug' => 'between-articles', 'position' => 'between_articles', 'size' => '728x90', 'allowed_sizes' => ['728x90'], 'description' => 'Ad shown between article cards in feed lists.'],
            // 13. sticky_top
            ['name' => 'Sticky Top Bar', 'slug' => 'sticky-top', 'position' => 'sticky_top', 'size' => '970x90, 728x90', 'allowed_sizes' => ['970x90', '728x90'], 'description' => 'Sticky banner fixed at the top of the viewport.'],
            // 14. sticky_bottom
            ['name' => 'Sticky Bottom Bar', 'slug' => 'sticky-bottom', 'position' => 'sticky_bottom', 'size' => '970x90, 728x90', 'allowed_sizes' => ['970x90', '728x90'], 'description' => 'Sticky banner fixed at the bottom of the viewport.'],
            // 15. floating_bottom_right
            ['name' => 'Floating Bottom Right', 'slug' => 'floating-bottom-right', 'position' => 'floating_bottom_right', 'size' => '300x250', 'allowed_sizes' => ['300x250'], 'description' => 'Floating corner ad on the bottom right.'],
            // 16. floating_bottom_left
            ['name' => 'Floating Bottom Left', 'slug' => 'floating-bottom-left', 'position' => 'floating_bottom_left', 'size' => '300x250', 'allowed_sizes' => ['300x250'], 'description' => 'Floating corner ad on the bottom left.'],
            // 17. full_screen_overlay
            ['name' => 'Full Screen Overlay', 'slug' => 'full-screen-overlay', 'position' => 'full_screen_overlay', 'size' => '640x480, 800x600', 'allowed_sizes' => ['640x480', '800x600'], 'description' => 'Full-screen overlay / interstitial ad.'],
            // 18. notification_bar
            ['name' => 'Notification Bar', 'slug' => 'notification-bar', 'position' => 'notification_bar', 'size' => '970x60', 'allowed_sizes' => ['970x60'], 'description' => 'Slim notification-style bar.'],
        ];

        foreach ($slots as $slot) {
            AdSlot::query()->updateOrCreate(
                ['slug' => $slot['slug']],
                array_merge($slot, [
                    'page' => null,
                    'location' => $slot['position'],
                    'device_type' => 'all',
                    'max_ads' => 1,
                    'status' => 'active',
                    'is_active' => true,
                ]),
            );
        }

        $this->command?->info('AdSlotSeeder completed — ' . count($slots) . ' slots (all 18 positions).');
    }
}
