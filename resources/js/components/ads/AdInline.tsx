import * as React from 'react';
import { AdRenderer } from '@/components/ads/AdRenderer';
import { useAds } from '@/components/ads/useAds';

interface AdInlineProps {
    className?: string;
    pageUrl?: string;
}

export function AdInline({ className = '', pageUrl }: AdInlineProps) {
    const { ads, loading, dismissed, dismiss, trackImpression, trackClick } = useAds({ placement: 'inline', pageUrl });
    const visible = ads.filter((a) => !dismissed.has(a.id));
    const ad = visible[0];

    if (loading) return <div className={`w-full h-[100px] rounded-lg bg-muted/40 animate-pulse ${className}`} aria-hidden />;
    if (!ad) return null;

    return (
        <AdRenderer
            ad={ad}
            className={`w-full max-h-[120px] ${className}`}
            onDismiss={() => dismiss(ad.id)}
            onImpression={() => trackImpression(ad.id, ad.variant_label)}
            onClick={() => trackClick(ad.id, ad.variant_label)}
        />
    );
}
