import { useCallback, useEffect, useRef, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import type { AdPage, AdPosition, DisplayBehavior, DisplayConfig } from '@/types';

type AdItem = {
    id: number;
    title: string;
    ad_type: 'image' | 'html' | 'script';
    image_path: string | null;
    html_code: string | null;
    script_code: string | null;
    target_url: string | null;
    open_in_new_tab: boolean;
    width: number | null;
    height: number | null;
    video_embed_url?: string | null;
    display_behavior: DisplayBehavior;
    display_config: DisplayConfig;
    is_closable: boolean;
    close_button_delay_seconds: number;
};

type Props = {
    position: AdPosition;
    page: AdPage;
    categoryId?: number;
    className?: string;
    sticky?: boolean;
};

const DISMISS_STORAGE_PREFIX = 'ad_dismissed_';

function isDismissed(adId: number, hours: number): boolean {
    try {
        const raw = localStorage.getItem(`${DISMISS_STORAGE_PREFIX}${adId}`);
        if (!raw) return false;
        const until = Number(raw);
        if (Date.now() < until) return true;
        localStorage.removeItem(`${DISMISS_STORAGE_PREFIX}${adId}`);
    } catch { /* noop */ }
    return false;
}

function setDismissed(adId: number, hours: number): void {
    try {
        localStorage.setItem(`${DISMISS_STORAGE_PREFIX}${adId}`, String(Date.now() + hours * 3600000));
    } catch { /* noop */ }
}

export default function AdSlot({ position, page, categoryId, className, sticky = false }: Props) {
    const [items, setItems] = useState<AdItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [dismissed, setDismissedIds] = useState<Set<number>>(new Set());
    const [rotationIndex, setRotationIndex] = useState(0);
    const [closeButtonVisible, setCloseButtonVisible] = useState<Record<number, boolean>>({});
    const [slideInVisible, setSlideInVisible] = useState(false);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const rotationTimer = useRef<ReturnType<typeof setInterval> | null>(null);
    const [hovered, setHovered] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const query = new URLSearchParams({ position, page, limit: '3' });
        if (categoryId) query.set('category_id', String(categoryId));

        fetch(`/api/ad-slots?${query.toString()}`)
            .then((res) => res.json())
            .then((payload) => {
                if (!cancelled) {
                    const data: AdItem[] = payload.data ?? [];
                    const initialDismissed = new Set<number>();
                    data.forEach((ad) => {
                        const hours = ad.display_config?.dismiss_duration_hours ?? 24;
                        if (ad.is_closable && isDismissed(ad.id, hours)) {
                            initialDismissed.add(ad.id);
                        }
                    });
                    setDismissedIds(initialDismissed);
                    setItems(data);
                }
            })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [position, page, categoryId]);

    const track = useCallback((adId: number, type: 'impression' | 'click') => {
        const params = new URLSearchParams({ page, position });
        fetch(`/api/ad-slots/${adId}/${type}`, {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
            },
            body: params.toString(),
        }).catch(() => null);
    }, [page, position]);

    const dismissAd = useCallback((ad: AdItem) => {
        const hours = ad.display_config?.dismiss_duration_hours ?? 24;
        setDismissed(ad.id, hours);
        setDismissedIds((prev) => new Set(prev).add(ad.id));
        fetch(`/api/ad-slots/${ad.id}/dismiss`, {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
            },
        }).catch(() => null);
    }, []);

    // Track impressions
    useEffect(() => {
        items.filter((ad) => !dismissed.has(ad.id)).forEach((item) => track(item.id, 'impression'));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items.length]);

    // Close button delay
    useEffect(() => {
        const timers: ReturnType<typeof setTimeout>[] = [];
        items.forEach((ad) => {
            if (ad.is_closable && !dismissed.has(ad.id)) {
                const delay = (ad.close_button_delay_seconds ?? ad.display_config?.show_close_after_seconds ?? 0) * 1000;
                const t = setTimeout(() => {
                    setCloseButtonVisible((prev) => ({ ...prev, [ad.id]: true }));
                }, delay);
                timers.push(t);
            }
        });
        return () => timers.forEach(clearTimeout);
    }, [items, dismissed]);

    // Rotational behavior
    useEffect(() => {
        const rotationalAds = items.filter((ad) => ad.display_behavior === 'rotational' && !dismissed.has(ad.id));
        if (rotationalAds.length <= 1) return;

        const interval = (rotationalAds[0]?.display_config?.interval_seconds ?? 5) * 1000;
        rotationTimer.current = setInterval(() => {
            if (!hovered || !(rotationalAds[0]?.display_config?.pause_on_hover ?? true)) {
                setRotationIndex((prev) => (prev + 1) % rotationalAds.length);
            }
        }, interval);

        return () => { if (rotationTimer.current) clearInterval(rotationTimer.current); };
    }, [items, dismissed, hovered]);

    // Slide-in via IntersectionObserver
    useEffect(() => {
        const slideAds = items.filter((ad) => ad.display_behavior === 'slide_in');
        if (slideAds.length === 0 || !sentinelRef.current) return;

        const config = slideAds[0].display_config;
        if (config?.trigger === 'time') {
            const t = setTimeout(() => setSlideInVisible(true), (config.trigger_value ?? 5) * 1000);
            return () => clearTimeout(t);
        }

        const scrollPercent = config?.trigger_value ?? 50;
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setSlideInVisible(true); },
            { threshold: 0 },
        );
        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, [items]);

    if (loading) return <Skeleton className="h-28 w-full rounded-lg" />;

    const visibleItems = items.filter((ad) => !dismissed.has(ad.id));
    if (visibleItems.length === 0) return null;

    const renderAdContent = (ad: AdItem) => {
        const href = ad.target_url || '#';
        const target = ad.open_in_new_tab ? '_blank' : '_self';

        if (ad.ad_type === 'image' && ad.image_path) {
            const src = ad.image_path.startsWith('http') ? ad.image_path : `/storage/${ad.image_path}`;
            return (
                <a href={href} target={target} rel="noreferrer" onClick={() => track(ad.id, 'click')}
                   className="block overflow-hidden rounded-lg border bg-background shadow-sm">
                    <img src={src} alt={ad.title} className="h-auto w-full" loading="lazy" />
                </a>
            );
        }
        if (ad.ad_type === 'script' && ad.script_code) {
            return <div className="overflow-hidden rounded-lg border shadow-sm" dangerouslySetInnerHTML={{ __html: ad.script_code }} />;
        }
        if (ad.video_embed_url) {
            return (
                <div className="overflow-hidden rounded-lg border bg-background shadow-sm">
                    <iframe title={ad.title} src={ad.video_embed_url} className="h-52 w-full" loading="lazy"
                            allow="autoplay; encrypted-media; picture-in-picture" />
                </div>
            );
        }
        if (ad.ad_type === 'html' && ad.html_code) {
            return <div className="overflow-hidden rounded-lg border shadow-sm" dangerouslySetInnerHTML={{ __html: ad.html_code }} />;
        }
        return null;
    };

    const renderCloseButton = (ad: AdItem) => {
        if (!ad.is_closable || !closeButtonVisible[ad.id]) return null;
        const style = ad.display_config?.close_button_style ?? 'icon';
        return (
            <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); dismissAd(ad); }}
                className="absolute right-1 top-1 z-10 rounded-full bg-black/60 px-1.5 py-0.5 text-xs text-white transition-opacity hover:bg-black/80"
                aria-label="Close ad"
            >
                {style === 'text' ? 'Close' : style === 'icon_text' ? '✕ Close' : '✕'}
            </button>
        );
    };

    const renderStandardAd = (ad: AdItem) => (
        <div key={ad.id} className="relative">
            {renderCloseButton(ad)}
            {renderAdContent(ad)}
        </div>
    );

    // Group by behavior
    const standardAds = visibleItems.filter((ad) => ad.display_behavior === 'standard' || ad.display_behavior === 'closable');
    const rotationalAds = visibleItems.filter((ad) => ad.display_behavior === 'rotational');
    const stickyAds = visibleItems.filter((ad) => ad.display_behavior === 'sticky');
    const floatingAds = visibleItems.filter((ad) => ad.display_behavior === 'floating');
    const interstitialAds = visibleItems.filter((ad) => ad.display_behavior === 'interstitial');
    const expandableAds = visibleItems.filter((ad) => ad.display_behavior === 'expandable');
    const slideInAds = visibleItems.filter((ad) => ad.display_behavior === 'slide_in');

    return (
        <>
            {/* Scroll sentinel for slide-in ads */}
            <div ref={sentinelRef} className="pointer-events-none h-0" />

            <div className={`${sticky ? 'sticky top-20' : ''} space-y-3 ${className ?? ''}`}>
                {/* Standard + closable ads */}
                {standardAds.map(renderStandardAd)}

                {/* Rotational carousel */}
                {rotationalAds.length > 0 && (
                    <div
                        className="relative overflow-hidden"
                        onMouseEnter={() => setHovered(true)}
                        onMouseLeave={() => setHovered(false)}
                    >
                        {renderCloseButton(rotationalAds[rotationIndex % rotationalAds.length])}
                        <div className="transition-opacity duration-300">
                            {renderAdContent(rotationalAds[rotationIndex % rotationalAds.length])}
                        </div>
                    </div>
                )}

                {/* Expandable ads */}
                {expandableAds.map((ad) => (
                    <ExpandableAd key={ad.id} ad={ad} onClose={() => dismissAd(ad)} showClose={!!closeButtonVisible[ad.id]}>
                        {renderAdContent(ad)}
                    </ExpandableAd>
                ))}
            </div>

            {/* Sticky ads (rendered as fixed/sticky overlays) */}
            {stickyAds.map((ad) => (
                <div
                    key={ad.id}
                    className="sticky"
                    style={{
                        top: ad.display_config?.offset_top ?? 0,
                        zIndex: ad.display_config?.z_index ?? 50,
                    }}
                >
                    <div className="relative">
                        {renderCloseButton(ad)}
                        {renderAdContent(ad)}
                    </div>
                </div>
            ))}

            {/* Floating ads */}
            {floatingAds.map((ad) => (
                <FloatingAd key={ad.id} ad={ad} onClose={() => dismissAd(ad)} showClose={!!closeButtonVisible[ad.id]} onTrack={track}>
                    {renderAdContent(ad)}
                </FloatingAd>
            ))}

            {/* Interstitial ads */}
            {interstitialAds.map((ad) => (
                <InterstitialAd key={ad.id} ad={ad} onClose={() => dismissAd(ad)} onTrack={track}>
                    {renderAdContent(ad)}
                </InterstitialAd>
            ))}

            {/* Slide-in ads */}
            {slideInAds.map((ad) => (
                <SlideInAd key={ad.id} ad={ad} visible={slideInVisible} onClose={() => dismissAd(ad)} showClose={!!closeButtonVisible[ad.id]}>
                    {renderAdContent(ad)}
                </SlideInAd>
            ))}
        </>
    );
}

