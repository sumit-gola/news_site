<?php

namespace App\Jobs;

use App\Models\AdPerformance;
use App\Models\Advertisement;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ManageAdSchedulesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        $this->activateScheduledAds();
        $this->deactivateExpiredAds();
        $this->pauseAdsThatHitImpressionCaps();
        $this->pauseAdsThatExhaustedDailyBudget();
    }

    private function activateScheduledAds(): void
    {
        $count = Advertisement::query()
            ->where('status', 'active')
            ->where('workflow_status', 'approved')
            ->whereNotNull('start_date')
            ->where('start_date', '<=', now())
            ->where(function ($q) {
                $q->whereNull('end_date')->orWhere('end_date', '>=', now());
            })
            ->where('workflow_status', '!=', 'active')
            ->update(['workflow_status' => 'active']);

        if ($count > 0) {
            Log::info("ManageAdSchedules: Activated {$count} scheduled ads.");
        }
    }

    private function deactivateExpiredAds(): void
    {
        $count = Advertisement::query()
            ->where('status', 'active')
            ->whereNotNull('end_date')
            ->where('end_date', '<', now())
            ->update([
                'status' => 'inactive',
                'workflow_status' => 'archived',
            ]);

        if ($count > 0) {
            Log::info("ManageAdSchedules: Deactivated {$count} expired ads.");
        }
    }

    private function pauseAdsThatHitImpressionCaps(): void
    {
        $ads = Advertisement::query()
            ->where('status', 'active')
            ->whereNotNull('max_total_impressions')
            ->whereColumn('total_impressions', '>=', 'max_total_impressions')
            ->get();

        foreach ($ads as $ad) {
            $ad->update(['status' => 'inactive', 'workflow_status' => 'paused']);
            Log::info("ManageAdSchedules: Paused ad #{$ad->id} (hit total impression cap).");
        }
    }

    private function pauseAdsThatExhaustedDailyBudget(): void
    {
        $ads = Advertisement::query()
            ->where('status', 'active')
            ->whereNotNull('daily_budget')
            ->where('daily_budget', '>', 0)
            ->get();

        foreach ($ads as $ad) {
            $todaySpend = (float) AdPerformance::query()
                ->where('advertisement_id', $ad->id)
                ->where('date', now()->toDateString())
                ->value('clicks') * 0.01; // simple CPC estimate

            if ($ad->daily_budget > 0 && $todaySpend >= $ad->daily_budget) {
                $ad->update(['status' => 'inactive', 'workflow_status' => 'paused']);
                Log::info("ManageAdSchedules: Paused ad #{$ad->id} (exhausted daily budget).");
            }
        }
    }
}
