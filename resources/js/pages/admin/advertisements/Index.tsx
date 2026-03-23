import { Head, Link, router } from '@inertiajs/react';
import { Pin, Sparkles, TriangleAlert } from 'lucide-react';
import AdListTable from '@/components/ads/AdListTable';
import DateRangePicker from '@/components/ads/DateRangePicker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { AdvertisementRecord, BreadcrumbItem, Paginated } from '@/types';

type Filters = {
    search?: string;
    status?: string;
    workflow_status?: string;
    ad_type?: string;
    page?: string;
    position?: string;
    slot_id?: string;
    advertiser_id?: string;
    has_media?: string;
    is_pinned?: string;
    from_date?: string;
    to_date?: string;
    sort_by?: string;
    sort_dir?: 'asc' | 'desc';
    per_page?: string;
};

type Props = {
    ads: Paginated<AdvertisementRecord>;
    filters: Filters;
    summary: {
        total: number;
        active: number;
        scheduled: number;
        expired: number;
        underperforming: number;
        expiring_soon: number;
    };
    options: {
        advertisers: Array<{ id: number; name: string }>;
        slots: Array<{ id: number; name: string; position: string; page: string | null }>;
    };
    presets: Array<{ id: string; label: string; filters: Partial<Filters> }>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Advertisements', href: '/admin/advertisements' },
];

