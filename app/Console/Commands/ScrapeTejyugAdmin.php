<?php

namespace App\Console\Commands;

use App\Models\Article;
use App\Models\Category;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Symfony\Component\DomCrawler\Crawler;

class ScrapeTejyugAdmin extends Command
{
    protected $signature = 'scrape:tejyug-admin
                            {--user-id= : User ID to assign articles to (defaults to first user)}
                            {--start-page=1 : Start from this page number}
                            {--end-page=0 : Stop at this page (0 = all pages)}';

    protected $description = 'Scrape ALL posts from tejyug.com admin panel (/manage-post) with full content and categories';

    private const BASE_URL    = 'https://www.tejyug.com';
    private const LOGIN_URL   = 'https://www.tejyug.com/login';
    private const MANAGE_URL  = 'https://www.tejyug.com/manage-post';
    private const EMAIL       = 'tejyugnews@gmail.com';
    private const PASSWORD    = 'Tejyug@123#$';

    private array  $cookies   = [];
    private int    $userId;
    private int    $saved     = 0;
    private int    $skipped   = 0;
    private int    $errors    = 0;

    public function handle(): int
    {
        $this->userId = $this->resolveUserId();
        if (! $this->userId) {
            $this->error('No user found in the local database.');
            return self::FAILURE;
        }

        $this->info('Logging in to tejyug.com admin panel...');
        if (! $this->login()) {
            $this->error('Login failed.');
            return self::FAILURE;
        }
        $this->info('Login successful.');

        // Detect total pages
        $totalPages = $this->detectTotalPages();
        $startPage  = max(1, (int) $this->option('start-page'));
        $endPage    = (int) $this->option('end-page');
        if ($endPage <= 0 || $endPage > $totalPages) {
            $endPage = $totalPages;
        }

        $this->info("Total pages: {$totalPages} | Scraping pages {$startPage}–{$endPage} (~" . (($endPage - $startPage + 1) * 10) . " posts)");
        $this->newLine();

        for ($page = $startPage; $page <= $endPage; $page++) {
            $this->info("── Page {$page}/{$endPage} (saved:{$this->saved} skipped:{$this->skipped} errors:{$this->errors})");

            $posts = $this->fetchListingPage($page);
            if (empty($posts)) {
                $this->warn("  No posts found on page {$page}, stopping.");
                break;
            }

            foreach ($posts as $post) {
                $this->processPost($post);
                usleep(250_000); // 0.25s between posts
            }
        }

        $this->newLine();
        $this->info("Done! Saved: {$this->saved} | Skipped: {$this->skipped} | Errors: {$this->errors}");
        return self::SUCCESS;
    }

    // ─── Login ───────────────────────────────────────────────────────────────

    private function login(): bool
    {
        // Get CSRF token
        $resp = Http::timeout(20)->get(self::LOGIN_URL);
        if (! $resp->successful()) return false;

        $token   = $this->extractCsrf($resp->body());
        $cookies = $this->parseCookies($resp->headers());

        // Submit login
        $resp2 = Http::timeout(20)
            ->withHeaders([
                'Cookie'   => $this->cookieString($cookies),
                'Referer'  => self::LOGIN_URL,
                'Origin'   => self::BASE_URL,
            ])
            ->asForm()
            ->post(self::LOGIN_URL, [
                '_token'   => $token,
                'email'    => self::EMAIL,
                'password' => self::PASSWORD,
                'remember' => 'on',
            ]);

        // Merge cookies from both responses
        $this->cookies = array_merge(
            $cookies,
            $this->parseCookies($resp->headers()),
            $this->parseCookies($resp2->headers())
        );

        // Verify we can access manage-post
        $check = $this->get(self::MANAGE_URL);
        return $check && str_contains($check, 'manage-post');
    }

    // ─── Pagination ──────────────────────────────────────────────────────────

    private function detectTotalPages(): int
    {
        $html = $this->get(self::MANAGE_URL);
        if (! $html) return 1;

        preg_match_all('/page=(\d+)/', $html, $m);
        return $m[1] ? max(array_map('intval', $m[1])) : 1;
    }

    // ─── Listing page ────────────────────────────────────────────────────────

