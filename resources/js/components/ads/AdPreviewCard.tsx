import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { AdvertisementRecord } from '@/types';

type Props = {
    ad: Pick<AdvertisementRecord, 'title' | 'ad_type' | 'image_path' | 'width' | 'height'>;
};

export default function AdPreviewCard({ ad }: Props) {
    const imageUrl = ad.image_path ? (ad.image_path.startsWith('http') ? ad.image_path : `/storage/${ad.image_path}`) : null;

    return (
        <Card>
            <CardContent className="space-y-3 p-3">
                <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-medium">{ad.title}</p>
                    <Badge variant="outline" className="uppercase">{ad.ad_type}</Badge>
                </div>

                {ad.ad_type === 'image' && imageUrl && (
                    <img src={imageUrl} alt={ad.title} className="h-24 w-full rounded-md border object-cover" />
                )}

                {ad.ad_type === 'html' && (
                    <div className="rounded-md border bg-muted/30 p-2 text-xs text-muted-foreground">HTML snippet</div>
                )}

                {ad.ad_type === 'script' && (
                    <div className="rounded-md border bg-muted/30 p-2 text-xs text-muted-foreground">Script ad</div>
                )}

                <p className="text-xs text-muted-foreground">
                    Size: {ad.width ?? '-'} x {ad.height ?? '-'}
                </p>
            </CardContent>
        </Card>
    );
}
