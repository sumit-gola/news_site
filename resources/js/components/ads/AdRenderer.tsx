import { X } from 'lucide-react';
import * as React from 'react';
import type { Advertisement } from '@/types';

interface AdRendererProps {
    ad: Advertisement;
    onDismiss?: () => void;
    onImpression?: () => void;
    onClick?: () => void;
    className?: string;
}

/**
 * Core ad unit — renders media, CTA, and dismiss button.
 * Fires impression once on mount via IntersectionObserver.
 */
export function AdRenderer({ ad, onDismiss, onImpression, onClick, className = '' }: AdRendererProps) {
    const ref = React.useRef<HTMLDivElement>(null);
    const impressionFired = React.useRef(false);

    React.useEffect(() => {
        const el = ref.current;
        if (!el || !onImpression) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !impressionFired.current) {
                    impressionFired.current = true;
                    onImpression();
                }
            },
            { threshold: 0.5 },
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [onImpression]);

    const handleClick = () => {
        onClick?.();
        window.open(ad.redirect_url, '_blank', 'noopener,noreferrer');
    };

    return (
        <div ref={ref} className={`relative overflow-hidden rounded-lg ${className}`}>
            {/* Dismiss button */}
            {ad.is_dismissible && onDismiss && (
                <button
                    onClick={(e) => { e.stopPropagation(); onDismiss(); }}
                    aria-label="Close advertisement"
                    className="absolute top-2 right-2 z-10 flex size-5 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/80"
                >
                    <X className="size-3" />
                </button>
            )}

            {/* Clickable area */}
            <button
                onClick={handleClick}
                className="block w-full cursor-pointer text-left focus:outline-none"
                aria-label={`Advertisement: ${ad.title}`}
            >
                {/* Media */}
                {ad.media_full_url ? (
                    ad.media_type === 'video' ? (
                        <video
                            src={ad.media_full_url}
                            autoPlay
                            muted
                            loop
                            playsInline
                            className="w-full object-cover"
                            loading="lazy"
                        />
                    ) : (
                        <img
                            src={ad.media_full_url}
                            alt={ad.title}
                            loading="lazy"
                            decoding="async"
                            className="w-full object-cover"
                        />
                    )
                ) : (
                    /* Fallback text card when no media */
                    <div className="flex min-h-[80px] items-center justify-center bg-gradient-to-r from-violet-500 to-indigo-600 px-4 py-3 text-center">
                        <div>
                            <p className="font-semibold text-white">{ad.title}</p>
                            {ad.description && (
                                <p className="mt-0.5 text-sm text-white/80">{ad.description}</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Ad label */}
                <span className="absolute bottom-1.5 left-1.5 rounded bg-black/40 px-1.5 py-0.5 text-[10px] font-medium text-white/80">
                    Ad
                </span>
            </button>
        </div>
    );
}