    /**
     * Returns array of ['id', 'title', 'categories', 'status', 'date', 'url']
     * Uses regex parsing to avoid issues with HTML comments inside <td> elements.
     */
    private function fetchListingPage(int $page): array
    {
        $html = $this->get(self::MANAGE_URL . '?page=' . $page);
        if (! $html) return [];

        // Strip HTML comments to avoid corrupting the DOM
        $html = preg_replace('/<!--.*?-->/s', '', $html);

        $posts = [];

        // Extract each <tr> inside <tbody>
        if (! preg_match('/<tbody>(.*?)<\/tbody>/s', $html, $bodyMatch)) {
            return [];
        }

        preg_match_all('/<tr>(.*?)<\/tr>/s', $bodyMatch[1], $rows);

        foreach ($rows[1] as $row) {
            // Post ID from edit link
            if (! preg_match('#manage-post/(\d+)/edit#', $row, $m)) continue;
            $id = (int) $m[1];

            // All <td> values
            preg_match_all('/<td[^>]*>(.*?)<\/td>/s', $row, $tds);
            $cells = array_map(fn($c) => trim(strip_tags($c)), $tds[1]);

            $date   = $cells[1] ?? '';
            $title  = $cells[2] ?? '';
            $status = 'published';

            // Status from span.status
            if (preg_match('/<span class="status">(.*?)<\/span>/s', $row, $sm)) {
                $status = trim($sm[1]);
            }

            // Categories from .cat-btns spans
            $categories = [];
            preg_match_all('/<span class="cat-btns">(.*?)<\/span>/s', $row, $catMatches);
            foreach ($catMatches[1] as $cat) {
                $cat = trim(strip_tags($cat));
                if ($cat) $categories[] = $cat;
            }

            // Public detail URL
            $url = '';
            if (preg_match('#href="(https://www\.tejyug\.com/[^"]+/detail)"#', $row, $um)) {
                $url = $um[1];
            }

            if ($id && $title) {
                $posts[] = compact('id', 'title', 'categories', 'status', 'date', 'url');
            }
        }

        return $posts;
    }

    // ─── Edit page ───────────────────────────────────────────────────────────

    private function processPost(array $post): void
    {
        $id   = $post['id'];
        $slug = $this->slugFromUrl($post['url']);

        if (! $slug) {
            $slug = 'tejyug-post-' . $id;
        }

        // Skip duplicate
        if (Article::where('slug', $slug)->exists()) {
            $this->line("  <fg=yellow>SKIP</> [{$id}] " . Str::limit($post['title'], 60));
            $this->skipped++;
            return;
        }

        // Fetch edit page for full content
        $editHtml = $this->get(self::BASE_URL . '/manage-post/' . $id . '/edit');
        if (! $editHtml) {
            $this->warn("  <fg=red>FAIL</> [{$id}] Could not fetch edit page");
            $this->errors++;
            return;
        }

        try {
            $data = $this->parseEditPage($editHtml, $post);
        } catch (\Throwable $e) {
            $this->warn("  <fg=red>PARSE</> [{$id}] " . $e->getMessage());
            $this->errors++;
            return;
        }

        if (empty($data['content'])) {
            $this->warn("  <fg=red>EMPTY</> [{$id}] No content");
            $this->errors++;
            return;
        }

        try {
            $article = Article::create([
                'user_id'        => $this->userId,
                'title'          => $data['title'],
                'slug'           => $slug,
                'content'        => $data['content'],
                'excerpt'        => $data['excerpt'],
                'featured_image' => $data['featured_image'],
                'thumbnail'      => $data['featured_image'],
                'status'         => 'published',
                'published_at'   => $data['published_at'],
            ]);

            // Attach categories
            if (! empty($data['category_ids'])) {
                $article->categories()->syncWithoutDetaching($data['category_ids']);
            }

            $this->line("  <fg=green>SAVED</> [{$id}] " . Str::limit($data['title'], 70));
            $this->saved++;
        } catch (\Throwable $e) {
            $this->warn("  <fg=red>DB</> [{$id}] " . $e->getMessage());
            $this->errors++;
        }
    }

    // ─── Edit page parser ────────────────────────────────────────────────────

