<?php

namespace Database\Seeders;

use App\Models\Article;
use App\Models\ArticleMeta;
use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ArticleSeeder extends Seeder
{
    /**
     * Seed 100 articles distributed across multiple categories.
     */
    public function run(): void
    {
        $targetCount = 100;
        $existingCount = Article::count();

        if ($existingCount >= $targetCount) {
            $this->command?->info("ArticleSeeder skipped: {$existingCount} articles already exist.");
            return;
        }

        $authors = User::query()->where('status', 'active')->get(['id']);

        if ($authors->isEmpty()) {
            $this->command?->warn('No active users found. Run RolesAndPermissionsSeeder first.');
            return;
        }

        $categories = $this->ensureCategories();

        $remaining = $targetCount - $existingCount;

        for ($i = 0; $i < $remaining; $i++) {
            $title = fake()->unique()->sentence(fake()->numberBetween(4, 8));
            $status = fake()->randomElement(['draft', 'pending', 'published', 'published', 'published', 'rejected']);
            $publishedAt = $status === 'published' ? now()->subDays(fake()->numberBetween(0, 365)) : null;
            $content = '<p>' . implode('</p><p>', fake()->paragraphs(fake()->numberBetween(4, 10))) . '</p>';

            $article = Article::create([
                'user_id' => $authors->random()->id,
                'title' => $title,
                'slug' => $this->uniqueSlug($title),
                'excerpt' => fake()->sentence(20),
                'content' => $content,
                'featured_image' => null,
                'status' => $status,
                'published_at' => $publishedAt,
                'views' => $status === 'published' ? fake()->numberBetween(10, 20000) : 0,
            ]);

            $wordCount = str_word_count(strip_tags($content));

            ArticleMeta::updateOrCreate(
                ['article_id' => $article->id],
                [
                    'meta_title' => Str::limit($title, 60, ''),
                    'meta_description' => fake()->sentence(22),
                    'meta_keywords' => implode(', ', fake()->words(6)),
                    'og_image' => null,
                    'canonical_url' => null,
                    'read_time' => max(1, (int) ceil($wordCount / 200)),
                    'word_count' => $wordCount,
                ]
            );

            $categoryIds = $categories
                ->shuffle()
                ->take(fake()->numberBetween(1, min(3, $categories->count())))
                ->pluck('id')
                ->all();

            $article->categories()->sync($categoryIds);
        }

        $this->command?->info("ArticleSeeder completed: {$remaining} article(s) created.");
    }

    /**
     * Ensure a baseline set of active categories exists.
     */
    private function ensureCategories()
    {
        $defaults = [
            ['name' => 'Technology', 'color' => '#3b82f6', 'order' => 1],
            ['name' => 'Business', 'color' => '#10b981', 'order' => 2],
            ['name' => 'Health', 'color' => '#ec4899', 'order' => 3],
            ['name' => 'Science', 'color' => '#8b5cf6', 'order' => 4],
            ['name' => 'Sports', 'color' => '#f59e0b', 'order' => 5],
            ['name' => 'Politics', 'color' => '#ef4444', 'order' => 6],
            ['name' => 'World', 'color' => '#06b6d4', 'order' => 7],
            ['name' => 'Entertainment', 'color' => '#f97316', 'order' => 8],
        ];

        foreach ($defaults as $category) {
            Category::firstOrCreate(
                ['slug' => Str::slug($category['name'])],
                [
                    'name' => $category['name'],
                    'description' => "Latest {$category['name']} news and updates.",
                    'color' => $category['color'],
                    'order' => $category['order'],
                    'is_active' => true,
                ]
            );
        }

        return Category::query()->where('is_active', true)->get(['id', 'name']);
    }

    /**
     * Generate a unique article slug.
     */
    private function uniqueSlug(string $title): string
    {
        $base = Str::slug($title);
        $slug = $base;
        $counter = 1;

        while (Article::query()->where('slug', $slug)->exists()) {
            $slug = "{$base}-{$counter}";
            $counter++;
        }

        return $slug;
    }
}
