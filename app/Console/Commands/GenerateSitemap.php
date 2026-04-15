<?php

namespace App\Console\Commands;

use App\Models\Article;
use App\Models\Category;
use App\Models\Page;
use App\Models\Tag;
use Illuminate\Console\Command;
use Spatie\Sitemap\Sitemap;
use Spatie\Sitemap\Tags\Url;

class GenerateSitemap extends Command
{
    protected $signature   = 'sitemap:generate';
    protected $description = 'Generate sitemap.xml for the news portal';

    public function handle(): int
    {
        $sitemap = Sitemap::create();

        // Homepage
        $sitemap->add(Url::create('/')
            ->setChangeFrequency(Url::CHANGE_FREQUENCY_DAILY)
            ->setPriority(1.0)
        );

        // News listing
        $sitemap->add(Url::create('/news')
            ->setChangeFrequency(Url::CHANGE_FREQUENCY_HOURLY)
            ->setPriority(0.9)
        );

        // Published articles
        Article::published()
            ->select(['slug', 'updated_at', 'published_at'])
            ->orderByDesc('published_at')
            ->chunk(200, function ($articles) use ($sitemap) {
                foreach ($articles as $article) {
                    $sitemap->add(
                        Url::create(route('news.show', $article->slug))
                            ->setLastModificationDate($article->updated_at)
                            ->setChangeFrequency(Url::CHANGE_FREQUENCY_WEEKLY)
                            ->setPriority(0.8)
                    );
                }
            });

        // Categories
        Category::active()->get(['slug', 'updated_at'])->each(fn ($cat) =>
            $sitemap->add(
                Url::create(route('news.category', $cat->slug))
                    ->setLastModificationDate($cat->updated_at)
                    ->setChangeFrequency(Url::CHANGE_FREQUENCY_DAILY)
                    ->setPriority(0.7)
            )
        );

        // Tags
        Tag::all(['slug', 'updated_at'])->each(fn ($tag) =>
            $sitemap->add(
                Url::create(route('news.tag', $tag->slug))
                    ->setLastModificationDate($tag->updated_at)
                    ->setChangeFrequency(Url::CHANGE_FREQUENCY_WEEKLY)
                    ->setPriority(0.5)
            )
        );

        // Static pages
        Page::published()->get(['slug', 'updated_at'])->each(fn ($page) =>
            $sitemap->add(
                Url::create(route('page.show', $page->slug))
                    ->setLastModificationDate($page->updated_at)
                    ->setChangeFrequency(Url::CHANGE_FREQUENCY_MONTHLY)
                    ->setPriority(0.6)
            )
        );

        $sitemap->writeToFile(public_path('sitemap.xml'));

        $this->info('Sitemap generated at public/sitemap.xml');

        return self::SUCCESS;
    }
}
