<?php

namespace App\Services;

use App\Models\Advertisement;
use App\Models\AdVariant;
use App\Repositories\AdTrackingRepository;
use Illuminate\Support\Carbon;

class AdAnalyticsService
{
    public function __construct(
        private readonly AdTrackingRepository $repository,
    ) {}

    /**
     * High-level summary KPIs for the analytics dashboard.
     */
    public function summary(Carbon $from, Carbon $to): array
    {
        $totals = $this->repository->totals($from, $to);

        return [
            'impressions'  => $totals['impressions'],
            'clicks'       => $totals['clicks'],
            'ctr'          => $totals['ctr'],
            'active_ads'   => Advertisement::where('status', 'active')->count(),
        ];
    }

    /**
     * Daily time-series array for chart rendering.
     */
    public function timeSeries(Carbon $from, Carbon $to, ?int $adId = null): array
    {
        return $this->repository->dailySeries($from, $to, $adId);
    }

    /**
     * Top N performers by CTR, with ad title hydrated.
     */
    public function topPerformers(Carbon $from, Carbon $to, int $limit = 10): array
    {
        $rows = $this->repository->topPerformers($from, $to, $limit);

        if (empty($rows)) return [];

        $ids = array_column($rows, 'advertisement_id');
        $ads = Advertisement::whereIn('id', $ids)
            ->get(['id', 'title', 'placement_type', 'ad_type', 'status'])
            ->keyBy('id');

        return array_map(function ($row) use ($ads) {
            $ad = $ads[$row['advertisement_id']] ?? null;
            return array_merge($row, [
                'title'          => $ad?->title ?? '(deleted)',
                'placement_type' => $ad?->placement_type,
                'ad_type'        => $ad?->ad_type,
                'status'         => $ad?->status,
            ]);
        }, $rows);
    }

    /**
     * Breakdown by placement type.
     */
    public function byPlacement(Carbon $from, Carbon $to): array
    {
        return $this->repository->byPlacement($from, $to);
    }

    /**
     * A/B variant comparison for a single ad.
     */
    public function variantComparison(int $adId): array
    {
        return AdVariant::where('advertisement_id', $adId)
            ->orderBy('label')
            ->get(['label', 'weight', 'impressions_count', 'clicks_count'])
            ->map(function ($v) {
                return [
                    'label'       => $v->label,
                    'weight'      => $v->weight,
                    'impressions' => $v->impressions_count,
                    'clicks'      => $v->clicks_count,
                    'ctr'         => $v->ctr,
                ];
            })
            ->toArray();
    }
}
