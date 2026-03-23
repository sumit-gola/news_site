<?php

namespace App\Jobs;

use App\Mail\NewsletterMail;
use App\Models\Article;
use App\Models\NewsletterSubscriber;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendNewsletterJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 3;
    public int $timeout = 120;

    public function __construct(
        public readonly Article $article,
    ) {}

    public function handle(): void
    {
        // Chunk to avoid memory issues with large subscriber lists
        NewsletterSubscriber::active()
            ->chunk(100, function ($subscribers) {
                foreach ($subscribers as $subscriber) {
                    Mail::to($subscriber->email)
                        ->queue(new NewsletterMail($this->article, $subscriber));
                }
            });
    }
}
