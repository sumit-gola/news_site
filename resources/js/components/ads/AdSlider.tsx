import { ChevronLeft, ChevronRight } from 'lucide-react';
import * as React from 'react';
import { AdRenderer } from '@/components/ads/AdRenderer';
import { useAds } from '@/components/ads/useAds';
import type { AdPlacement } from '@/types';

interface AdSliderProps {
    placement?: Extract<AdPlacement, 'sidebar' | 'inline'>;
    className?: string;
    pageUrl?: string;
}

export function AdSlider({ placement = 'sidebar', className = '', pageUrl }: AdSliderProps) {
    const { ads, loading, dismissed, dismiss, trackImpression, trackClick } = useAds({ placement, pageUrl });
    const visible = ads.filter((a) => !dismissed.has(a.id));

    const [current, setCurrent] = React.useState(0);
    const [paused, setPaused]   = React.useState(false);
    const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

    React.useEffect(() => {
        if (visible.length > 1 && !paused) {
            timerRef.current = setInterval(() => setCurrent((p) => (p + 1) % visible.length), 5000);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [visible.length, paused]);

    React.useEffect(() => {
        setCurrent((p) => (visible.length ? p % visible.length : 0));
    }, [visible.length]);

    if (loading || visible.length === 0) {
        return <div className={`w-full aspect-[300/250] rounded-lg bg-muted/40 ${className}`} aria-hidden />;
    }

    const ad = visible[current];

    return (
        <div className={`relative w-full ${className}`} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
            <AdRenderer
                key={ad.id}
                ad={ad}
                className="aspect-[300/250]"
                onDismiss={() => dismiss(ad.id)}
                onImpression={() => trackImpression(ad.id, ad.variant_label)}
                onClick={() => trackClick(ad.id, ad.variant_label)}
            />
            {visible.length > 1 && (
                <div className="mt-2 flex items-center justify-center gap-3">
                    <button onClick={() => setCurrent((p) => (p - 1 + visible.length) % visible.length)} className="rounded-full border p-1 hover:bg-muted"><ChevronLeft className="size-3" /></button>
                    <div className="flex gap-1">
                        {visible.map((_, i) => (
                            <button key={i} onClick={() => setCurrent(i)} className={`size-1.5 rounded-full transition-all ${i === current ? 'bg-foreground w-3' : 'bg-muted-foreground/40'}`} />
                        ))}
                    </div>
                    <button onClick={() => setCurrent((p) => (p + 1) % visible.length)} className="rounded-full border p-1 hover:bg-muted"><ChevronRight className="size-3" /></button>
                </div>
            )}
        </div>
    );
}
