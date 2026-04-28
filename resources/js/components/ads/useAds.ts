import axios from 'axios';
import * as React from 'react';
import type { AdPlacement, Advertisement } from '@/types';

type DeviceType = 'desktop' | 'tablet' | 'mobile';

function detectDevice(): DeviceType {
    const w = window.innerWidth;
    if (w < 768)  return 'mobile';
    if (w < 1024) return 'tablet';
    return 'desktop';
}

interface UseAdsOptions {
    placement: AdPlacement;
}

interface UseAdsResult {
    ads: Advertisement[];
    loading: boolean;
    device: DeviceType;
    dismissed: Set<number>;
    dismiss: (id: number) => void;
    trackImpression: (id: number) => void;
    trackClick: (id: number) => void;
}

// Module-level impression tracking to fire each ad once per page session
const impressionsFired = new Set<number>();

export function useAds({ placement }: UseAdsOptions): UseAdsResult {
    const [ads,      setAds]      = React.useState<Advertisement[]>([]);
    const [loading,  setLoading]  = React.useState(true);
    const [dismissed, setDismissed] = React.useState<Set<number>>(new Set());
    const [device] = React.useState<DeviceType>(detectDevice);

    React.useEffect(() => {
        let cancelled = false;
        setLoading(true);

        axios
            .get<{ data: Advertisement[] }>('/api/advertisements', {
                params: { placement, device },
            })
            .then(({ data }) => {
                if (!cancelled) setAds(data.data);
            })
            .catch(() => {
                // Silently fail — no ads is fine
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, [placement, device]);

    const dismiss = React.useCallback((id: number) => {
        setDismissed((prev) => new Set(prev).add(id));
    }, []);

    // Fire impression once per ad per page session (not persisted to localStorage)
    const trackImpression = React.useCallback((id: number) => {
        if (impressionsFired.has(id)) return;
        impressionsFired.add(id);
        axios.post(`/api/advertisements/${id}/impression`).catch(() => {});
    }, []);

    const trackClick = React.useCallback((id: number) => {
        axios.post(`/api/advertisements/${id}/click`).catch(() => {});
    }, []);

    return { ads, loading, device, dismissed, dismiss, trackImpression, trackClick };
}
