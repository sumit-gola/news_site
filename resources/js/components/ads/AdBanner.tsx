import { ChevronLeft, ChevronRight } from 'lucide-react';
import * as React from 'react';
import { AdRenderer } from '@/components/ads/AdRenderer';
import { useAds } from '@/components/ads/useAds';
import type { AdPlacement } from '@/types';

interface AdBannerProps {
    placement?: Extract<AdPlacement, 'header' | 'footer'>;
    heightClass?: string;
    className?: string;
    pageUrl?: string;
}

export function AdBanner({ placement = 'header', heightClass = 'h-[90px]', className = '', pageUrl }: AdBannerProps) {
    const { ads, loading, dismissed, dismiss, trackImpression, trackClick } = useAds({ placement, pageUrl });
    const visible = ads.filter((a) => !dismissed.has(a.id));

    const [current, setCurrent] = React.useState(0);
    const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

    React.useEffect(() => {
        if (visible.length > 1) {
            timerRef.current = setInterval(() => setCurrent((p) => (p + 1) % visible.length), 6000);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [visible.length]);

    React.useEffect(() => {
        setCurrent((p) => (visible.length ? p % visible.length : 0));
    }, [visible.length]);

    // Reserve space to prevent CLS
    if (loading || visible.length === 0) {
        return <div className={`w-full ${heightClass} ${className}`} aria-hidden />;
    }

    const ad = visible[current];
    const prev = () => { if (timerRef.current) clearInterval(timerRef.current); setCurrent((p) => (p - 1 + visible.length) % visible.length); };
    const next = () => { if (timerRef.current) clearInterval(timerRef.current); setCurrent((p) => (p + 1) % visible.length); };

    return (
        <div className={`relative w-full overflow-hidden bg-muted ${heightClass} ${className}`}>
            <AdRenderer
                key={ad.id}
                ad={ad}
                className="h-full"
                onDismiss={() => dismiss(ad.id)}
                onImpression={() => trackImpression(ad.id, ad.variant_label)}
                onClick={() => trackClick(ad.id, ad.variant_label)}
            />
            {visible.length > 1 && (
                <>
                    <button onClick={prev} className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full bg-black/40 p-1 text-white hover:bg-black/70"><ChevronLeft className="size-4" /></button>
                    <button onClick={next} className="absolute top-1/2 right-8 -translate-y-1/2 rounded-full bg-black/40 p-1 text-white hover:bg-black/70"><ChevronRight className="size-4" /></button>
                    <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
                        {visible.map((_, i) => (
                            <button key={i} onClick={() => setCurrent(i)} className={`size-1.5 rounded-full transition-all ${i === current ? 'bg-white w-3' : 'bg-white/50'}`} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
