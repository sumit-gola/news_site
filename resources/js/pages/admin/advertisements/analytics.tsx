import { Head, router, usePage } from '@inertiajs/react';
import {
    BarChart2,
    ChevronLeft,
    MousePointerClick,
    Megaphone,
    TrendingUp,
    Eye,
} from 'lucide-react';
import * as React from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type {
    AdAnalyticsSummary,
    AdPlacementStat,
    AdTimeSeriesPoint,
    AdTopPerformer,
    BreadcrumbItem,
} from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Advertisements', href: '/admin/advertisements' },
    { title: 'Analytics', href: '/admin/advertisements/analytics' },
];

const PLACEMENT_COLORS: Record<string, string> = {
    header:  '#7c3aed',
    sidebar: '#2563eb',
    inline:  '#d97706',
    footer:  '#0d9488',
    popup:   '#e11d48',
};

interface PageProps {
    summary:       AdAnalyticsSummary;
    timeSeries:    AdTimeSeriesPoint[];
    topPerformers: AdTopPerformer[];
    byPlacement:   AdPlacementStat[];
    filters:       { date_from: string; date_to: string };
}

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, color }: {
    label: string; value: string | number; sub?: string;
    icon: React.ElementType; color: string;
}) {
    return (
        <Card className="flex items-center gap-4 p-5">
            <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${color}`}>
                <Icon className="size-5 text-white" />
            </div>
            <div>
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{label}</p>
                <p className="mt-0.5 text-2xl font-bold tabular-nums">{value}</p>
                {sub && <p className="text-muted-foreground text-xs">{sub}</p>}
            </div>
        </Card>
    );
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: Record<string, unknown>) {
    if (!active || !(payload as unknown[])?.length) return null;
    const p = payload as Array<{ name: string; value: number; color: string }>;
    return (
        <div className="bg-popover border rounded-lg p-3 shadow-lg text-sm">
            <p className="font-medium mb-1">{label as string}</p>
            {p.map((entry) => (
                <p key={entry.name} style={{ color: entry.color }}>
                    {entry.name}: <span className="font-semibold tabular-nums">{entry.value.toLocaleString()}</span>
                </p>
            ))}
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdvertisementsAnalytics({ summary, timeSeries, topPerformers, byPlacement, filters }: PageProps) {
    const [dateFrom, setDateFrom] = React.useState(filters.date_from);
    const [dateTo,   setDateTo]   = React.useState(filters.date_to);

    const applyFilters = () => {
        router.get('/admin/advertisements/analytics', { date_from: dateFrom, date_to: dateTo }, { preserveState: true, replace: true });
    };

    const totalImpressionsInSeries = timeSeries.reduce((s, p) => s + p.impressions, 0);
    const peakDay = timeSeries.reduce((best, p) => p.impressions > best.impressions ? p : best, { date: '—', impressions: 0 });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Ad Analytics" />

            <div className="flex flex-1 flex-col gap-6 p-6">

                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Ad Analytics</h1>
                        <p className="text-muted-foreground text-sm">Impressions, clicks, and CTR across all placements.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => router.visit('/admin/advertisements')}>
                        <ChevronLeft className="mr-1 size-4" /> Back to Ads
                    </Button>
                </div>

                {/* Date Range Filter */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">From</label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">To</label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                        />
                    </div>
                    <Button size="sm" onClick={applyFilters}>Apply</Button>
                    <Button variant="outline" size="sm" onClick={() => {
                        const from = new Date(); from.setDate(from.getDate() - 29);
                        setDateFrom(from.toISOString().slice(0, 10));
                        setDateTo(new Date().toISOString().slice(0, 10));
                    }}>
                        Last 30 Days
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => {
                        const now = new Date();
                        setDateFrom(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`);
                        setDateTo(now.toISOString().slice(0, 10));
                    }}>
                        This Month
                    </Button>
                </div>

                {/* KPI Cards */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <KpiCard label="Total Impressions" value={summary.impressions.toLocaleString()} icon={Eye}             color="bg-violet-500" />
                    <KpiCard label="Total Clicks"      value={summary.clicks.toLocaleString()}      icon={MousePointerClick} color="bg-blue-500"   />
                    <KpiCard label="Overall CTR"       value={`${summary.ctr}%`}                    icon={TrendingUp}       color="bg-emerald-500" sub="clicks ÷ impressions" />
                    <KpiCard label="Active Ads"        value={summary.active_ads}                   icon={Megaphone}        color="bg-amber-500"  />
                </div>

                {/* Time Series Chart */}
                <Card className="p-5">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h2 className="font-semibold">Impressions & Clicks Over Time</h2>
                            <p className="text-muted-foreground text-xs mt-0.5">
                                Peak: {peakDay.date} ({peakDay.impressions.toLocaleString()} impressions)
                            </p>
                        </div>
                        <p className="text-muted-foreground text-xs tabular-nums">{totalImpressionsInSeries.toLocaleString()} total</p>
                    </div>
                    {timeSeries.length === 0 ? (
                        <div className="flex h-48 items-center justify-center text-muted-foreground text-sm">No data for this period</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={260}>
                            <AreaChart data={timeSeries} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                                <defs>
                                    <linearGradient id="gImp" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gClk" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor="#2563eb" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip content={<ChartTooltip />} />
                                <Area type="monotone" dataKey="impressions" name="Impressions" stroke="#7c3aed" fill="url(#gImp)" strokeWidth={2} dot={false} />
                                <Area type="monotone" dataKey="clicks"      name="Clicks"      stroke="#2563eb" fill="url(#gClk)" strokeWidth={2} dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </Card>

                <div className="grid gap-6 xl:grid-cols-2">
                    {/* By Placement Bar Chart */}
                    <Card className="p-5">
                        <h2 className="font-semibold mb-4 flex items-center gap-2">
                            <BarChart2 className="size-4" /> Impressions by Placement
                        </h2>
                        {byPlacement.length === 0 ? (
                            <div className="flex h-40 items-center justify-center text-muted-foreground text-sm">No data</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={byPlacement} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                    <XAxis dataKey="placement" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Bar dataKey="impressions" name="Impressions" radius={[4, 4, 0, 0]}>
                                        {byPlacement.map((entry) => (
                                            <Cell key={entry.placement} fill={PLACEMENT_COLORS[entry.placement] ?? '#6b7280'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                        {byPlacement.length > 0 && (
                            <div className="mt-3 grid grid-cols-2 gap-2 border-t pt-3">
                                {byPlacement.map((p) => (
                                    <div key={p.placement} className="flex items-center justify-between text-xs">
                                        <span className="flex items-center gap-1.5">
                                            <span className="size-2 rounded-full" style={{ backgroundColor: PLACEMENT_COLORS[p.placement] ?? '#6b7280' }} />
                                            <span className="capitalize">{p.placement}</span>
                                        </span>
                                        <span className="font-medium tabular-nums">{p.ctr}% CTR</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* Top Performers Table */}
                    <Card className="p-5">
                        <h2 className="font-semibold mb-4 flex items-center gap-2">
                            <TrendingUp className="size-4" /> Top Performers by CTR
                        </h2>
                        {topPerformers.length === 0 ? (
                            <div className="flex h-40 items-center justify-center text-muted-foreground text-sm">No data</div>
                        ) : (
                            <div className="space-y-2">
                                {topPerformers.map((p, i) => (
                                    <div key={p.advertisement_id} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/40 transition-colors">
                                        <span className="text-muted-foreground w-5 text-center text-xs font-bold tabular-nums">{i + 1}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="truncate text-sm font-medium leading-tight">{p.title}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                {p.placement_type && (
                                                    <span className="text-[10px] text-muted-foreground capitalize">{p.placement_type}</span>
                                                )}
                                                {p.status && (
                                                    <Badge variant="outline" className="h-4 text-[9px] px-1 py-0">{p.status}</Badge>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-bold tabular-nums text-emerald-600">{p.ctr}%</p>
                                            <p className="text-[10px] text-muted-foreground tabular-nums">
                                                {p.clicks.toLocaleString()} / {p.impressions.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>

            </div>
        </AppLayout>
    );
}
