import { ChevronLeft, ChevronRight } from 'lucide-react';
import * as React from 'react';
import { AdRenderer } from '@/components/ads/AdRenderer';
import { useAds } from '@/components/ads/useAds';

interface AdSliderProps {
    /** Defaults to 'sidebar' */
    placement?: 'sidebar' | 'inline';
    className?: string;
}

/**
 * Vertical card carousel for sidebar placements (300×250 medium rectangle).
 * Auto-slides every 5 s, pauses on hover.
 */
export function AdSlider({ placement = 'sidebar', className = '' }: AdSliderProps) {
    const { ads, loading, dismissed, dismiss, trackImpression, trackClick } = useAds({ placement });

    const visible = ads.filter((a) => !dismissed.has(a.id));

    const [current, setCurrent] = React.useState(0);
    const [paused, setPaused]   = React.useState(false);
    const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

    React.useEffect(() => {
        if (visible.length > 1 && !paused) {
            timerRef.current = setInterval(
                () => setCurrent((p) => (p + 1) % visible.length),
                5000,
            );
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [visible.length, paused]);

    React.useEffect(() => {
        setCurrent((p) => (visible.length ? p % visible.length : 0));
    }, [visible.length]);

    if (loading || visible.length === 0) {
        // Reserve 300×250 space to prevent layout shift
        return <div className={`w-full aspect-[300/250] rounded-lg bg-muted/40 ${className}`} aria-hidden />;
    }

    const ad = visible[current];

    const prev = () => setCurrent((p) => (p - 1 + visible.length) % visible.length);
    const next = () => setCurrent((p) => (p + 1) % visible.length);

    return (
        <div
            className={`relative w-full ${className}`}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            <AdRenderer
                key={ad.id}
                ad={ad}
                className="aspect-[300/250]"
                onDismiss={() => dismiss(ad.id)}
                onImpression={() => trackImpression(ad.id)}
                onClick={() => trackClick(ad.id)}
            />

            {visible.length > 1 && (
                <div className="mt-2 flex items-center justify-center gap-3">
                    <button onClick={prev} className="rounded-full border p-1 hover:bg-muted">
                        <ChevronLeft className="size-3" />
                    </button>
                    <div className="flex gap-1">
                        {visible.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrent(i)}
                                className={`size-1.5 rounded-full transition-all ${i === current ? 'bg-foreground w-3' : 'bg-muted-foreground/40'}`}
                            />
                        ))}
                    </div>
                    <button onClick={next} className="rounded-full border p-1 hover:bg-muted">
                        <ChevronRight className="size-3" />
                    </button>
                </div>
            )}
        </div>
    );
}
