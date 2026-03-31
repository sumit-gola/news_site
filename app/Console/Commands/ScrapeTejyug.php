<?php

namespace App\Console\Commands;

use App\Models\Article;
use App\Models\Category;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Symfony\Component\DomCrawler\Crawler;

class ScrapeTejyug extends Command
{
    protected $signature = 'scrape:tejyug
                            {--category= : Scrape a specific category slug only}
                            {--user-id= : User ID to assign articles to (defaults to first user)}';

    protected $description = 'Scrape ALL posts from tejyug.com with categories (no page limit)';

    private const BASE_URL = 'https://www.tejyug.com';

    /** All categories: [display name => url slug] */
    private const CATEGORIES = [
        'खबरें हटके'      => 'khabar-hatke',
        'ताज़ा खबर'       => 'taza-khabar',
        'क्राइम'          => 'crime',
        'वीडियो'          => 'videos',
        'राज्य'           => 'rajya',
        'देश'             => 'desh',
        'विदेश'           => 'videsh',
        'खेल'             => 'khel',
        'राजनीति'         => 'rajneeti',
        'मनोरंजन'         => 'manoranjan',
        'साहित्य/लेख'     => 'sahataya',
        'टेक्नोलॉजी'      => 'technology',
        'ब्रेकिंग न्यूज़'  => 'breaking-news',
        'वायरल विडिओ'     => 'viral-video',
        'हेल्थ'           => 'health',
        'एक्सीडेंट'       => 'accident',
        'टॉप न्यूज़'      => 'top-news',
    ];

    private int $userId;
    private int $totalSaved   = 0;
    private int $totalSkipped = 0;
    private int $totalErrors  = 0;

    public function handle(): int
    {
        $this->userId = $this->resolveUserId();
        if (! $this->userId) {
            $this->error('No user found. Please create at least one user before scraping.');
            return self::FAILURE;
        }

        $onlyCat = $this->option('category');

        $categories = $onlyCat
            ? array_filter(self::CATEGORIES, fn($slug) => $slug === $onlyCat)
            : self::CATEGORIES;

        if ($onlyCat && empty($categories)) {
            $this->error("Category '{$onlyCat}' not found. Available: " . implode(', ', self::CATEGORIES));
            return self::FAILURE;
        }

        $this->info("Starting tejyug.com scraper — user_id={$this->userId} | " . count($categories) . " categories | no page limit");
        $this->newLine();

        foreach ($categories as $catName => $catSlug) {
            $this->scrapeCategory($catName, $catSlug);
        }

        $this->newLine();
        $this->info("Done! Saved: {$this->totalSaved} | Skipped: {$this->totalSkipped} | Errors: {$this->totalErrors}");

        return self::SUCCESS;
    }

    // ─── Category scraping ──────────────────────────────────────────────────

    private function scrapeCategory(string $catName, string $catSlug): void
    {
        $this->line("» <fg=cyan>{$catName}</> (/{$catSlug})");

        $category = $this->findOrCreateCategory($catName, $catSlug);

        $page        = 1;
        $catSaved    = 0;
        $catSkipped  = 0;

        while (true) {
            $url  = self::BASE_URL . '/' . $catSlug . '?page=' . $page;
            $html = $this->fetch($url);

            if (! $html) {
                $this->warn("  Page {$page}: failed to fetch — stopping.");
                break;
            }

            $articleUrls = $this->extractArticleUrls($html);

            if (empty($articleUrls)) {
                $this->line("  Page {$page}: no more articles — done with this category.");
                break;
            }

            $this->line("  Page {$page}: " . count($articleUrls) . " articles (saved:{$catSaved} skipped:{$catSkipped})");

            foreach ($articleUrls as $articleUrl) {
                $result = $this->scrapeArticle($articleUrl, $category);
                if ($result === 'saved')   { $catSaved++;   $this->totalSaved++; }
                if ($result === 'skipped') { $catSkipped++; $this->totalSkipped++; }
                if ($result === 'error')   { $this->totalErrors++; }
                usleep(200_000); // 0.2s between articles
            }

            $page++;
            usleep(400_000); // 0.4s between pages
        }

        $this->line("  Category done: saved={$catSaved} skipped={$catSkipped}");
        $this->newLine();
    }

