import * as React from 'react';
import { AdRenderer } from '@/components/ads/AdRenderer';
import { useAds } from '@/components/ads/useAds';

interface AdStickyProps {
    pageUrl?: string;
    className?: string;
}

/**
 * Scroll-triggered sticky ad — slides up from the bottom once the user
 * scrolls past sticky_offset_px. Ideal for mobile bottom banners.
 */
export function AdSticky({ pageUrl, className = '' }: AdStickyProps) {
    const { ads, loading, dismissed, dismiss, trackImpression, trackClick } = useAds({ placement: 'footer', pageUrl });
    const [show, setShow] = React.useState(false);

    const ad = ads.find((a) => a.ad_type === 'sticky' && !dismissed.has(a.id));

    React.useEffect(() => {
        if (!ad) return;
        const threshold = ad.sticky_offset_px ?? 0;

        const onScroll = () => {
            setShow(window.scrollY >= threshold);
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll(); // check immediately on mount
        return () => window.removeEventListener('scroll', onScroll);
    }, [ad]);

    if (loading || !ad) return null;

    return (
        <div
            className={`fixed bottom-0 left-0 right-0 z-30 transition-transform duration-300 ${show ? 'translate-y-0' : 'translate-y-full'} ${className}`}
        >
            <AdRenderer
                ad={ad}
                className="rounded-none"
                onDismiss={() => dismiss(ad.id)}
                onImpression={() => trackImpression(ad.id, ad.variant_label)}
                onClick={() => trackClick(ad.id, ad.variant_label)}
            />
        </div>
    );
}
