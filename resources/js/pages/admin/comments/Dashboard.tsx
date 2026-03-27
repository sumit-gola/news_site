import { Head, Link } from '@inertiajs/react';
import {
    MessageSquare, Clock, CheckCircle2, XCircle, AlertTriangle, Trash2,
    Users, UserCheck, TrendingUp, BarChart3, Calendar, ExternalLink,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types/auth';

type CommentRecord = {
    id: number;
    body: string;
    status: 'pending' | 'approved' | 'rejected' | 'spam';
    author_name: string;
    author_initials: string;
    guest_email: string | null;
    article: { id: number; title: string; slug: string } | null;
    user: { id: number; name: string } | null;
    created_at: string;
    deleted_at: string | null;
};

type TrendDay = { date: string; label: string; count: number };

type Props = {
    stats: {
        total: number;
        active: number;
        trashed: number;
        pending: number;
        approved: number;
        rejected: number;
        spam: number;
        today: number;
        this_week: number;
        members: number;
        guests: number;
        approval_rate: number;
    };
    topArticles: Array<{ article: { id: number; title: string; slug: string } | null; count: number }>;
    recent: CommentRecord[];
    trend: TrendDay[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Comments', href: '/admin/comments' },
    { title: 'Overview', href: '/admin/comments/dashboard' },
];

const STATUS_CFG = {
    pending:  { label: 'Pending',  cls: 'bg-amber-100  text-amber-700  dark:bg-amber-950/40  dark:text-amber-300',  Icon: Clock },
    approved: { label: 'Approved', cls: 'bg-green-100  text-green-700  dark:bg-green-950/40  dark:text-green-300',  Icon: CheckCircle2 },
    rejected: { label: 'Rejected', cls: 'bg-red-100    text-red-700    dark:bg-red-950/40    dark:text-red-300',    Icon: XCircle },
    spam:     { label: 'Spam',     cls: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300', Icon: AlertTriangle },
} as const;

function StatusBadge({ status }: { status: CommentRecord['status'] }) {
    const { label, cls, Icon } = STATUS_CFG[status] ?? STATUS_CFG.pending;
    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
            <Icon className="size-3" />
            {label}
        </span>
    );
}

function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function StatCard({
    label, value, sub, color, Icon, href,
}: {
    label: string; value: number | string; sub?: string; color: string; Icon: React.ElementType; href?: string;
}) {
    const inner = (
        <Card className="group transition hover:shadow-md">
            <CardContent className="flex items-start justify-between gap-3 p-4">
                <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className={`mt-0.5 text-3xl font-bold ${color}`}>{value}</p>
                    {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
                </div>
                <div className={`rounded-xl p-2.5 ${color.replace('text-', 'bg-').replace('-600', '-100').replace('-300', '-900/30')}`}>
                    <Icon className={`size-5 ${color}`} />
                </div>
            </CardContent>
        </Card>
    );
    return href ? <Link href={href}>{inner}</Link> : inner;
}

function MiniTrendBar({ trend }: { trend: TrendDay[] }) {
    const max = Math.max(...trend.map((d) => d.count), 1);
    return (
        <div className="flex h-16 items-end gap-1">
            {trend.map((day) => (
                <div key={day.date} className="group relative flex flex-1 flex-col items-center gap-1">
                    <div
                        className="w-full rounded-t bg-indigo-500/70 transition group-hover:bg-indigo-500"
                        style={{ height: `${Math.max((day.count / max) * 100, 4)}%` }}
                    />
                    <span className="text-[9px] text-muted-foreground">{day.label}</span>
                    <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 rounded bg-foreground px-1.5 py-0.5 text-[10px] text-background opacity-0 transition group-hover:opacity-100 whitespace-nowrap">
                        {day.count} on {day.date}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function CommentDashboard({ stats, topArticles, recent, trend }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Comment Dashboard" />
            <div className="space-y-6 p-6">

                {/* Page header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="flex items-center gap-2 text-xl font-bold">
                            <MessageSquare className="size-5 text-indigo-500" />
                            Comment Overview
                        </h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">Moderation stats and activity at a glance</p>
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" asChild>
                            <Link href="/admin/comments"><MessageSquare className="mr-1.5 size-3.5" />All Comments</Link>
                        </Button>
                        {stats.pending > 0 && (
                            <Button size="sm" asChild>
                                <Link href="/admin/comments?status=pending">
                                    <Clock className="mr-1.5 size-3.5" />
                                    Review {stats.pending} pending
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Top stat cards */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                    <StatCard label="Total" value={stats.total} color="text-foreground" Icon={MessageSquare} href="/admin/comments" />
                    <StatCard label="Pending" value={stats.pending} color="text-amber-600" Icon={Clock} sub="Needs review" href="/admin/comments?status=pending" />
                    <StatCard label="Approved" value={stats.approved} color="text-green-600" Icon={CheckCircle2} href="/admin/comments?status=approved" />
                    <StatCard label="Rejected" value={stats.rejected} color="text-red-600" Icon={XCircle} href="/admin/comments?status=rejected" />
                    <StatCard label="Spam" value={stats.spam} color="text-orange-600" Icon={AlertTriangle} href="/admin/comments?status=spam" />
                    <StatCard label="Trashed" value={stats.trashed} color="text-muted-foreground" Icon={Trash2} href="/admin/comments?trashed=true" />
                </div>

                {/* Second row */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard label="Today" value={stats.today} color="text-indigo-600" Icon={Calendar} sub="New comments" />
                    <StatCard label="This Week" value={stats.this_week} color="text-purple-600" Icon={TrendingUp} sub="Last 7 days" />
                    <StatCard label="Members" value={stats.members} color="text-blue-600" Icon={UserCheck} sub={`${stats.guests} guest(s)`} />
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-xs text-muted-foreground">Approval Rate</p>
                            <p className="mt-0.5 text-3xl font-bold text-green-600">{stats.approval_rate}%</p>
                            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-full rounded-full bg-green-500 transition-all"
                                    style={{ width: `${stats.approval_rate}%` }}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Activity trend + top articles */}
                <div className="grid gap-4 lg:grid-cols-2">
                    {/* 7-day trend */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm">
                                <BarChart3 className="size-4 text-indigo-500" />
                                7-Day Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            <MiniTrendBar trend={trend} />
                        </CardContent>
                    </Card>

                    {/* Member vs Guest */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm">
                                <Users className="size-4 text-indigo-500" />
                                Author Breakdown
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 px-4 pb-4">
                            {[
                                { label: 'Members', value: stats.members, color: 'bg-blue-500' },
                                { label: 'Guests',  value: stats.guests,  color: 'bg-purple-400' },
                            ].map((row) => {
                                const total = stats.members + stats.guests || 1;
                                return (
                                    <div key={row.label}>
                                        <div className="mb-1 flex items-center justify-between text-xs">
                                            <span className="font-medium">{row.label}</span>
                                            <span className="text-muted-foreground">{row.value} ({Math.round((row.value / total) * 100)}%)</span>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                                            <div className={`h-full rounded-full ${row.color}`} style={{ width: `${(row.value / total) * 100}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                            <div className="mt-2 grid grid-cols-3 gap-2 pt-1">
                                {(['pending', 'approved', 'rejected'] as const).map((s) => {
                                    const { label, cls, Icon } = STATUS_CFG[s];
                                    return (
                                        <Link key={s} href={`/admin/comments?status=${s}`}
                                            className={`flex flex-col items-center gap-0.5 rounded-lg border p-2 text-xs transition hover:shadow-sm ${cls}`}>
                                            <Icon className="size-3.5" />
                                            <span className="font-semibold">{stats[s]}</span>
                                            <span>{label}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Top articles + Recent comments */}
                <div className="grid gap-4 lg:grid-cols-2">
                    {/* Top commented articles */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2">
                                    <TrendingUp className="size-4 text-indigo-500" />
                                    Most Commented Articles
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {topArticles.length === 0 ? (
                                <p className="px-4 py-6 text-center text-sm text-muted-foreground">No data yet.</p>
                            ) : (
                                <div className="divide-y">
                                    {topArticles.map((row, i) => (
                                        <div key={i} className="flex items-center gap-3 px-4 py-3">
                                            <span className="w-5 text-center text-xs font-black text-indigo-400">{i + 1}</span>
                                            <div className="min-w-0 flex-1">
                                                {row.article ? (
                                                    <Link
                                                        href={`/news/${row.article.slug}`}
                                                        target="_blank"
                                                        className="flex items-center gap-1 text-sm font-medium hover:text-indigo-600 hover:underline"
                                                    >
                                                        <span className="line-clamp-1">{row.article.title}</span>
                                                        <ExternalLink className="size-3 shrink-0 text-muted-foreground" />
                                                    </Link>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">Deleted article</span>
                                                )}
                                            </div>
                                            <Badge variant="secondary" className="shrink-0 font-bold">{row.count}</Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent comments */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2">
                                    <MessageSquare className="size-4 text-indigo-500" />
                                    Recent Comments
                                </span>
                                <Link href="/admin/comments" className="text-xs font-normal text-indigo-600 hover:underline dark:text-indigo-400">
                                    View all
                                </Link>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {recent.length === 0 ? (
                                <p className="px-4 py-6 text-center text-sm text-muted-foreground">No comments yet.</p>
                            ) : (
                                <div className="divide-y">
                                    {recent.map((c) => (
                                        <div key={c.id} className="flex items-start gap-3 px-4 py-3">
                                            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white">
                                                {c.author_initials}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <span className="text-xs font-semibold">{c.author_name}</span>
                                                    <StatusBadge status={c.status} />
                                                    {c.deleted_at && (
                                                        <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-600 dark:bg-red-950/30 dark:text-red-400">Trashed</span>
                                                    )}
                                                </div>
                                                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{c.body}</p>
                                                <div className="mt-0.5 flex items-center gap-2">
                                                    {c.article && (
                                                        <span className="line-clamp-1 text-[10px] text-indigo-600 dark:text-indigo-400">{c.article.title}</span>
                                                    )}
                                                    <span className="text-[10px] text-muted-foreground">{timeAgo(c.created_at)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
