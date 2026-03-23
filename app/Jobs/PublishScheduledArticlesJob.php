<?php

namespace App\Jobs;

use App\Models\Article;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Run via scheduler every minute to publish scheduled articles.
 */
class PublishScheduledArticlesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        Article::where('status', 'scheduled')
            ->where('scheduled_at', '<=', now())
            ->whereNotNull('scheduled_at')
            ->each(function (Article $article) {
                $article->update([
                    'status'       => 'published',
                    'published_at' => $article->scheduled_at,
                    'scheduled_at' => null,
                ]);
            });
    }
}
