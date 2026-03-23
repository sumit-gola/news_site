import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import type { AdPage, AdPosition } from '@/types';

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
};

type Props = {
    position: AdPosition;
    page: AdPage;
    categoryId?: number;
    className?: string;
    sticky?: boolean;
};

export default function AdSlot({ position, page, categoryId, className, sticky = false }: Props) {
    const [items, setItems] = useState<AdItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const query = new URLSearchParams({ position, page, limit: '3' });

        if (categoryId) {
            query.set('category_id', String(categoryId));
        }

        fetch(`/api/ad-slots?${query.toString()}`)
            .then((res) => res.json())
            .then((payload) => {
                if (!cancelled) {
                    setItems(payload.data ?? []);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [position, page, categoryId]);

    const track = (adId: number, type: 'impression' | 'click') => {
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
    };

    useEffect(() => {
        items.forEach((item) => track(item.id, 'impression'));
        // impression is intentionally fired once when ads are loaded
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items.length]);

    if (loading) {
        return <Skeleton className="h-28 w-full rounded-lg" />;
    }

    if (items.length === 0) {
        return null;
    }

    return (
        <div className={`${sticky ? 'sticky top-20' : ''} space-y-3 ${className ?? ''}`}>
            {items.map((ad) => {
                const href = ad.target_url || '#';
                const target = ad.open_in_new_tab ? '_blank' : '_self';

                if (ad.ad_type === 'image' && ad.image_path) {
                    const src = ad.image_path.startsWith('http') ? ad.image_path : `/storage/${ad.image_path}`;

                    return (
                        <a
                            key={ad.id}
                            href={href}
                            target={target}
                            rel="noreferrer"
                            onClick={() => track(ad.id, 'click')}
                            className="block overflow-hidden rounded-lg border bg-background shadow-sm"
                        >
                            <img src={src} alt={ad.title} className="h-auto w-full" loading="lazy" />
                        </a>
                    );
                }

                if (ad.ad_type === 'script' && ad.script_code) {
                    return (
                        <div
                            key={ad.id}
                            className="rounded-lg border p-2 shadow-sm"
                            dangerouslySetInnerHTML={{ __html: ad.script_code }}
                        />
                    );
                }

                if (ad.video_embed_url) {
                    return (
                        <div key={ad.id} className="overflow-hidden rounded-lg border bg-background shadow-sm">
                            <iframe
                                title={ad.title}
                                src={ad.video_embed_url}
                                className="h-52 w-full"
                                loading="lazy"
                                allow="autoplay; encrypted-media; picture-in-picture"
                            />
                        </div>
                    );
                }

                if (ad.ad_type === 'html' && ad.html_code) {
                    return (
                        <div
                            key={ad.id}
                            className="rounded-lg border p-2 shadow-sm"
                            dangerouslySetInnerHTML={{ __html: ad.html_code }}
                        />
                    );
                }

                return null;
            })}
        </div>
    );
}
