<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdPerformance;
use App\Models\Advertisement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AdAnalyticsController extends Controller
{
    public function index(Request $request): Response
    {
        $period = $request->string('period', '30d')->toString();
        $startDate = match ($period) {
            '7d' => now()->subDays(7),
            '90d' => now()->subDays(90),
            default => now()->subDays(30),
        };

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

        $trend = AdPerformance::query()
            ->whereDate('date', '>=', $startDate->toDateString())
            ->orderBy('date')
            ->get(['date', 'impressions', 'clicks', 'ctr']);

        $eventBase = DB::table('ad_event_logs')
            ->whereDate('created_at', '>=', $startDate->toDateString());

        $byDevice = (clone $eventBase)
            ->selectRaw('COALESCE(device, ?) as label, COUNT(*) as count', ['unknown'])
            ->where('event_type', 'impression')
            ->groupBy('device')
            ->orderByDesc('count')
            ->get();

        $byPage = (clone $eventBase)
            ->selectRaw('COALESCE(page, ?) as label, COUNT(*) as count', ['unknown'])
            ->where('event_type', 'impression')
            ->groupBy('page')
            ->orderByDesc('count')
            ->get();

        $byPosition = (clone $eventBase)
            ->selectRaw('COALESCE(position, ?) as label, COUNT(*) as count', ['unknown'])
            ->where('event_type', 'impression')
            ->groupBy('position')
            ->orderByDesc('count')
            ->get();

        $bySlot = Advertisement::query()
            ->selectRaw('COALESCE(ad_slots.name, ?) as label, SUM(total_impressions) as impressions', ['No Slot'])
            ->leftJoin('ad_slots', 'ad_slots.id', '=', 'advertisements.ad_slot_id')
            ->groupBy('ad_slots.name')
            ->orderByDesc('impressions')
            ->limit(10)
            ->get();

        $byAdvertiser = Advertisement::query()
            ->selectRaw('COALESCE(advertisers.name, ?) as label, SUM(total_clicks) as clicks', ['Unknown'])
            ->leftJoin('advertisers', 'advertisers.id', '=', 'advertisements.advertiser_id')
            ->groupBy('advertisers.name')
            ->orderByDesc('clicks')
            ->limit(10)
            ->get();

        $underperforming = Advertisement::query()
            ->where('status', 'active')
            ->where('total_impressions', '>', 100)
            ->whereRaw('(CASE WHEN total_impressions > 0 THEN (total_clicks * 100.0) / total_impressions ELSE 0 END) < 0.5')
            ->limit(8)
            ->get(['id', 'title', 'total_impressions', 'total_clicks']);

        $expiringSoon = Advertisement::query()
            ->where('status', 'active')
            ->whereBetween('end_date', [now(), now()->addDays(7)])
            ->orderBy('end_date')
            ->limit(8)
            ->get(['id', 'title', 'end_date']);

        return Inertia::render('admin/advertisements/analytics', [
            'summary' => [
                'total_ads' => Advertisement::count(),
                'active_ads' => Advertisement::active()->count(),
                'impressions' => (int) Advertisement::sum('total_impressions'),
                'clicks' => (int) Advertisement::sum('total_clicks'),
                'ctr' => Advertisement::sum('total_impressions') > 0
                    ? round((Advertisement::sum('total_clicks') / Advertisement::sum('total_impressions')) * 100, 2)
                    : 0,
                'spend' => (float) Advertisement::sum('spent_amount'),
            ],
            'topAds' => $topAds,
            'trend' => $trend,
            'breakdowns' => [
                'device' => $byDevice,
                'page' => $byPage,
                'position' => $byPosition,
                'slot' => $bySlot,
                'advertiser' => $byAdvertiser,
            ],
            'insights' => [
                'underperforming' => $underperforming,
                'expiringSoon' => $expiringSoon,
            ],
            'period' => $period,
        ]);
    }

    public function export(Request $request)
    {
        $period = $request->string('period', '30d')->toString();
        $startDate = match ($period) {
            '7d' => now()->subDays(7),
            '90d' => now()->subDays(90),
            default => now()->subDays(30),
        };

        $rows = DB::table('ad_event_logs')
            ->whereDate('created_at', '>=', $startDate->toDateString())
            ->select('event_type', 'page', 'position', 'device', 'country', 'locale', 'slot_id', 'advertiser_id', 'created_at')
            ->orderByDesc('created_at')
            ->limit(5000)
            ->get();

        $csv = "event_type,page,position,device,country,locale,slot_id,advertiser_id,created_at\n";
        foreach ($rows as $row) {
            $csv .= implode(',', [
                $row->event_type,
                $row->page,
                $row->position,
                $row->device,
                $row->country,
                $row->locale,
                $row->slot_id,
                $row->advertiser_id,
                $row->created_at,
            ]) . "\n";
        }

        return response($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="ad-analytics-' . now()->format('Ymd-His') . '.csv"',
        ]);
    }
}
