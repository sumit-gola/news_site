import { X } from 'lucide-react';
import * as React from 'react';
import { AdRenderer } from '@/components/ads/AdRenderer';
import { useAds } from '@/components/ads/useAds';

interface AdPopupProps {
    /** Delay in ms before the popup appears. Default 3000 (3 s). */
    delayMs?: number;
}

/**
 * Modal popup ad. Shows once per page session after a delay.
 * Only visible on desktop — mobile users are never shown intrusive popups.
 */
export function AdPopup({ delayMs = 3000 }: AdPopupProps) {
    const { ads, loading, device, dismissed, dismiss, trackImpression, trackClick } = useAds({ placement: 'popup' });

    const [visible, setVisible] = React.useState(false);

    const ad = ads.filter((a) => !dismissed.has(a.id))[0];

    // Show after delay — only on desktop
    React.useEffect(() => {
        if (!ad || loading || device === 'mobile') return;

        const timer = setTimeout(() => setVisible(true), delayMs);
        return () => clearTimeout(timer);
    }, [ad, loading, device, delayMs]);

    const close = () => {
        setVisible(false);
        if (ad) dismiss(ad.id);
    };

    if (!visible || !ad) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={close}
            aria-modal
            role="dialog"
            aria-label="Advertisement"
        >
            <div
                className="relative mx-4 w-full max-w-lg overflow-hidden rounded-2xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={close}
                    aria-label="Close"
                    className="absolute top-3 right-3 z-10 flex size-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition"
                >
                    <X className="size-4" />
                </button>

                <AdRenderer
                    ad={{ ...ad, is_dismissible: false }}
                    className="rounded-2xl"
                    onImpression={() => trackImpression(ad.id)}
                    onClick={() => { trackClick(ad.id); close(); }}
                />
            </div>
        </div>
    );
}
