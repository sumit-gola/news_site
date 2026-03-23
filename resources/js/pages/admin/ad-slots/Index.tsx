import { Head, Link, router } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Slot = {
    id: number;
    name: string;
    page: string | null;
    position: string;
    allowed_sizes: string[] | null;
    active_ads_count: number;
    fill_rate: number;
    max_ads?: number | null;
    is_active: boolean;
};

type Props = {
    slots: Slot[];
    conflicts: Array<{ slot_id: number; name: string; active_ads: number; max_ads: number }>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Ad Slots', href: '/admin/ad-slots' },
];

export default function AdSlotsIndex({ slots, conflicts }: Props) {
    const destroySlot = (id: number) => {
        if (!window.confirm('Delete this ad slot?')) {
            return;
        }

        router.delete(`/admin/ad-slots/${id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Ad Slots" />

            <div className="grid gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Ad Slots</h1>
                        <p className="text-sm text-muted-foreground">Reusable positions like Home Top Banner or Article Sidebar.</p>
                    </div>
                    <Button asChild>
                        <Link href="/admin/ad-slots/create">Create Slot</Link>
                    </Button>
                </div>

                {conflicts.length > 0 && (
                    <Card className="border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30">
                        <CardHeader className="pb-2"><CardTitle className="text-sm">Slot Conflicts Detected</CardTitle></CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            {conflicts.map((item) => (
                                <div key={item.slot_id} className="rounded border border-amber-300 p-2 dark:border-amber-700">
                                    {item.name}: {item.active_ads} active ads targeting max {item.max_ads}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {slots.map((slot) => (
                        <Card key={slot.id}>
                            <CardHeader className="space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                    <CardTitle className="text-base">{slot.name}</CardTitle>
                                    <Badge variant={slot.is_active ? 'default' : 'secondary'}>{slot.is_active ? 'Active' : 'Inactive'}</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground capitalize">
                                    Page: {slot.page ?? 'all'} | Position: {slot.position}
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="text-sm">Allowed sizes: {(slot.allowed_sizes ?? []).join(', ') || 'Flexible'}</div>
                                <div className="text-sm">Active ads: <span className="font-semibold">{slot.active_ads_count}</span></div>
                                <div className="text-sm">Max ads: <span className="font-semibold">{slot.max_ads ?? 1}</span></div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Fill rate</p>
                                    <div className="mt-1 h-1.5 rounded bg-muted">
                                        <div className="h-1.5 rounded bg-primary" style={{ width: `${Math.min(100, slot.fill_rate)}%` }} />
                                    </div>
                                    <p className="mt-1 text-xs">{slot.fill_rate}%</p>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href={`/admin/ad-slots/${slot.id}/edit`}>Edit</Link>
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={() => destroySlot(slot.id)}>Delete</Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
