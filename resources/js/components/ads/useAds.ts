import axios from 'axios';
import * as React from 'react';
import type { AdPlacement, AdServedDTO } from '@/types';

export type DeviceType = 'desktop' | 'tablet' | 'mobile';

export function detectDevice(): DeviceType {
    const w = window.innerWidth;
    if (w < 768)  return 'mobile';
    if (w < 1024) return 'tablet';
    return 'desktop';
}

// ── Session-scoped caches (cleared on hard reload) ───────────────────────────
const impressionsFired = new Set<number>();
const adCache = new Map<string, { data: AdServedDTO[]; fetchedAt: number }>();
const CACHE_TTL_MS = 60_000;

// ── Popup frequency tracking (sessionStorage) ────────────────────────────────
const POPUP_KEY = (id: number) => `ad_popup_last_shown_${id}`;

export function canShowPopup(ad: AdServedDTO): boolean {
    if (!ad.popup_frequency_minutes) return true;
    const last = sessionStorage.getItem(POPUP_KEY(ad.id));
    if (!last) return true;
    const elapsedMs = Date.now() - parseInt(last, 10);
    return elapsedMs >= ad.popup_frequency_minutes * 60_000;
}

export function markPopupShown(id: number): void {
    sessionStorage.setItem(POPUP_KEY(id), String(Date.now()));
}

// ── Main hook ────────────────────────────────────────────────────────────────

interface UseAdsOptions {
    placement: AdPlacement;
    pageUrl?: string;
}

interface UseAdsResult {
    ads: AdServedDTO[];
    loading: boolean;
    device: DeviceType;
    dismissed: Set<number>;
    dismiss: (id: number) => void;
    trackImpression: (id: number, variantLabel?: string | null) => void;
    trackClick: (id: number, variantLabel?: string | null) => void;
}

export function useAds({ placement, pageUrl }: UseAdsOptions): UseAdsResult {
    const [ads,       setAds]       = React.useState<AdServedDTO[]>([]);
    const [loading,   setLoading]   = React.useState(true);
    const [dismissed, setDismissed] = React.useState<Set<number>>(new Set());
    const [device]                  = React.useState<DeviceType>(detectDevice);

    React.useEffect(() => {
        let cancelled = false;
        const cacheKey = `${placement}:${device}`;
        const cached   = adCache.get(cacheKey);

        if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
            setAds(cached.data);
            setLoading(false);
            return;
        }

        setLoading(true);

        axios
            .get<{ data: AdServedDTO[] }>('/api/ads', { params: { placement, device } })
            .then(({ data }) => {
                if (cancelled) return;
                adCache.set(cacheKey, { data: data.data, fetchedAt: Date.now() });
                setAds(data.data);
            })
            .catch(() => {})
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
    }, [placement, device]);

    const dismiss = React.useCallback((id: number) => {
        setDismissed((prev) => new Set(prev).add(id));
    }, []);

    const trackImpression = React.useCallback((id: number, variantLabel?: string | null) => {
        if (impressionsFired.has(id)) return;
        impressionsFired.add(id);
        axios.post('/api/ads/impression', { ad_id: id, variant_label: variantLabel, page_url: pageUrl }).catch(() => {});
    }, [pageUrl]);

    const trackClick = React.useCallback((id: number, variantLabel?: string | null) => {
        axios.post('/api/ads/click', { ad_id: id, variant_label: variantLabel, page_url: pageUrl }).catch(() => {});
    }, [pageUrl]);

    return { ads, loading, device, dismissed, dismiss, trackImpression, trackClick };
}