    // ─── Article scraping ───────────────────────────────────────────────────

    private function scrapeArticle(string $url, Category $category): string
    {
        $urlSlug = $this->slugFromUrl($url);

        if (Article::where('slug', $urlSlug)->exists()) {
            $this->line("    <fg=yellow>SKIP</> {$urlSlug}");
            return 'skipped';
        }

        $html = $this->fetch($url);
        if (! $html) {
            $this->warn("    <fg=red>FAIL</> {$url}");
            return 'error';
        }

        try {
            $data = $this->parseArticle($html);
        } catch (\Throwable $e) {
            $this->warn("    <fg=red>PARSE</> {$url}: " . $e->getMessage());
            return 'error';
        }

        if (empty($data['title']) || empty($data['content'])) {
            $this->warn("    <fg=red>EMPTY</> {$url}");
            return 'error';
        }

        try {
            $article = Article::create([
                'user_id'        => $this->userId,
                'title'          => $data['title'],
                'slug'           => $urlSlug,
                'content'        => $data['content'],
                'excerpt'        => $data['excerpt'],
                'featured_image' => $data['featured_image'],
                'thumbnail'      => $data['featured_image'],
                'status'         => 'published',
                'published_at'   => $data['published_at'],
            ]);

            $article->categories()->syncWithoutDetaching([$category->id]);

            $this->line("    <fg=green>SAVED</> " . Str::limit($data['title'], 70));
            return 'saved';
        } catch (\Throwable $e) {
            $this->warn("    <fg=red>DB</> {$url}: " . $e->getMessage());
            return 'error';
        }
    }

    // ─── HTML Parsing ────────────────────────────────────────────────────────

    private function extractArticleUrls(string $html): array
    {
        preg_match_all(
            '#href="(https://www\.tejyug\.com/[^"]+/detail)"#',
            $html,
            $matches
        );
        return array_unique($matches[1] ?? []);
    }

    private function parseArticle(string $html): array
    {
        $crawler = new Crawler($html);

        // Title
        $title = '';
        try { $title = trim($crawler->filter('.news-details-layout1 h2')->first()->text('')); } catch (\Throwable) {}
        if (empty($title)) {
            try { $title = trim($crawler->filter('.breadcrumbs-content h1')->first()->text('')); } catch (\Throwable) {}
        }

        // Featured image
        $featuredImage = null;
        try {
            $featuredImage = $crawler->filter('.news-details-layout1 .position-relative img')->first()->attr('src');
        } catch (\Throwable) {}

        // Content
        $content = '';
        try { $content = trim($crawler->filter('.post-content')->first()->html('')); } catch (\Throwable) {}

        // Excerpt
        $excerpt = $content ? Str::limit(strip_tags($content), 300) : '';

        // Published date
        $publishedAt = now();
        try {
            $metaDate    = $crawler->filterXPath('//meta[@property="article:published_time"]')->attr('content');
            $publishedAt = \Carbon\Carbon::parse($metaDate);
        } catch (\Throwable) {}

        return compact('title', 'content', 'excerpt', 'featuredImage', 'publishedAt') + [
            'featured_image' => $featuredImage,
            'published_at'   => $publishedAt,
        ];
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private function slugFromUrl(string $url): string
    {
        // https://www.tejyug.com/some-slug/detail → some-slug
        if (preg_match('#tejyug\.com/([^/]+)/detail#', $url, $m)) {
            return $m[1];
        }
        return basename(dirname($url));
    }

    private function findOrCreateCategory(string $name, string $slug): Category
    {
        return Category::firstOrCreate(
            ['slug' => $slug],
            ['name' => $name, 'slug' => $slug, 'is_active' => true, 'order' => 0]
        );
    }

    private function resolveUserId(): int
    {
        if ($uid = $this->option('user-id')) return (int) $uid;
        return User::first()?->id ?? 0;
    }

    private function fetch(string $url): ?string
    {
        try {
            $response = Http::timeout(20)
                ->withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (compatible; NewsPortalBot/1.0)',
                    'Accept'     => 'text/html,application/xhtml+xml',
                ])
                ->get($url);

            return $response->successful() ? $response->body() : null;
        } catch (\Throwable) {
            return null;
        }
    }
}