export default function AdvertisementsIndex({ ads, filters, summary, options, presets }: Props) {
    const applyFilter = (next: Partial<Filters>) => {
        router.get('/admin/advertisements', { ...filters, ...next }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const applyPreset = (presetFilters: Partial<Filters>) => {
        router.get('/admin/advertisements', { ...filters, ...presetFilters }, { preserveState: true, preserveScroll: true, replace: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Advertisements" />

            <div className="grid gap-4 p-4 lg:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold">Advertisements</h1>
                        <p className="text-sm text-muted-foreground">Modern ad operations: targeting, workflow, bulk actions, and optimization.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button asChild variant="outline"><Link href="/admin/advertisements/analytics">Analytics</Link></Button>
                        <Button asChild><Link href="/admin/advertisements/create">+ Create Ad</Link></Button>
                    </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                    <Card><CardHeader className="pb-1"><CardTitle className="text-xs">Total</CardTitle></CardHeader><CardContent><p className="text-xl font-bold">{summary.total}</p></CardContent></Card>
                    <Card><CardHeader className="pb-1"><CardTitle className="text-xs">Active</CardTitle></CardHeader><CardContent><p className="text-xl font-bold">{summary.active}</p></CardContent></Card>
                    <Card><CardHeader className="pb-1"><CardTitle className="text-xs">Scheduled</CardTitle></CardHeader><CardContent><p className="text-xl font-bold">{summary.scheduled}</p></CardContent></Card>
                    <Card><CardHeader className="pb-1"><CardTitle className="text-xs">Expired</CardTitle></CardHeader><CardContent><p className="text-xl font-bold">{summary.expired}</p></CardContent></Card>
                    <Card><CardHeader className="pb-1"><CardTitle className="text-xs">Underperforming</CardTitle></CardHeader><CardContent><p className="text-xl font-bold">{summary.underperforming}</p></CardContent></Card>
                    <Card><CardHeader className="pb-1"><CardTitle className="text-xs">Expiring Soon</CardTitle></CardHeader><CardContent><p className="text-xl font-bold">{summary.expiring_soon}</p></CardContent></Card>
                </div>

                <Card className="sticky top-0 z-30 border-dashed">
                    <CardContent className="space-y-3 p-3">
                        <div className="flex flex-wrap items-center gap-2">
                            {presets.map((preset) => (
                                <Button key={preset.id} size="sm" variant="outline" onClick={() => applyPreset(preset.filters)}>
                                    <Sparkles className="mr-1 size-3.5" /> {preset.label}
                                </Button>
                            ))}
                            <Button size="sm" variant="ghost" onClick={() => applyFilter({ search: undefined, status: undefined, workflow_status: undefined, ad_type: undefined, page: undefined, position: undefined, slot_id: undefined, advertiser_id: undefined, has_media: undefined, is_pinned: undefined, from_date: undefined, to_date: undefined, sort_by: undefined, sort_dir: undefined, per_page: undefined })}>Reset</Button>
                        </div>

                        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-6">
                            <div className="space-y-1 xl:col-span-2">
                                <Label htmlFor="search">Search</Label>
                                <Input
                                    id="search"
                                    defaultValue={filters.search ?? ''}
                                    placeholder="Title or campaign"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            applyFilter({ search: (e.target as HTMLInputElement).value || undefined });
                                        }
                                    }}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>Status</Label>
                                <select className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm" value={filters.status ?? ''} onChange={(e) => applyFilter({ status: e.target.value || undefined })}>
                                    <option value="">All</option>
                                    <option value="active">Active</option>
                                    <option value="paused">Paused</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <Label>Workflow</Label>
                                <select className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm" value={filters.workflow_status ?? ''} onChange={(e) => applyFilter({ workflow_status: e.target.value || undefined })}>
                                    <option value="">All</option>
                                    <option value="draft">Draft</option>
                                    <option value="pending_review">Pending</option>
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <Label>Type</Label>
                                <select className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm" value={filters.ad_type ?? ''} onChange={(e) => applyFilter({ ad_type: e.target.value || undefined })}>
                                    <option value="">All</option>
                                    <option value="image">Image</option>
                                    <option value="html">HTML</option>
                                    <option value="script">Script</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <Label>Position</Label>
                                <select className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm" value={filters.position ?? ''} onChange={(e) => applyFilter({ position: e.target.value || undefined })}>
                                    <option value="">All</option>
                                    <option value="header">Header</option>
                                    <option value="sidebar">Sidebar</option>
                                    <option value="inline">Inline</option>
                                    <option value="footer">Footer</option>
                                    <option value="popup">Popup</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-6">
                            <div className="space-y-1">
                                <Label>Page</Label>
                                <select className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm" value={filters.page ?? ''} onChange={(e) => applyFilter({ page: e.target.value || undefined })}>
                                    <option value="">All</option>
                                    <option value="home">Home</option>
                                    <option value="article">Article</option>
                                    <option value="category">Category</option>
                                    <option value="search">Search</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <Label>Slot</Label>
                                <select className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm" value={filters.slot_id ?? ''} onChange={(e) => applyFilter({ slot_id: e.target.value || undefined })}>
                                    <option value="">All</option>
                                    {options.slots.map((slot) => <option key={slot.id} value={slot.id}>{slot.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <Label>Advertiser</Label>
                                <select className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm" value={filters.advertiser_id ?? ''} onChange={(e) => applyFilter({ advertiser_id: e.target.value || undefined })}>
                                    <option value="">All</option>
                                    {options.advertisers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <Label>Has Media</Label>
                                <select className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm" value={filters.has_media ?? ''} onChange={(e) => applyFilter({ has_media: e.target.value || undefined })}>
                                    <option value="">All</option>
                                    <option value="1">Yes</option>
                                    <option value="0">No</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <Label>Pinned</Label>
                                <select className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm" value={filters.is_pinned ?? ''} onChange={(e) => applyFilter({ is_pinned: e.target.value || undefined })}>
                                    <option value="">All</option>
                                    <option value="1">Pinned</option>
                                    <option value="0">Not pinned</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <Label>Per Page</Label>
                                <select className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm" value={filters.per_page ?? '15'} onChange={(e) => applyFilter({ per_page: e.target.value || undefined })}>
                                    <option value="15">15</option>
                                    <option value="30">30</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid gap-2 xl:grid-cols-3">
                            <DateRangePicker
                                startDate={filters.from_date ?? ''}
                                endDate={filters.to_date ?? ''}
                                onStartDateChange={(value) => applyFilter({ from_date: value || undefined })}
                                onEndDateChange={(value) => applyFilter({ to_date: value || undefined })}
                            />
                            <div className="space-y-1">
                                <Label>Sort By</Label>
                                <select className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm" value={filters.sort_by ?? 'priority'} onChange={(e) => applyFilter({ sort_by: e.target.value || undefined })}>
                                    <option value="priority">Priority</option>
                                    <option value="created_at">Created Date</option>
                                    <option value="start_date">Start Date</option>
                                    <option value="end_date">End Date</option>
                                    <option value="title">Title</option>
                                    <option value="total_impressions">Impressions</option>
                                    <option value="total_clicks">Clicks</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <Label>Direction</Label>
                                <select className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm" value={filters.sort_dir ?? 'desc'} onChange={(e) => applyFilter({ sort_dir: e.target.value as 'asc' | 'desc' })}>
                                    <option value="desc">Descending</option>
                                    <option value="asc">Ascending</option>
                                </select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-3 md:grid-cols-2">
                    <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-100">
                        <TriangleAlert className="size-4" /> {summary.underperforming} ads are underperforming.
                    </div>
                    <div className="flex items-center gap-2 rounded-md border border-blue-300 bg-blue-50 p-3 text-sm text-blue-900 dark:border-blue-700 dark:bg-blue-950/30 dark:text-blue-100">
                        <Pin className="size-4" /> {summary.expiring_soon} ads are expiring in 7 days.
                    </div>
                </div>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">All Advertisements</CardTitle>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline">Fast Bulk Actions</Badge>
                            <Badge variant="outline">Column Picker</Badge>
                            <Badge variant="outline">Card/Table View</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <AdListTable ads={ads} slots={options.slots.map((slot) => ({ id: slot.id, name: slot.name }))} />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