/* ── Sub-components for complex behaviors ── */

function FloatingAd({ ad, onClose, showClose, children }: {
    ad: AdItem; onClose: () => void; showClose: boolean; onTrack: (id: number, t: 'impression' | 'click') => void; children: React.ReactNode;
}) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const delay = (ad.display_config?.show_after_seconds ?? 2) * 1000;
        const t = setTimeout(() => setVisible(true), delay);
        return () => clearTimeout(t);
    }, [ad]);

    if (!visible) return null;

    const posMap: Record<string, string> = {
        'top-left': 'top-4 left-4', 'top-center': 'top-4 left-1/2 -translate-x-1/2', 'top-right': 'top-4 right-4',
        'center-left': 'top-1/2 left-4 -translate-y-1/2', 'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2', 'center-right': 'top-1/2 right-4 -translate-y-1/2',
        'bottom-left': 'bottom-4 left-4', 'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2', 'bottom-right': 'bottom-4 right-4',
    };

    const pos = ad.display_config?.initial_position ?? 'bottom-right';

    return (
        <div className={`fixed z-[999] ${posMap[pos] ?? 'bottom-4 right-4'}`}>
            <div className="relative rounded-lg shadow-lg">
                {showClose && (
                    <button type="button" onClick={onClose}
                        className="absolute -right-2 -top-2 z-10 rounded-full bg-black/70 p-1 text-xs text-white hover:bg-black/90"
                        aria-label="Close">✕</button>
                )}
                {children}
            </div>
        </div>
    );
}

