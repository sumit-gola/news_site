<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdPerformance;
use App\Models\Advertisement;
use Inertia\Inertia;
use Inertia\Response;

class AdAnalyticsController extends Controller
{
    public function index(): Response
    {
        $topAds = Advertisement::query()
            ->with('advertiser:id,name')
            ->orderByDesc('total_clicks')
            ->limit(10)
            ->get()
            ->map(fn (Advertisement $ad) => [
                'id' => $ad->id,
                'title' => $ad->title,
                'advertiser' => $ad->advertiser?->name,
                'impressions' => $ad->total_impressions,
                'clicks' => $ad->total_clicks,
                'ctr' => $ad->ctr,
            ]);

        $last30Days = AdPerformance::query()
            ->whereDate('date', '>=', now()->subDays(30)->toDateString())
            ->orderBy('date')
            ->get(['date', 'impressions', 'clicks', 'ctr']);

        return Inertia::render('admin/advertisements/analytics', [
            'summary' => [
                'total_ads' => Advertisement::count(),
                'active_ads' => Advertisement::active()->count(),
                'impressions' => (int) Advertisement::sum('total_impressions'),
                'clicks' => (int) Advertisement::sum('total_clicks'),
            ],
            'topAds' => $topAds,
            'trend' => $last30Days,
        ]);
    }
}
