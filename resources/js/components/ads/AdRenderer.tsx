import { X } from 'lucide-react';
import * as React from 'react';
import type { AdServedDTO } from '@/types';

interface AdRendererProps {
    ad: AdServedDTO;
    onDismiss?: () => void;
    onImpression?: () => void;
    onClick?: () => void;
    className?: string;
}

/**
 * Core ad unit — renders image / video / HTML embed / script, plus CTA and dismiss.
 * Fires impression once on mount via IntersectionObserver.
 */
export function AdRenderer({ ad, onDismiss, onImpression, onClick, className = '' }: AdRendererProps) {
    const rootRef         = React.useRef<HTMLDivElement>(null);
    const embedRef        = React.useRef<HTMLDivElement>(null);
    const impressionFired = React.useRef(false);

    // IntersectionObserver for impression tracking (fires when 50% visible)
    React.useEffect(() => {
        const el = rootRef.current;
        if (!el || !onImpression) return;
        const obs = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !impressionFired.current) {
                impressionFired.current = true;
                onImpression();
            }
        }, { threshold: 0.5 });
        obs.observe(el);
        return () => obs.disconnect();
    }, [onImpression]);

    // Execute inline scripts injected via dangerouslySetInnerHTML
    React.useEffect(() => {
        if (!embedRef.current) return;
        embedRef.current.querySelectorAll<HTMLScriptElement>('script').forEach((original) => {
            const clone = document.createElement('script');
            Array.from(original.attributes).forEach((a) => clone.setAttribute(a.name, a.value));
            clone.text = original.text;
            original.parentNode?.replaceChild(clone, original);
        });
    }, [ad.embed_code]);

    const handleClick = () => {
        onClick?.();
        if (ad.redirect_url) {
            window.open(ad.redirect_url, '_blank', 'noopener,noreferrer');
        }
    };

    const bgStyle = ad.bg_color ? { backgroundColor: ad.bg_color } : {};

    return (
        <div ref={rootRef} className={`relative overflow-hidden rounded-lg ${className}`} style={bgStyle}>

            {/* Dismiss button */}
            {ad.is_dismissible && onDismiss && (
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onDismiss(); }}
                    aria-label="Close advertisement"
                    className="absolute top-2 right-2 z-20 flex size-5 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/80"
                >
                    <X className="size-3" />
                </button>
            )}

            {/* ── HTML / Script embed ── */}
            {(ad.media_type === 'html' || ad.media_type === 'script') && ad.embed_code ? (
                <div
                    ref={embedRef}
                    className="w-full"
                    // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML={{ __html: ad.embed_code }}
                />
            ) : (
                /* ── Clickable image / video / fallback ── */
                <button
                    type="button"
                    onClick={handleClick}
                    className="block w-full cursor-pointer text-left focus:outline-none"
                    aria-label={`Advertisement: ${ad.title}`}
                >
                    {ad.media_full_url ? (
                        ad.media_type === 'video' ? (
                            <video
                                src={ad.media_full_url}
                                autoPlay muted loop playsInline
                                className="w-full object-cover"
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
                        /* Text-only fallback */
                        <div className="flex min-h-[80px] flex-col items-center justify-center px-4 py-3 text-center bg-gradient-to-r from-violet-500 to-indigo-600">
                            <p className="font-semibold text-white">{ad.title}</p>
                            {ad.description && <p className="mt-0.5 text-sm text-white/80">{ad.description}</p>}
                            {ad.cta_label && (
                                <span className="mt-2 inline-block rounded-full bg-white px-3 py-1 text-xs font-semibold text-violet-700">
                                    {ad.cta_label}
                                </span>
                            )}
                        </div>
                    )}

                    {/* CTA overlay (image/video ads) */}
                    {ad.cta_label && ad.media_full_url && (
                        <span className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-gray-800 shadow">
                            {ad.cta_label}
                        </span>
                    )}
                </button>
            )}

            {/* Ad label */}
            <span className="absolute bottom-1 left-1.5 rounded bg-black/40 px-1.5 py-0.5 text-[9px] font-medium text-white/70 pointer-events-none">
                Ad
            </span>
        </div>
    );
}
