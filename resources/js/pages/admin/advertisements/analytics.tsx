import { Head } from '@inertiajs/react';
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

type Props = {
    summary: {
        total_ads: number;
        active_ads: number;
        impressions: number;
        clicks: number;
    };
    trend: TrendItem[];
    topAds: TopAd[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Advertisements', href: '/admin/advertisements' },
    { title: 'Analytics', href: '/admin/advertisements/analytics' },
];

export default function AdAnalyticsPage({ summary, trend, topAds }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Ad Analytics" />

            <div className="grid gap-6 p-6">
                <div>
                    <h1 className="text-2xl font-bold">Ad Analytics</h1>
                    <p className="text-sm text-muted-foreground">Performance overview with top campaigns and trends.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total Ads</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{summary.total_ads}</p></CardContent></Card>
                    <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Active Ads</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{summary.active_ads}</p></CardContent></Card>
                    <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Impressions</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{summary.impressions}</p></CardContent></Card>
                    <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Clicks</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{summary.clicks}</p></CardContent></Card>
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
                    <CardHeader><CardTitle>Last 30 Days</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Impressions</TableHead>
                                    <TableHead>Clicks</TableHead>
                                    <TableHead>CTR</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {trend.map((item) => (
                                    <TableRow key={item.date}>
                                        <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                                        <TableCell>{item.impressions}</TableCell>
                                        <TableCell>{item.clicks}</TableCell>
                                        <TableCell>{item.ctr}%</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
