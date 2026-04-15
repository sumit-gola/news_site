import { Head, Link } from '@inertiajs/react';
import { Download, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type TrendItem = {
    date: string;
    impressions: number;
    clicks: number;
    ctr: number;
};

type TopAd = {
    id: number;
    title: string;
    advertiser: string | null;
    impressions: number;
    clicks: number;
    ctr: number;
};

type BreakdownRow = {
    label: string;
    count?: number;
    impressions?: number;
    clicks?: number;
};

type InsightAd = {
    id: number;
    title: string;
    total_impressions?: number;
    total_clicks?: number;
    end_date?: string;
};

type Props = {
    summary: {
        total_ads: number;
        active_ads: number;
        impressions: number;
        clicks: number;
        ctr: number;
        spend: number;
    };
    trend: TrendItem[];
    topAds: TopAd[];
    breakdowns: {
        device: BreakdownRow[];
        page: BreakdownRow[];
        position: BreakdownRow[];
        slot: BreakdownRow[];
        advertiser: BreakdownRow[];
    };
    insights: {
        underperforming: InsightAd[];
        expiringSoon: InsightAd[];
    };
    period: '7d' | '30d' | '90d' | string;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Advertisements', href: '/admin/advertisements' },
    { title: 'Analytics', href: '/admin/advertisements/analytics' },
];

function BreakdownCard({ title, rows, unit = 'count' }: { title: string; rows: BreakdownRow[]; unit?: 'count' | 'impressions' | 'clicks' }) {
    const max = Math.max(...rows.map((row) => Number(row[unit] ?? row.count ?? 0)), 1);

    return (
        <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
                {rows.slice(0, 6).map((row) => {
                    const value = Number(row[unit] ?? row.count ?? 0);
                    const width = Math.max(8, Math.round((value / max) * 100));

                    return (
                        <div key={row.label}>
                            <div className="mb-1 flex items-center justify-between text-xs">
                                <span className="truncate">{row.label}</span>
                                <span className="font-medium">{value}</span>
                            </div>
                            <div className="h-1.5 rounded bg-muted">
                                <div className="h-1.5 rounded bg-primary" style={{ width: `${width}%` }} />
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}

export default function AdAnalyticsPage({ summary, trend, topAds, breakdowns, insights, period }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Ad Analytics" />

            <div className="grid gap-4 p-4 lg:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h1 className="text-2xl font-bold">Ad Analytics</h1>
                        <p className="text-sm text-muted-foreground">Performance insights across creatives, slots, audiences, and timing.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button asChild variant={period === '7d' ? 'default' : 'outline'} size="sm"><Link href="/admin/advertisements/analytics?period=7d">7D</Link></Button>
                        <Button asChild variant={period === '30d' ? 'default' : 'outline'} size="sm"><Link href="/admin/advertisements/analytics?period=30d">30D</Link></Button>
                        <Button asChild variant={period === '90d' ? 'default' : 'outline'} size="sm"><Link href="/admin/advertisements/analytics?period=90d">90D</Link></Button>
                        <Button asChild size="sm" variant="outline"><Link href={`/admin/advertisements/analytics/export?period=${period}`}><Download className="mr-1 size-4" />CSV</Link></Button>
                    </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                    <Card><CardHeader className="pb-1"><CardTitle className="text-xs">Total Ads</CardTitle></CardHeader><CardContent><p className="text-xl font-bold">{summary.total_ads}</p></CardContent></Card>
                    <Card><CardHeader className="pb-1"><CardTitle className="text-xs">Active Ads</CardTitle></CardHeader><CardContent><p className="text-xl font-bold">{summary.active_ads}</p></CardContent></Card>
                    <Card><CardHeader className="pb-1"><CardTitle className="text-xs">Impressions</CardTitle></CardHeader><CardContent><p className="text-xl font-bold">{summary.impressions.toLocaleString()}</p></CardContent></Card>
                    <Card><CardHeader className="pb-1"><CardTitle className="text-xs">Clicks</CardTitle></CardHeader><CardContent><p className="text-xl font-bold">{summary.clicks.toLocaleString()}</p></CardContent></Card>
                    <Card><CardHeader className="pb-1"><CardTitle className="text-xs">CTR</CardTitle></CardHeader><CardContent><p className="text-xl font-bold">{summary.ctr}%</p></CardContent></Card>
                    <Card><CardHeader className="pb-1"><CardTitle className="text-xs">Spend</CardTitle></CardHeader><CardContent><p className="text-xl font-bold">${summary.spend.toFixed(2)}</p></CardContent></Card>
                </div>

                <Card>
                    <CardHeader><CardTitle>Top Ads</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Ad</TableHead>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Impressions</TableHead>
                                    <TableHead>Clicks</TableHead>
                                    <TableHead>CTR</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {topAds.map((ad) => (
                                    <TableRow key={ad.id}>
                                        <TableCell>{ad.title}</TableCell>
                                        <TableCell>{ad.advertiser ?? '-'}</TableCell>
                                        <TableCell>{ad.impressions}</TableCell>
                                        <TableCell>{ad.clicks}</TableCell>
                                        <TableCell>{ad.ctr}%</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Trend</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {trend.map((item) => {
                                const score = Math.max(item.impressions, 1);
                                const fill = Math.min(100, Math.round((item.clicks / score) * 1000));

                                return (
                                    <div key={item.date} className="rounded-md border p-2">
                                        <div className="mb-1 flex items-center justify-between text-xs">
                                            <span>{new Date(item.date).toLocaleDateString()}</span>
                                            <span>{item.impressions} imp / {item.clicks} clk / {item.ctr}% CTR</span>
                                        </div>
                                        <div className="h-1.5 rounded bg-muted">
                                            <div className="h-1.5 rounded bg-primary" style={{ width: `${fill}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                    <BreakdownCard title="By Device" rows={breakdowns.device} />
                    <BreakdownCard title="By Page" rows={breakdowns.page} />
                    <BreakdownCard title="By Position" rows={breakdowns.position} />
                    <BreakdownCard title="Top Slots" rows={breakdowns.slot} unit="impressions" />
                    <BreakdownCard title="Top Advertisers" rows={breakdowns.advertiser} unit="clicks" />
                </div>

                <div className="grid gap-3 xl:grid-cols-2">
                    <Card>
                        <CardHeader><CardTitle className="text-base">Underperforming Ads</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            {insights.underperforming.length === 0 ? <p className="text-sm text-muted-foreground">No major underperformers in this period.</p> : insights.underperforming.map((ad) => (
                                <div key={ad.id} className="rounded-md border p-2 text-sm">
                                    <p className="font-medium">{ad.title}</p>
                                    <p className="text-xs text-muted-foreground">{ad.total_clicks ?? 0} clicks / {ad.total_impressions ?? 0} impressions</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="text-base">Expiring Soon</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            {insights.expiringSoon.length === 0 ? <p className="text-sm text-muted-foreground">No active ads expiring soon.</p> : insights.expiringSoon.map((ad) => (
                                <div key={ad.id} className="rounded-md border p-2 text-sm">
                                    <p className="font-medium">{ad.title}</p>
                                    <p className="text-xs text-muted-foreground">Ends {ad.end_date ? new Date(ad.end_date).toLocaleDateString() : '-'}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-100">
                    <TrendingDown className="size-4" />
                    Review underperforming ads weekly and use A/B variants before archiving.
                </div>
            </div>
        </AppLayout>
    );
}
