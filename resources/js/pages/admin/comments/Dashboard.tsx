import { Head, Link, router } from '@inertiajs/react';
import {
    MessageSquare, Clock, CheckCircle2, XCircle, AlertTriangle, Trash2,
    Users, UserCheck, TrendingUp, BarChart3, Calendar, ExternalLink,
    ShieldCheck, ArrowRight, Zap, Activity,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

/* ─── Types ─────────────────────────────────────────────── */
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
        total: number; active: number; trashed: number;
        pending: number; approved: number; rejected: number; spam: number;
        today: number; this_week: number; members: number; guests: number;
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

/* ─── Status config ─────────────────────────────────────── */
const S = {
    pending:  { label: 'Pending',  dot: 'bg-amber-400',  pill: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',  Icon: Clock,          bar: 'bg-amber-400',  strip: 'bg-amber-400' },
    approved: { label: 'Approved', dot: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', Icon: CheckCircle2, bar: 'bg-emerald-500', strip: 'bg-emerald-500' },
    rejected: { label: 'Rejected', dot: 'bg-red-500',    pill: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',          Icon: XCircle,        bar: 'bg-red-500',    strip: 'bg-red-500' },
    spam:     { label: 'Spam',     dot: 'bg-orange-500', pill: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300', Icon: AlertTriangle,  bar: 'bg-orange-500', strip: 'bg-orange-500' },
} as const;

/* ─── Helpers ───────────────────────────────────────────── */
function timeAgo(iso: string) {
    const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function StatusPill({ status }: { status: CommentRecord['status'] }) {
    const c = S[status] ?? S.pending;
    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${c.pill}`}>
            <span className={`size-1.5 rounded-full ${c.dot}`} />
            {c.label}
        </span>
    );
}

/* gradient avatar colours cycling */
const AVATAR_GRADIENTS = [
    'from-violet-500 to-purple-600',
    'from-blue-500 to-indigo-600',
    'from-teal-500 to-cyan-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-emerald-500 to-green-600',
];

/* ─── Compact stat tile ─────────────────────────────────── */
function Tile({
    label, value, sub, icon: Icon, strip, href,
}: {
    label: string; value: number | string; sub?: string;
    icon: React.ElementType; strip: string; href?: string;
}) {
    const inner = (
        <div className="group relative overflow-hidden rounded-xl border bg-card px-4 py-3 transition hover:shadow-sm">
            <div className={`absolute inset-y-0 left-0 w-0.5 rounded-l-xl ${strip}`} />
            <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                    <p className="truncate text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
                    <p className="mt-0.5 text-2xl font-bold leading-none tracking-tight">{value}</p>
                    {sub && <p className="mt-1 text-[11px] text-muted-foreground">{sub}</p>}
                </div>
                <div className={`shrink-0 rounded-lg p-2 ${strip.replace('-400', '-100').replace('-500', '-100')} opacity-80 dark:opacity-60`}>
                    <Icon className={`size-4 ${strip.replace('bg-', 'text-')}`} />
                </div>
            </div>
        </div>
    );
    return href ? <Link href={href}>{inner}</Link> : inner;
}

/* ─── Section header ────────────────────────────────────── */
function SH({ icon: Icon, title, action }: { icon: React.ElementType; title: string; action?: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between border-b px-4 py-2.5">
            <div className="flex items-center gap-1.5">
                <Icon className="size-3.5 text-muted-foreground" />
                <span className="text-[13px] font-semibold">{title}</span>
            </div>
            {action}
        </div>
    );
}

/* ─── Trend bars ────────────────────────────────────────── */
function TrendBars({ trend }: { trend: TrendDay[] }) {
    const max = Math.max(...trend.map((d) => d.count), 1);
    const total = trend.reduce((a, b) => a + b.count, 0);
    return (
        <div className="px-4 pb-4 pt-3">
            <div className="mb-1 flex items-end justify-between text-[10px] text-muted-foreground">
                <span>{total} total</span>
                <span>peak: {max}</span>
            </div>
            <div className="flex h-20 items-end gap-1.5">
                {trend.map((day) => (
                    <div key={day.date} className="group relative flex flex-1 flex-col items-center gap-1">
                        {/* tooltip */}
                        <div className="pointer-events-none absolute -top-7 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border bg-popover px-2 py-1 text-[10px] font-medium shadow-md opacity-0 transition group-hover:opacity-100">
                            {day.count} · {day.date}
                        </div>
                        <div
                            className="w-full rounded-t-sm bg-indigo-500/30 transition-all group-hover:bg-indigo-500"
                            style={{ height: `${Math.max((day.count / max) * 100, 6)}%` }}
                        />
                        <span className="text-[9px] font-medium text-muted-foreground">{day.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ─── Donut ring for approval rate ─────────────────────── */
function ApprovalRing({ rate }: { rate: number }) {
    const r = 28;
    const circ = 2 * Math.PI * r;
    const filled = (rate / 100) * circ;
    return (
        <div className="flex flex-col items-center justify-center gap-1 py-2">
            <svg width={72} height={72} viewBox="0 0 72 72">
                <circle cx="36" cy="36" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/40" />
                <circle
                    cx="36" cy="36" r={r} fill="none"
                    stroke="currentColor" strokeWidth="6"
                    strokeDasharray={`${filled} ${circ}`}
                    strokeLinecap="round"
                    strokeDashoffset={circ / 4}
                    className="text-emerald-500 transition-all"
                />
                <text x="36" y="40" textAnchor="middle" className="fill-foreground text-[14px] font-bold" fontSize="14" fontWeight="700">
                    {rate}%
                </text>
            </svg>
            <p className="text-[11px] font-medium text-muted-foreground">Approval Rate</p>
        </div>
    );
}

/* ─── Main component ────────────────────────────────────── */
export default function CommentDashboard({ stats, topArticles, recent, trend }: Props) {
    function approve(id: number) { router.patch(`/admin/comments/${id}/approve`); }
    function reject(id: number)  { router.patch(`/admin/comments/${id}/reject`);  }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Comment Dashboard" />
            <div className="flex flex-1 flex-col gap-3 p-3 md:p-4">

                {/* ── Header ── */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="flex items-center gap-2 text-lg font-bold tracking-tight">
                            <span className="rounded-lg bg-indigo-100 p-1.5 dark:bg-indigo-900/30">
                                <MessageSquare className="size-4 text-indigo-600 dark:text-indigo-400" />
                            </span>
                            Comment Overview
                        </h1>
                        <p className="mt-0.5 text-xs text-muted-foreground">Moderation stats and activity at a glance</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" asChild>
                            <Link href="/admin/comments">
                                <MessageSquare className="size-3.5" /> All Comments
                            </Link>
                        </Button>
                        {stats.pending > 0 && (
                            <Button size="sm" className="h-8 gap-1.5 bg-amber-500 text-xs hover:bg-amber-600" asChild>
                                <Link href="/admin/comments?status=pending">
                                    <Clock className="size-3.5" /> Review {stats.pending}
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>

                {/* ── 6 Primary stat tiles ── */}
                <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
                    <Tile label="Total"    value={stats.total}    icon={MessageSquare} strip="bg-slate-400"   href="/admin/comments" />
                    <Tile label="Pending"  value={stats.pending}  icon={Clock}         strip="bg-amber-400"  sub="needs review" href="/admin/comments?status=pending" />
                    <Tile label="Approved" value={stats.approved} icon={CheckCircle2}  strip="bg-emerald-500" href="/admin/comments?status=approved" />
                    <Tile label="Rejected" value={stats.rejected} icon={XCircle}       strip="bg-red-500"    href="/admin/comments?status=rejected" />
                    <Tile label="Spam"     value={stats.spam}     icon={AlertTriangle} strip="bg-orange-500" href="/admin/comments?status=spam" />
                    <Tile label="Trashed"  value={stats.trashed}  icon={Trash2}        strip="bg-zinc-400"   href="/admin/comments?trashed=true" />
                </div>

                {/* ── Secondary tiles ── */}
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <Tile label="Today"     value={stats.today}     icon={Calendar}  strip="bg-indigo-500" sub="new today" />
                    <Tile label="This Week" value={stats.this_week} icon={TrendingUp} strip="bg-purple-500" sub="last 7 days" />
                    <Tile label="Members"   value={stats.members}   icon={UserCheck}  strip="bg-blue-500"  sub={`+ ${stats.guests} guest(s)`} />
                    <Tile label="Active"    value={stats.active}    icon={ShieldCheck} strip="bg-teal-500" sub="not trashed" />
                </div>

                {/* ── Middle row: trend + breakdown + approval ── */}
                <div className="grid gap-3 lg:grid-cols-3">

                    {/* 7-day trend */}
                    <Card className="overflow-hidden">
                        <SH icon={BarChart3} title="7-Day Activity"
                            action={<span className="text-[10px] text-muted-foreground">{trend.reduce((a, b) => a + b.count, 0)} comments</span>}
                        />
                        <TrendBars trend={trend} />
                    </Card>

                    {/* Author breakdown */}
                    <Card className="overflow-hidden">
                        <SH icon={Users} title="Author Breakdown" />
                        <div className="space-y-2.5 px-4 py-3">
                            {[
                                { label: 'Members', value: stats.members, bar: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400' },
                                { label: 'Guests',  value: stats.guests,  bar: 'bg-violet-400', text: 'text-violet-600 dark:text-violet-400' },
                            ].map((row) => {
                                const tot = (stats.members + stats.guests) || 1;
                                const pct = Math.round((row.value / tot) * 100);
                                return (
                                    <div key={row.label}>
                                        <div className="mb-1 flex items-center justify-between">
                                            <span className="text-[11px] font-semibold">{row.label}</span>
                                            <span className={`text-[11px] font-bold ${row.text}`}>{row.value} <span className="font-normal text-muted-foreground">({pct}%)</span></span>
                                        </div>
                                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                            <div className={`h-full rounded-full ${row.bar} transition-all`} style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}

                            {/* status mini grid */}
                            <div className="mt-1 grid grid-cols-3 gap-1.5 pt-1">
                                {(['pending', 'approved', 'rejected'] as const).map((st) => {
                                    const { label, pill, Icon } = S[st];
                                    return (
                                        <Link key={st} href={`/admin/comments?status=${st}`}
                                            className={`flex flex-col items-center gap-1 rounded-lg border py-2 text-center transition hover:shadow-sm ${pill}`}>
                                            <Icon className="size-3.5" />
                                            <span className="text-[13px] font-bold">{stats[st]}</span>
                                            <span className="text-[10px] font-medium">{label}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </Card>

                    {/* Approval rate donut */}
                    <Card className="overflow-hidden">
                        <SH icon={ShieldCheck} title="Moderation Health" />
                        <div className="px-4 py-2">
                            <ApprovalRing rate={stats.approval_rate} />
                            <div className="mt-2 divide-y rounded-lg border">
                                {[
                                    { label: 'Approved', value: stats.approved, color: 'text-emerald-600 dark:text-emerald-400' },
                                    { label: 'Rejected', value: stats.rejected, color: 'text-red-600 dark:text-red-400' },
                                    { label: 'Spam',     value: stats.spam,     color: 'text-orange-600 dark:text-orange-400' },
                                ].map((row) => (
                                    <div key={row.label} className="flex items-center justify-between px-3 py-1.5">
                                        <span className="text-[11px] text-muted-foreground">{row.label}</span>
                                        <span className={`text-[12px] font-bold ${row.color}`}>{row.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* ── Bottom row: top articles + recent comments ── */}
                <div className="grid gap-3 lg:grid-cols-5">

                    {/* Most commented articles */}
                    <Card className="overflow-hidden lg:col-span-2">
                        <SH icon={TrendingUp} title="Most Commented"
                            action={
                                <Link href="/articles" className="flex items-center gap-0.5 text-[11px] text-muted-foreground transition hover:text-foreground">
                                    All <ArrowRight className="size-3" />
                                </Link>
                            }
                        />
                        {topArticles.length === 0 ? (
                            <p className="px-4 py-6 text-center text-xs text-muted-foreground">No data yet.</p>
                        ) : (
                            <div className="divide-y">
                                {topArticles.map((row, i) => (
                                    <div key={i} className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-muted/40">
                                        {/* rank */}
                                        <span className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                                            i === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30'
                                            : i === 1 ? 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                            : i === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30'
                                            : 'bg-muted text-muted-foreground'
                                        }`}>{i + 1}</span>
                                        <div className="min-w-0 flex-1">
                                            {row.article ? (
                                                <Link
                                                    href={`/news/${row.article.slug}`}
                                                    target="_blank"
                                                    className="flex items-center gap-1 text-[12px] font-medium transition hover:text-indigo-600 hover:underline"
                                                >
                                                    <span className="line-clamp-1">{row.article.title}</span>
                                                    <ExternalLink className="size-3 shrink-0 text-muted-foreground" />
                                                </Link>
                                            ) : (
                                                <span className="text-[12px] text-muted-foreground italic">Deleted article</span>
                                            )}
                                        </div>
                                        <span className="shrink-0 rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-bold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                                            {row.count}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* Recent comments with quick actions */}
                    <Card className="overflow-hidden lg:col-span-3">
                        <SH icon={MessageSquare} title="Recent Comments"
                            action={
                                <Link href="/admin/comments" className="flex items-center gap-0.5 text-[11px] text-muted-foreground transition hover:text-foreground">
                                    All <ArrowRight className="size-3" />
                                </Link>
                            }
                        />
                        {recent.length === 0 ? (
                            <p className="px-4 py-6 text-center text-xs text-muted-foreground">No comments yet.</p>
                        ) : (
                            <div className="divide-y">
                                {recent.map((c, idx) => (
                                    <div key={c.id} className="flex items-start gap-3 px-4 py-2.5 transition hover:bg-muted/40">
                                        {/* avatar */}
                                        <div className={`flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length]} text-[11px] font-bold text-white shadow-sm`}>
                                            {c.author_initials}
                                        </div>
                                        {/* content */}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <span className="text-[12px] font-semibold">{c.author_name}</span>
                                                <StatusPill status={c.status} />
                                                {c.deleted_at && (
                                                    <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-semibold text-red-600 dark:bg-red-900/30 dark:text-red-400">
                                                        Trashed
                                                    </span>
                                                )}
                                                <span className="ml-auto text-[10px] text-muted-foreground">{timeAgo(c.created_at)}</span>
                                            </div>
                                            <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">{c.body}</p>
                                            {c.article && (
                                                <p className="mt-0.5 truncate text-[10px] text-indigo-600/70 dark:text-indigo-400/70">
                                                    ↳ {c.article.title}
                                                </p>
                                            )}
                                        </div>
                                        {/* quick actions — only for pending */}
                                        {c.status === 'pending' && !c.deleted_at && (
                                            <div className="flex shrink-0 flex-col gap-1">
                                                <button
                                                    onClick={() => approve(c.id)}
                                                    className="flex items-center gap-0.5 rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400"
                                                >
                                                    <CheckCircle2 className="size-3" /> Approve
                                                </button>
                                                <button
                                                    onClick={() => reject(c.id)}
                                                    className="flex items-center gap-0.5 rounded-md bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-700 transition hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
                                                >
                                                    <XCircle className="size-3" /> Reject
                                                </button>
                                            </div>
                                        )}
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
