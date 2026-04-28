<?php

namespace App\Repositories;

use App\Models\AdClick;
use App\Models\AdImpression;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class AdTrackingRepository
{
    /**
     * Whether an impression from this session was already recorded for this ad
     * within the last hour (dedup window).
     */
    public function impressionExistsForSession(int $adId, string $sessionHash): bool
    {
        return AdImpression::where('advertisement_id', $adId)
            ->where('session_hash', $sessionHash)
            ->where('created_at', '>=', now()->subHour())
            ->exists();
    }

    public function createImpression(array $data): void
    {
        AdImpression::create($data + ['created_at' => now()]);
    }

    public function createClick(array $data): void
    {
        AdClick::create($data + ['created_at' => now()]);
    }

    // ─── Analytics queries ───────────────────────────────────────────────────

    /**
     * Total impressions and clicks within a date range (all ads or single ad).
     */
    public function totals(Carbon $from, Carbon $to, ?int $adId = null): array
    {
        $impressions = AdImpression::whereBetween('created_at', [$from, $to])
            ->when($adId, fn ($q) => $q->where('advertisement_id', $adId))
            ->count();

        $clicks = AdClick::whereBetween('created_at', [$from, $to])
            ->when($adId, fn ($q) => $q->where('advertisement_id', $adId))
            ->count();

        return [
            'impressions' => $impressions,
            'clicks'      => $clicks,
            'ctr'         => $impressions > 0 ? round(($clicks / $impressions) * 100, 2) : 0.0,
        ];
    }

    /**
     * Daily time-series for impressions and clicks.
     */
    public function dailySeries(Carbon $from, Carbon $to, ?int $adId = null): array
    {
        $imp = AdImpression::selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->whereBetween('created_at', [$from, $to])
            ->when($adId, fn ($q) => $q->where('advertisement_id', $adId))
            ->groupBy('date')
            ->pluck('count', 'date')
            ->toArray();

        $clk = AdClick::selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->whereBetween('created_at', [$from, $to])
            ->when($adId, fn ($q) => $q->where('advertisement_id', $adId))
            ->groupBy('date')
            ->pluck('count', 'date')
            ->toArray();

        // Build a complete date range so chart has no gaps
        $series = [];
        $cursor = $from->copy()->startOfDay();
        while ($cursor->lte($to)) {
            $d = $cursor->toDateString();
            $series[] = [
                'date'        => $d,
                'impressions' => $imp[$d] ?? 0,
                'clicks'      => $clk[$d] ?? 0,
            ];
            $cursor->addDay();
        }

        return $series;
    }

    /**
     * Per-placement impression/click breakdown.
     */
    public function byPlacement(Carbon $from, Carbon $to): array
    {
        return DB::table('ad_impressions as i')
            ->join('advertisements as a', 'a.id', '=', 'i.advertisement_id')
            ->selectRaw('a.placement_type, COUNT(i.id) as impressions')
            ->whereBetween('i.created_at', [$from, $to])
            ->groupBy('a.placement_type')
            ->get()
            ->map(function ($row) use ($from, $to) {
                $clicks = DB::table('ad_clicks as c')
                    ->join('advertisements as a', 'a.id', '=', 'c.advertisement_id')
                    ->where('a.placement_type', $row->placement_type)
                    ->whereBetween('c.created_at', [$from, $to])
                    ->count();

                return [
                    'placement'   => $row->placement_type,
                    'impressions' => (int) $row->impressions,
                    'clicks'      => $clicks,
                    'ctr'         => $row->impressions > 0 ? round(($clicks / $row->impressions) * 100, 2) : 0.0,
                ];
            })
            ->toArray();
    }

    /**
     * Top N ads by CTR within date range.
     */
    public function topPerformers(Carbon $from, Carbon $to, int $limit = 10): array
    {
        $imp = AdImpression::selectRaw('advertisement_id, COUNT(*) as impressions')
            ->whereBetween('created_at', [$from, $to])
            ->groupBy('advertisement_id')
            ->pluck('impressions', 'advertisement_id')
            ->toArray();

        $clk = AdClick::selectRaw('advertisement_id, COUNT(*) as clicks')
            ->whereBetween('created_at', [$from, $to])
            ->groupBy('advertisement_id')
            ->pluck('clicks', 'advertisement_id')
            ->toArray();

        $merged = [];
        foreach ($imp as $adId => $impressions) {
            $clicks = $clk[$adId] ?? 0;
            $merged[] = [
                'advertisement_id' => $adId,
                'impressions'      => (int) $impressions,
                'clicks'           => (int) $clicks,
                'ctr'              => $impressions > 0 ? round(($clicks / $impressions) * 100, 2) : 0.0,
            ];
        }

        usort($merged, fn ($a, $b) => $b['ctr'] <=> $a['ctr']);

        return array_slice($merged, 0, $limit);
    }
}
