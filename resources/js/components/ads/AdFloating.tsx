import * as React from 'react';
import { AdRenderer } from '@/components/ads/AdRenderer';
import { canShowPopup, markPopupShown, useAds } from '@/components/ads/useAds';
import type { FloatAnim, FloatPos } from '@/types';

// Position → Tailwind fixed-position classes
const POS_CLASSES: Record<FloatPos, string> = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left':  'bottom-4 left-4',
    'top-right':    'top-4 right-4',
    'top-left':     'top-4 left-4',
};

// Animation → keyframe class name (defined in index.css / global styles)
const ANIM_CLASSES: Record<FloatAnim, string> = {
    slide:  'animate-slide-up',
    fade:   'animate-fade-in',
    bounce: 'animate-bounce-in',
};

interface AdFloatingProps {
    pageUrl?: string;
}

/**
 * Corner-anchored floating ad. Respects float_position, float_animation,
 * popup_delay_seconds, and popup_frequency_minutes from the backend config.
 */
export function AdFloating({ pageUrl }: AdFloatingProps) {
    const { ads, loading, device, dismissed, dismiss, trackImpression, trackClick } = useAds({ placement: 'popup', pageUrl });
    const [mounted, setMounted] = React.useState(false);

    // Filter to floating ad type specifically
    const ad = ads.find((a) => a.ad_type === 'floating' && !dismissed.has(a.id) && canShowPopup(a));

    React.useEffect(() => {
        if (!ad || loading) return;
        const timer = setTimeout(() => {
            setMounted(true);
            markPopupShown(ad.id);
        }, (ad.popup_delay_seconds ?? 3) * 1000);
        return () => clearTimeout(timer);
    }, [ad, loading]);

    if (!mounted || !ad) return null;

    const posClass  = POS_CLASSES[ad.float_position ?? 'bottom-right'];
    const animClass = ANIM_CLASSES[ad.float_animation ?? 'slide'];

    return (
        <div className={`fixed z-40 w-72 shadow-2xl ${posClass} ${animClass}`}>
            <AdRenderer
                ad={ad}
                className="rounded-xl"
                onDismiss={() => { dismiss(ad.id); setMounted(false); }}
                onImpression={() => trackImpression(ad.id, ad.variant_label)}
                onClick={() => trackClick(ad.id, ad.variant_label)}
            />
        </div>
    );
}