function InterstitialAd({ ad, onClose, children }: {
    ad: AdItem; onClose: () => void; onTrack: (id: number, t: 'impression' | 'click') => void; children: React.ReactNode;
}) {
    const [visible, setVisible] = useState(false);
    const [canSkip, setCanSkip] = useState(false);

    useEffect(() => {
        const views = Number(sessionStorage.getItem('ad_pageviews') ?? '0') + 1;
        sessionStorage.setItem('ad_pageviews', String(views));
        const threshold = ad.display_config?.show_after_pageviews ?? 1;
        if (views >= threshold) setVisible(true);
    }, [ad]);

    useEffect(() => {
        if (!visible) return;
        const delay = (ad.display_config?.skip_after_seconds ?? 5) * 1000;
        const t = setTimeout(() => setCanSkip(true), delay);
        return () => clearTimeout(t);
    }, [visible, ad]);

    if (!visible) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80">
            <div className="relative max-h-[90vh] max-w-[90vw] overflow-auto rounded-lg bg-background p-4 shadow-2xl">
                {canSkip && (
                    <button type="button" onClick={() => { onClose(); setVisible(false); }}
                        className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-1 text-xs text-white hover:bg-black/90"
                        aria-label="Skip">Skip ✕</button>
                )}
                {!canSkip && (
                    <div className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-1 text-xs text-white">
                        Please wait...
                    </div>
                )}
                {children}
            </div>
        </div>
    );
}

