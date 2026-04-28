import { X } from 'lucide-react';
import * as React from 'react';
import { AdRenderer } from '@/components/ads/AdRenderer';
import { canShowPopup, markPopupShown, useAds } from '@/components/ads/useAds';

interface AdPopupProps {
    pageUrl?: string;
}

/**
 * Modal popup ad. Respects popup_delay_seconds and popup_frequency_minutes.
 * Only shown on desktop/tablet — never forces intrusive overlays on mobile.
 */
export function AdPopup({ pageUrl }: AdPopupProps) {
    const { ads, loading, device, dismissed, dismiss, trackImpression, trackClick } = useAds({ placement: 'popup', pageUrl });
    const [visible, setVisible] = React.useState(false);

    const ad = ads.filter((a) => !dismissed.has(a.id) && canShowPopup(a))[0];

    React.useEffect(() => {
        if (!ad || loading || device === 'mobile') return;
        const timer = setTimeout(() => {
            setVisible(true);
            markPopupShown(ad.id);
        }, (ad.popup_delay_seconds ?? 3) * 1000);
        return () => clearTimeout(timer);
    }, [ad, loading, device]);

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
            <div className="relative mx-4 w-full max-w-lg overflow-hidden rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <button onClick={close} aria-label="Close" className="absolute top-3 right-3 z-10 flex size-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition">
                    <X className="size-4" />
                </button>
                <AdRenderer
                    ad={{ ...ad, is_dismissible: false }}
                    className="rounded-2xl"
                    onImpression={() => trackImpression(ad.id, ad.variant_label)}
                    onClick={() => { trackClick(ad.id, ad.variant_label); close(); }}
                />
            </div>
        </div>
    );
}