    private function parseEditPage(string $html, array $post): array
    {
        $crawler = new Crawler($html);

        // Title
        $title = '';
        try {
            $title = $crawler->filter('input[name="title"]')->attr('value', '');
        } catch (\Throwable) {}
        if (empty($title)) $title = $post['title'];

        // Slug
        $slug = '';
        try {
            $slug = $crawler->filter('input[name="slug"]')->attr('value', '');
        } catch (\Throwable) {}

        // Content (raw HTML from textarea)
        $content = '';
        try {
            $content = trim($crawler->filter('textarea[name="content"]')->html(''));
        } catch (\Throwable) {}

        // Featured image
        $featuredImage = null;
        try {
            $imgName = $crawler->filter('input[name="imagename"]')->attr('value', '');
            if ($imgName) {
                $featuredImage = 'https://tejyug.com/public/storage/posts/' . $imgName;
            }
        } catch (\Throwable) {}

        // Fallback: grab image from old_image or preview img
        if (! $featuredImage) {
            try {
                $featuredImage = $crawler->filter('input[name="old_image"]')->attr('value', null);
            } catch (\Throwable) {}
        }

        // Excerpt from meta description
        $excerpt = '';
        try {
            $excerpt = trim($crawler->filter('textarea[name="metadescription"]')->text(''));
        } catch (\Throwable) {}
        if (empty($excerpt) && $content) {
            $excerpt = Str::limit(strip_tags($content), 300);
        }

        // Categories — resolve/create from listing row category names
        $categoryIds = [];
        foreach ($post['categories'] as $catName) {
            if (! $catName) continue;
            $cat = $this->resolveCategory($catName);
            if ($cat) $categoryIds[] = $cat->id;
        }

        // Published date
        $publishedAt = now();
        if (! empty($post['date'])) {
            try {
                $publishedAt = \Carbon\Carbon::parse($post['date']);
            } catch (\Throwable) {}
        }

        return [
            'title'          => $title,
            'slug'           => $slug,
            'content'        => $content,
            'excerpt'        => $excerpt,
            'featured_image' => $featuredImage,
            'category_ids'   => $categoryIds,
            'published_at'   => $publishedAt,
        ];
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private function resolveCategory(string $name): ?Category
    {
        static $cache = [];
        $key = mb_strtolower(trim($name));
        if (isset($cache[$key])) return $cache[$key];

        $cat = Category::firstOrCreate(
            ['slug' => Str::slug($name) ?: 'cat-' . md5($name)],
            ['name' => $name, 'is_active' => true, 'order' => 0]
        );

        $cache[$key] = $cat;
        return $cat;
    }

    private function slugFromUrl(string $url): string
    {
        // https://www.tejyug.com/some-slug/detail  →  some-slug
        if (preg_match('#tejyug\.com/([^/]+)/detail#', $url, $m)) {
            return $m[1];
        }
        return '';
    }

    private function resolveUserId(): int
    {
        if ($uid = $this->option('user-id')) {
            return (int) $uid;
        }
        return User::first()?->id ?? 0;
    }

    // ─── HTTP helpers (session-aware) ────────────────────────────────────────

    private function get(string $url): ?string
    {
        try {
            $resp = Http::timeout(25)
                ->withHeaders([
                    'Cookie'     => $this->cookieString($this->cookies),
                    'User-Agent' => 'Mozilla/5.0 (compatible; TejyugScraper/2.0)',
                    'Accept'     => 'text/html,application/xhtml+xml',
                    'Referer'    => self::MANAGE_URL,
                ])
                ->get($url);

            // Refresh cookies from response
            $newCookies = $this->parseCookies($resp->headers());
            if ($newCookies) {
                $this->cookies = array_merge($this->cookies, $newCookies);
            }

            return $resp->successful() ? $resp->body() : null;
        } catch (\Throwable $e) {
            return null;
        }
    }

    private function parseCookies(array $headers): array
    {
        $cookies = [];
        $setCookie = $headers['set-cookie'] ?? $headers['Set-Cookie'] ?? [];
        if (is_string($setCookie)) $setCookie = [$setCookie];

        foreach ((array) $setCookie as $line) {
            $parts = explode(';', $line);
            $pair  = explode('=', trim($parts[0]), 2);
            if (count($pair) === 2) {
                $cookies[trim($pair[0])] = trim($pair[1]);
            }
        }
        return $cookies;
    }

    private function cookieString(array $cookies): string
    {
        return implode('; ', array_map(
            fn($k, $v) => "{$k}={$v}",
            array_keys($cookies),
            array_values($cookies)
        ));
    }

    private function extractCsrf(string $html): string
    {
        if (preg_match('/name="_token"\s+value="([^"]+)"/', $html, $m)) {
            return $m[1];
        }
        if (preg_match('/csrf-token"\s+content="([^"]+)"/', $html, $m)) {
            return $m[1];
        }
        return '';
    }
}
