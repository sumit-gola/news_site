import { Head, Link, router } from '@inertiajs/react';
import AdListTable from '@/components/ads/AdListTable';
import DateRangePicker from '@/components/ads/DateRangePicker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { AdvertisementRecord, BreadcrumbItem, Paginated } from '@/types';

type Filters = {
    search?: string;
    status?: string;
    page?: string;
    position?: string;
    from_date?: string;
    to_date?: string;
};

type Props = {
    ads: Paginated<AdvertisementRecord>;
    filters: Filters;
    summary: {
        total: number;
        active: number;
        scheduled: number;
        expired: number;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Advertisements', href: '/admin/advertisements' },
];

export default function AdvertisementsIndex({ ads, filters, summary }: Props) {
    const applyFilter = (next: Partial<Filters>) => {
        router.get('/admin/advertisements', { ...filters, ...next }, { preserveState: true, preserveScroll: true, replace: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Advertisements" />

            <div className="grid gap-6 p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold">Advertisements</h1>
                        <p className="text-sm text-muted-foreground">Manage creative assets, schedule, and targeting.</p>
                    </div>
                    <Button asChild>
                        <Link href="/admin/advertisements/create">+ Create Ad</Link>
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total Ads</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{summary.total}</p></CardContent></Card>
                    <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Active</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{summary.active}</p></CardContent></Card>
                    <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Scheduled</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{summary.scheduled}</p></CardContent></Card>
                    <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Expired</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{summary.expired}</p></CardContent></Card>
                </div>

                <Card>
                    <CardContent className="grid gap-4 p-4 md:grid-cols-4">
                        <div className="space-y-1.5 md:col-span-2">
                            <Label htmlFor="search">Search</Label>
                            <Input
                                id="search"
                                defaultValue={filters.search ?? ''}
                                placeholder="Search ads..."
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        applyFilter({ search: (e.target as HTMLInputElement).value || undefined });
                                    }
                                }}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Status</Label>
                            <select
                                className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                                value={filters.status ?? ''}
                                onChange={(e) => applyFilter({ status: e.target.value || undefined })}
                            >
                                <option value="">All</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Page</Label>
                            <select
                                className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                                value={filters.page ?? ''}
                                onChange={(e) => applyFilter({ page: e.target.value || undefined })}
                            >
                                <option value="">All Pages</option>
                                <option value="home">Home</option>
                                <option value="article">Article</option>
                                <option value="category">Category</option>
                                <option value="search">Search</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Position</Label>
                            <select
                                className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                                value={filters.position ?? ''}
                                onChange={(e) => applyFilter({ position: e.target.value || undefined })}
                            >
                                <option value="">All Positions</option>
                                <option value="header">Header</option>
                                <option value="sidebar">Sidebar</option>
                                <option value="inline">Inline</option>
                                <option value="footer">Footer</option>
                                <option value="popup">Popup</option>
                            </select>
                        </div>

                        <div className="md:col-span-3">
                            <DateRangePicker
                                startDate={filters.from_date ?? ''}
                                endDate={filters.to_date ?? ''}
                                onStartDateChange={(value) => applyFilter({ from_date: value || undefined })}
                                onEndDateChange={(value) => applyFilter({ to_date: value || undefined })}
                            />
                        </div>

                        <div className="flex items-end justify-end gap-2">
                            <Button variant="outline" onClick={() => applyFilter({ search: undefined, status: undefined, page: undefined, position: undefined, from_date: undefined, to_date: undefined })}>
                                Reset
                            </Button>
                            <Button asChild variant="secondary">
                                <Link href="/admin/advertisements/analytics">Analytics</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>All Advertisements</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <AdListTable ads={ads} />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
