<?php

namespace App\Services;

use App\Models\Advertisement;
use App\Models\AdVariant;
use App\Repositories\AdTrackingRepository;
use Illuminate\Http\Request;

class AdTrackingService
{
    public function __construct(
        private readonly AdTrackingRepository $repository,
    ) {}

    /**
     * Record an impression. Deduplicates: max 1 per session per ad per hour.
     */
    public function recordImpression(Advertisement $ad, Request $request, ?string $variantLabel = null): void
    {
        $sessionHash = $this->sessionHash($request);

        if ($this->repository->impressionExistsForSession($ad->id, $sessionHash)) {
            return;
        }

        $this->repository->createImpression([
            'advertisement_id' => $ad->id,
            'session_hash'     => $sessionHash,
            'ip_hash'          => $this->ipHash($request),
            'device_type'      => $this->detectDevice($request),
            'page_url'         => $this->safeUrl($request->input('page_url')),
            'variant_label'    => $variantLabel,
        ]);

        // Keep atomic counter in sync
        $ad->incrementImpressions();

        // Keep variant counter in sync
        if ($variantLabel) {
            AdVariant::where('advertisement_id', $ad->id)
                ->where('label', $variantLabel)
                ->increment('impressions_count');
        }
    }

    /**
     * Record a click (no dedup — every click counts).
     */
    public function recordClick(Advertisement $ad, Request $request, ?string $variantLabel = null): void
    {
        $this->repository->createClick([
            'advertisement_id' => $ad->id,
            'session_hash'     => $this->sessionHash($request),
            'ip_hash'          => $this->ipHash($request),
            'device_type'      => $this->detectDevice($request),
            'page_url'         => $this->safeUrl($request->input('page_url')),
            'variant_label'    => $variantLabel,
        ]);

        $ad->incrementClicks();

        if ($variantLabel) {
            AdVariant::where('advertisement_id', $ad->id)
                ->where('label', $variantLabel)
                ->increment('clicks_count');
        }
    }

    // ─── Private helpers ─────────────────────────────────────────────────────

    private function sessionHash(Request $request): string
    {
        return hash('sha256', $request->session()->getId());
    }

    private function ipHash(Request $request): string
    {
        return hash('sha256', $request->ip() ?? 'unknown');
    }

    private function detectDevice(Request $request): string
    {
        $ua = strtolower($request->userAgent() ?? '');

        if (str_contains($ua, 'mobile') || str_contains($ua, 'android') || str_contains($ua, 'iphone')) {
            return 'mobile';
        }
        if (str_contains($ua, 'tablet') || str_contains($ua, 'ipad')) {
            return 'tablet';
        }
        return 'desktop';
    }

    private function safeUrl(?string $url): ?string
    {
        if (!$url) return null;
        // Truncate to column limit and strip any credentials
        $parsed = parse_url($url);
        unset($parsed['user'], $parsed['pass']);
        $rebuilt = ($parsed['scheme'] ?? 'https') . '://' . ($parsed['host'] ?? '') . ($parsed['path'] ?? '');
        return mb_substr($rebuilt, 0, 2048);
    }
}
