<?php

namespace Database\Seeders;

use App\Models\Article;
use App\Models\ArticleMeta;
use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class HindiNewsSeeder extends Seeder
{
    private const SITEMAP_URL = 'https://www.tejyug.com/sitemap.xml';
    private const BASE_URL    = 'https://tejyug.com';
    private const TARGET      = 100;

    /** Hindi category name → seed config */
    private array $categoryMap = [
        'राज्य'         => ['name' => 'राज्य (State)',         'color' => '#3b82f6', 'order' => 10],
        'राजनीति'       => ['name' => 'राजनीति (Politics)',    'color' => '#ef4444', 'order' => 11],
        'अपराध'         => ['name' => 'अपराध (Crime)',         'color' => '#dc2626', 'order' => 12],
        'खेल'           => ['name' => 'खेल (Sports)',          'color' => '#f59e0b', 'order' => 13],
        'मनोरंजन'       => ['name' => 'मनोरंजन (Entertainment)', 'color' => '#f97316', 'order' => 14],
        'स्वास्थ्य'     => ['name' => 'स्वास्थ्य (Health)',    'color' => '#ec4899', 'order' => 15],
        'तकनीक'         => ['name' => 'तकनीक (Technology)',    'color' => '#8b5cf6', 'order' => 16],
        'व्यापार'       => ['name' => 'व्यापार (Business)',    'color' => '#10b981', 'order' => 17],
        'अंतर्राष्ट्रीय' => ['name' => 'अंतर्राष्ट्रीय (World)', 'color' => '#06b6d4', 'order' => 18],
        'खबरें हटके'    => ['name' => 'खबरें हटके (Unusual)',  'color' => '#6366f1', 'order' => 19],
        'ताज़ा खबर'     => ['name' => 'ताज़ा खबर (Latest)',    'color' => '#22c55e', 'order' => 20],
        'शिक्षा'        => ['name' => 'शिक्षा (Education)',    'color' => '#eab308', 'order' => 21],
        'धर्म'          => ['name' => 'धर्म (Religion)',       'color' => '#f59e0b', 'order' => 22],
        'वायरल'         => ['name' => 'वायरल (Viral)',         'color' => '#ec4899', 'order' => 23],
    ];

    public function run(): void
    {
        // Count only Hindi articles already seeded from tejyug.com
        $alreadySeeded = \App\Models\ArticleMeta::query()
            ->where('canonical_url', 'like', '%tejyug.com%')
            ->count();

        if ($alreadySeeded >= self::TARGET) {
            $this->command?->info("HindiNewsSeeder skipped: {$alreadySeeded} Hindi articles already seeded.");
            return;
        }

        $author = User::query()->where('status', 'active')->first();
        if (! $author) {
            $this->command?->warn('No active user found. Run RolesAndPermissionsSeeder first.');
            return;
        }

        $articleUrls = $this->fetchArticleUrls();
        if (empty($articleUrls)) {
            $this->command?->error('Could not fetch sitemap from tejyug.com.');
            return;
        }

        $this->command?->info('Found ' . count($articleUrls) . ' article URLs. Fetching up to ' . self::TARGET . ' articles…');

        // Skip URLs already imported
        $importedUrls = \App\Models\ArticleMeta::query()
            ->where('canonical_url', 'like', '%tejyug.com%')
            ->pluck('canonical_url')
            ->flip()
            ->all();

        $needed   = self::TARGET - $alreadySeeded;
        $seeded   = 0;
        $skipped  = 0;

        foreach (array_slice($articleUrls, 0, min(200, count($articleUrls))) as $url) {
            if ($seeded >= $needed) {
                break;
            }

            // Skip already-imported URLs
            if (isset($importedUrls[$url])) {
                $skipped++;
                continue;
            }

            $data = $this->fetchArticle($url);
            if (! $data) {
                $skipped++;
                continue;
            }

            // Skip duplicates by title
            if (Article::query()->where('title', $data['title'])->exists()) {
                $skipped++;
                continue;
            }

            $category = $this->resolveCategory($data['category']);

            $article = Article::create([
                'user_id'        => $author->id,
                'title'          => $data['title'],
                'slug'           => $this->uniqueSlug($data['title']),
                'excerpt'        => $data['excerpt'],
                'content'        => $data['content'],
                'featured_image' => $data['image'],
                'status'         => 'published',
                'published_at'   => $data['published_at'],
                'views'          => rand(50, 5000),
            ]);

            $wordCount = str_word_count(strip_tags($data['content']));

            ArticleMeta::create([
                'article_id'       => $article->id,
                'meta_title'       => Str::limit($data['title'], 60, ''),
                'meta_description' => $data['excerpt'],
                'meta_keywords'    => null,
                'og_image'         => $data['image'],
                'canonical_url'    => $url,
                'read_time'        => max(1, (int) ceil($wordCount / 200)),
                'word_count'       => $wordCount,
            ]);

            if ($category) {
                $article->categories()->sync([$category->id]);
            }

            $seeded++;

            if ($seeded % 10 === 0) {
                $this->command?->info("  Seeded {$seeded}/{$needed} articles…");
            }

            // Polite delay to avoid hammering the server
            usleep(300_000);
        }

        $this->command?->info("HindiNewsSeeder done: {$seeded} article(s) created, {$skipped} skipped.");
    }

    // -------------------------------------------------------------------------

    /** Fetch article URLs from the sitemap. */
    private function fetchArticleUrls(): array
    {
        try {
            $response = Http::timeout(30)
                ->withHeaders(['User-Agent' => 'Mozilla/5.0 (compatible; NewsSeeder/1.0)'])
                ->get(self::SITEMAP_URL);

            if (! $response->successful()) {
                return [];
            }

            preg_match_all('/<loc>(https?:\/\/[^<]+\/detail)<\/loc>/', $response->body(), $matches);
            return $matches[1] ?? [];
        } catch (\Throwable) {
            return [];
        }
    }

    /** Fetch and parse a single article page. Returns null on failure. */
    private function fetchArticle(string $url): ?array
    {
        try {
            $response = Http::timeout(20)
                ->withHeaders(['User-Agent' => 'Mozilla/5.0 (compatible; NewsSeeder/1.0)'])
                ->get($url);

            if (! $response->successful()) {
                return null;
            }

            $html = $response->body();
            return $this->parseArticle($html, $url);
        } catch (\Throwable) {
            return null;
        }
    }

    /** Parse HTML and extract article fields. */
    private function parseArticle(string $html, string $url): ?array
    {
        // Title
        preg_match('/<h1[^>]*>(.*?)<\/h1>/is', $html, $m);
        $title = $m[1] ?? '';
        $title = strip_tags($title);
        $title = html_entity_decode($title, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $title = trim($title);

        if (empty($title)) {
            return null;
        }

        // Category
        preg_match('/<span[^>]*class=["\']news-category["\'][^>]*>(.*?)<\/span>/is', $html, $m);
        $category = strip_tags($m[1] ?? '');
        $category = html_entity_decode(trim($category), ENT_QUOTES | ENT_HTML5, 'UTF-8');

        // Featured image
        preg_match('/src=["\']https?:\/\/tejyug\.com\/public\/storage\/posts\/([^\s"\']+)["\']/', $html, $m);
        $image = $m ? (self::BASE_URL . '/public/storage/posts/' . ($m[1] ?? '')) : null;
        if ($image && str_ends_with($image, '/')) {
            $image = null;
        }

        // Content: between post-content div and author-info div
        $contentStart = strpos($html, '<div class="post-content">');
        $contentEnd   = strpos($html, '<div class="author-info', (int) $contentStart);

        if ($contentStart !== false && $contentEnd !== false) {
            $rawContent = substr($html, $contentStart + strlen('<div class="post-content">'), $contentEnd - $contentStart - strlen('<div class="post-content">'));
        } elseif ($contentStart !== false) {
            $rawContent = substr($html, $contentStart + strlen('<div class="post-content">'), 8000);
        } else {
            $rawContent = '';
        }

        // Strip base64 images (they bloat the content massively)
        $rawContent = preg_replace('/<img[^>]*src=["\']data:image[^"\']*["\'][^>]*>/i', '', $rawContent);

        // Strip script/style
        $rawContent = preg_replace('/<(script|style)[^>]*>.*?<\/\1>/is', '', $rawContent);
        $rawContent = trim($rawContent);

        if (empty(strip_tags($rawContent))) {
            return null;
        }

        // Excerpt: first ~200 chars of plain text
        $plain   = html_entity_decode(strip_tags($rawContent), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $plain   = preg_replace('/\s+/', ' ', $plain);
        $excerpt = mb_substr(trim($plain), 0, 200, 'UTF-8');

        // Published date: look for "DD Mon YYYY" near the top of page
        preg_match('/(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+\d{4})/i', $html, $m);
        $publishedAt = null;
        if (! empty($m[1])) {
            try {
                $publishedAt = \Carbon\Carbon::parse($m[1]);
            } catch (\Throwable) {
                // ignore
            }
        }
        $publishedAt ??= now()->subDays(rand(1, 180));

        return [
            'title'        => $title,
            'category'     => $category,
            'image'        => $image,
            'content'      => $rawContent,
            'excerpt'      => $excerpt,
            'published_at' => $publishedAt,
        ];
    }

    /** Resolve or create a category record. */
    private function resolveCategory(string $hindiName): ?Category
    {
        if (empty($hindiName)) {
            return null;
        }

        $config = $this->categoryMap[$hindiName] ?? [
            'name'  => $hindiName,
            'color' => '#6366f1',
            'order' => 30,
        ];

        $slug = Str::slug($config['name']);
        if (empty($slug)) {
            $slug = 'cat-' . abs(crc32($hindiName));
        }

        return Category::firstOrCreate(
            ['slug' => $slug],
            [
                'name'        => $config['name'],
                'description' => 'Hindi news: ' . $hindiName,
                'color'       => $config['color'],
                'order'       => $config['order'],
                'is_active'   => true,
            ]
        );
    }

    /** Generate a unique slug for an article title. */
    private function uniqueSlug(string $title): string
    {
        $base = Str::slug($title);
        if (empty($base)) {
            $base = 'article-' . uniqid();
        }

        $slug    = $base;
        $counter = 1;
        while (Article::query()->where('slug', $slug)->exists()) {
            $slug = "{$base}-{$counter}";
            $counter++;
        }

        return $slug;
    }
}