function ExpandableAd({ ad, onClose, showClose, children }: {
    ad: AdItem; onClose: () => void; showClose: boolean; children: React.ReactNode;
}) {
    const [expanded, setExpanded] = useState(false);
    const collapsedH = ad.display_config?.collapsed_height ?? 90;
    const expandedH = ad.display_config?.expanded_height ?? 250;
    const trigger = ad.display_config?.trigger ?? 'hover';

    return (
        <div
            className="relative overflow-hidden rounded-lg border transition-all duration-300"
            style={{ height: expanded ? expandedH : collapsedH }}
            onMouseEnter={trigger === 'hover' ? () => setExpanded(true) : undefined}
            onMouseLeave={trigger === 'hover' ? () => setExpanded(false) : undefined}
            onClick={trigger === 'click' ? () => setExpanded(!expanded) : undefined}
        >
            {showClose && (
                <button type="button" onClick={(e) => { e.stopPropagation(); onClose(); }}
                    className="absolute right-1 top-1 z-10 rounded-full bg-black/60 px-1.5 py-0.5 text-xs text-white hover:bg-black/80"
                    aria-label="Close">✕</button>
            )}
            {children}
        </div>
    );
}

function SlideInAd({ ad, visible, onClose, showClose, children }: {
    ad: AdItem; visible: boolean; onClose: () => void; showClose: boolean; children: React.ReactNode;
}) {
    const dir = ad.display_config?.direction ?? 'bottom';
    const duration = ad.display_config?.animation_duration_ms ?? 300;

    const positionClass: Record<string, string> = {
        bottom: 'fixed bottom-0 left-1/2 -translate-x-1/2 z-[998]',
        right: 'fixed right-0 top-1/2 -translate-y-1/2 z-[998]',
        left: 'fixed left-0 top-1/2 -translate-y-1/2 z-[998]',
    };

    const hiddenTransform: Record<string, string> = {
        bottom: 'translateX(-50%) translateY(100%)',
        right: 'translateX(100%) translateY(-50%)',
        left: 'translateX(-100%) translateY(-50%)',
    };

    const visibleTransform: Record<string, string> = {
        bottom: 'translateX(-50%) translateY(0)',
        right: 'translateX(0) translateY(-50%)',
        left: 'translateX(0) translateY(-50%)',
    };

    return (
        <div
            className={positionClass[dir] ?? positionClass.bottom}
            style={{
                transform: visible ? visibleTransform[dir] : hiddenTransform[dir],
                transition: `transform ${duration}ms ease-out`,
            }}
        >
            <div className="relative rounded-lg shadow-lg">
                {showClose && (
                    <button type="button" onClick={onClose}
                        className="absolute -right-2 -top-2 z-10 rounded-full bg-black/70 p-1 text-xs text-white hover:bg-black/90"
                        aria-label="Close">✕</button>
                )}
                {children}
            </div>
        </div>
    );
}
