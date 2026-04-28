import * as React from 'react';
import { AdRenderer } from '@/components/ads/AdRenderer';
import { useAds } from '@/components/ads/useAds';

interface AdInlineProps {
    className?: string;
}

/**
 * Compact inline ad unit — shown between content sections.
 * Native card style, full-width, roughly 320×100.
 */
export function AdInline({ className = '' }: AdInlineProps) {
    const { ads, loading, dismissed, dismiss, trackImpression, trackClick } = useAds({ placement: 'inline' });

    const visible = ads.filter((a) => !dismissed.has(a.id));

    // Show one ad — pick the highest priority (already sorted by backend)
    const ad = visible[0];

    if (loading) {
        return <div className={`w-full h-[100px] rounded-lg bg-muted/40 animate-pulse ${className}`} aria-hidden />;
    }

    if (!ad) return null;

    return (
        <AdRenderer
            ad={ad}
            className={`w-full max-h-[120px] ${className}`}
            onDismiss={() => dismiss(ad.id)}
            onImpression={() => trackImpression(ad.id)}
            onClick={() => trackClick(ad.id)}
        />
    );
}
