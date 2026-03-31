import { Head, Link } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    BookOpen,
    CheckCircle2,
    Clock,
    Eye,
    FileText,
    FolderOpen,
    MessageSquare,
    Tag,
    TrendingUp,
    Users,
    ArrowRight,
    Layers,
    PenSquare,
    Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { dashboard } from '@/routes';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: dashboard() }];

/* ─── Types ─────────────────────────────────────────── */
interface ArticleStats { total: number; published: number; pending: number; draft: number; rejected: number }
interface Props {
    stats: {
        articles: ArticleStats;
        users: { total: number; active: number };
        comments: { total: number; pending: number };
        categories: { total: number; active: number };
        tags: number;
    };
    recentArticles: {
        id: number; title: string; slug: string; status: string;
        user_id: number; published_at: string | null; created_at: string;
        author?: { id: number; name: string };
        categories?: { id: number; name: string }[];
    }[];
    pendingReview: {
        id: number; title: string; slug: string;
        user_id: number; created_at: string;
        author?: { id: number; name: string };
    }[];
    recentComments: {
        id: number; body: string; status: string; guest_name: string | null;
        user_id: number | null; article_id: number; created_at: string;
        user?: { id: number; name: string } | null;
        article?: { id: number; title: string; slug: string } | null;
    }[];
    topCategories: {
        id: number; name: string; slug: string;
        color: string | null; articles_count: number;
    }[];
    recentActivity: {
        id: number; user_id: number | null; action: string;
        description: string | null; created_at: string;
        user?: { id: number; name: string } | null;
    }[];
}

/* ─── Helpers ───────────────────────────────────────── */
function timeAgo(date: string): string {
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    return `${Math.floor(s / 86400)}d`;
}
function initials(name: string) {
    return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}

const STATUS_CONFIG: Record<string, { label: string; dot: string; pill: string }> = {
    published: { label: 'Published', dot: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    pending:   { label: 'Pending',   dot: 'bg-amber-400',   pill: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    draft:     { label: 'Draft',     dot: 'bg-slate-400',   pill: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' },
    rejected:  { label: 'Rejected',  dot: 'bg-red-500',     pill: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};
function StatusPill({ status }: { status: string }) {
    const c = STATUS_CONFIG[status] ?? { label: status, dot: 'bg-slate-400', pill: 'bg-slate-100 text-slate-500' };
    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${c.pill}`}>
            <span className={`size-1.5 rounded-full ${c.dot}`} />
            {c.label}
        </span>
    );
}

/* ─── Metric Tile ───────────────────────────────────── */
function Tile({
    label, value, sub, icon: Icon, bar, href,
}: {
    label: string; value: number | string; sub?: string;
    icon: React.ElementType; bar: string; href?: string;
}) {
    const inner = (
        <div className={`group relative overflow-hidden rounded-xl border bg-card px-4 py-3 transition hover:shadow-sm`}>
            {/* coloured accent strip */}
            <div className={`absolute inset-y-0 left-0 w-0.5 rounded-l-xl ${bar}`} />
            <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                    <p className="text-muted-foreground truncate text-[11px] font-medium uppercase tracking-wide">{label}</p>
                    <p className="mt-0.5 text-xl font-bold leading-none tracking-tight">{value}</p>
                    {sub && <p className="text-muted-foreground mt-1 text-[11px]">{sub}</p>}
                </div>
                <div className={`shrink-0 rounded-lg p-2 ${bar.replace('bg-', 'bg-').replace('-500', '-100').replace('-400', '-100')} opacity-80`}>
                    <Icon className={`size-4 ${bar.replace('bg-', 'text-')}`} />
                </div>
            </div>
        </div>
    );
    return href ? <Link href={href}>{inner}</Link> : inner;
}

/* ─── Section header ────────────────────────────────── */
function SectionHead({ icon: Icon, title, href, count }: {
    icon: React.ElementType; title: string; href?: string; count?: number;
}) {
    return (
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <div className="flex items-center gap-1.5">
                <Icon className="text-muted-foreground size-3.5" />
                <span className="text-[13px] font-semibold">{title}</span>
                {count !== undefined && count > 0 && (
                    <span className="ml-0.5 rounded-full bg-primary/10 px-1.5 py-px text-[10px] font-bold text-primary">
                        {count}
                    </span>
                )}
            </div>
            {href && (
                <Link href={href} className="text-muted-foreground hover:text-foreground flex items-center gap-0.5 text-[11px] transition">
                    All <ArrowRight className="size-3" />
                </Link>
            )}
        </div>
    );
}

/* ─── Article distribution bar ──────────────────────── */
function DistBar({ articles }: { articles: ArticleStats }) {
    const total = articles.total || 1;
    const segs = [
        { label: 'Published', value: articles.published, bar: 'bg-emerald-500', dot: 'bg-emerald-500' },
        { label: 'Pending',   value: articles.pending,   bar: 'bg-amber-400',   dot: 'bg-amber-400' },
        { label: 'Draft',     value: articles.draft,     bar: 'bg-slate-400',   dot: 'bg-slate-400' },
        { label: 'Rejected',  value: articles.rejected,  bar: 'bg-red-400',     dot: 'bg-red-400' },
    ];
    return (
        <div className="space-y-2.5 px-4 pb-3">
            <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
                {segs.map((s) =>
                    s.value > 0 ? (
                        <div key={s.label} title={`${s.label}: ${s.value}`}
                            className={`${s.bar}`} style={{ width: `${(s.value / total) * 100}%` }} />
                    ) : null,
                )}
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                {segs.map((s) => (
                    <div key={s.label} className="flex items-center gap-1.5">
                        <span className={`size-2 shrink-0 rounded-full ${s.dot}`} />
                        <span className="text-muted-foreground text-[11px]">{s.label}</span>
                        <span className="ml-auto text-[11px] font-semibold">{s.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ─── Dashboard ─────────────────────────────────────── */
export default function Dashboard({ stats, recentArticles, pendingReview, recentComments, topCategories, recentActivity }: Props) {
    const actions = [
        { label: 'New Article',    href: '/articles/create',                    icon: PenSquare,     bar: 'bg-violet-500' },
        { label: 'Users',          href: '/admin/users',                        icon: Users,         bar: 'bg-blue-500' },
        { label: 'Categories',     href: '/categories',                         icon: FolderOpen,    bar: 'bg-teal-500' },
        { label: 'Comments',       href: '/admin/comments',                     icon: MessageSquare, bar: 'bg-amber-500' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex flex-1 flex-col gap-3 p-3 md:p-4">

                {/* ── Page header ── */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-bold tracking-tight">Overview</h1>
                        <p className="text-muted-foreground text-xs">News portal at a glance</p>
                    </div>
                    <Button size="sm" className="h-8 gap-1.5 text-xs" asChild>
                        <Link href="/articles/create">
                            <PenSquare className="size-3.5" /> New Article
                        </Link>
                    </Button>
                </div>

                {/* ── 8 metric tiles in 4+4 ── */}
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <Tile label="Total Articles"   value={stats.articles.total}    sub={`${stats.articles.published} published`}  icon={FileText}      bar="bg-violet-500" href="/articles" />
                    <Tile label="Pending Review"   value={stats.articles.pending}  sub="Awaiting approval"                        icon={Clock}         bar="bg-amber-400"  href="/admin/articles" />
                    <Tile label="Total Users"      value={stats.users.total}       sub={`${stats.users.active} active`}           icon={Users}         bar="bg-blue-500"   href="/admin/users" />
                    <Tile label="Pending Comments" value={stats.comments.pending}  sub={`${stats.comments.total} total`}          icon={MessageSquare} bar="bg-rose-500"   href="/admin/comments" />
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <Tile label="Categories"   value={stats.categories.total}  sub={`${stats.categories.active} active`}  icon={FolderOpen} bar="bg-teal-500"   href="/categories" />
                    <Tile label="Tags"         value={stats.tags}                                                         icon={Tag}        bar="bg-cyan-500" />
                    <Tile label="Published"    value={stats.articles.published} sub="Live articles"                       icon={Activity}   bar="bg-emerald-500" href="/articles" />
                    <Tile label="Drafts"       value={stats.articles.draft}    sub="Unpublished"                          icon={BookOpen}   bar="bg-slate-400"  href="/articles" />
                </div>

                {/* ── Middle row: dist + categories + actions ── */}
                <div className="grid gap-3 lg:grid-cols-3">

                    {/* Article distribution */}
                    <Card className="overflow-hidden">
                        <SectionHead icon={Layers} title="Article Distribution" href="/articles" />
                        <DistBar articles={stats.articles} />
                    </Card>

                    {/* Top categories */}
                    <Card className="overflow-hidden">
                        <SectionHead icon={TrendingUp} title="Top Categories" href="/categories" />
                        <div className="space-y-2 px-4 pb-3">
                            {topCategories.length === 0 && (
                                <p className="text-muted-foreground text-xs">No categories yet.</p>
                            )}
                            {topCategories.map((cat, i) => {
                                const max = topCategories[0]?.articles_count || 1;
                                return (
                                    <div key={cat.id} className="flex items-center gap-2">
                                        <span className="text-muted-foreground w-3 text-[10px]">{i + 1}</span>
                                        {cat.color
                                            ? <span className="size-2 shrink-0 rounded-full" style={{ background: cat.color }} />
                                            : <span className="size-2 shrink-0 rounded-full bg-primary/40" />
                                        }
                                        <span className="flex-1 truncate text-xs font-medium">{cat.name}</span>
                                        <div className="flex items-center gap-1.5">
                                            <div className="h-1 w-16 rounded-full bg-muted">
                                                <div className="h-1 rounded-full bg-primary/60"
                                                    style={{ width: `${(cat.articles_count / max) * 100}%` }} />
                                            </div>
                                            <span className="text-muted-foreground w-5 text-right text-[10px]">{cat.articles_count}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>

                    {/* Quick actions */}
                    <Card className="overflow-hidden">
                        <SectionHead icon={Zap} title="Quick Actions" />
                        <div className="grid grid-cols-3 gap-1.5 px-4 pb-3">
                            {actions.map(({ label, href, icon: Icon, bar }) => (
                                <Link key={label} href={href}
                                    className="flex flex-col items-center gap-1.5 rounded-lg border py-2.5 transition hover:bg-muted/60">
                                    <div className={`rounded-md p-1.5 ${bar.replace('-500', '-100').replace('-400', '-100')} dark:opacity-80`}>
                                        <Icon className={`size-3.5 ${bar.replace('bg-', 'text-')}`} />
                                    </div>
                                    <span className="text-center text-[10px] font-medium leading-tight">{label}</span>
                                </Link>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* ── Bottom row: articles + pending + comments ── */}
                <div className="grid gap-3 lg:grid-cols-5">

                    {/* Recent articles */}
                    <Card className="overflow-hidden lg:col-span-3">
                        <SectionHead icon={FileText} title="Recent Articles" href="/articles" />
                        {recentArticles.length === 0 ? (
                            <p className="text-muted-foreground px-4 pb-3 text-xs">No articles yet.</p>
                        ) : (
                            <div className="divide-y">
                                {recentArticles.map((a) => (
                                    <div key={a.id} className="flex items-center gap-3 px-4 py-2 transition hover:bg-muted/40">
                                        <div className="min-w-0 flex-1">
                                            <Link href={`/articles/${a.id}`}
                                                className="block truncate text-[13px] font-medium hover:underline">
                                                {a.title}
                                            </Link>
                                            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                                {a.author && <span>{a.author.name}</span>}
                                                <span>·</span>
                                                <span>{timeAgo(a.created_at)}</span>
                                                {a.categories?.[0] && (
                                                    <><span>·</span><span className="max-w-[90px] truncate">{a.categories[0].name}</span></>
                                                )}
                                            </div>
                                        </div>
                                        <StatusPill status={a.status} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* Right column */}
                    <div className="flex flex-col gap-3 lg:col-span-2">

                        {/* Pending review */}
                        <Card className="flex-1 overflow-hidden">
                            <SectionHead icon={AlertCircle} title="Pending Review" href="/admin/articles" count={stats.articles.pending} />
                            {pendingReview.length === 0 ? (
                                <div className="flex flex-col items-center gap-1 px-4 py-4 text-center">
                                    <CheckCircle2 className="size-6 text-emerald-400" />
                                    <p className="text-muted-foreground text-xs">All caught up!</p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {pendingReview.map((a) => (
                                        <div key={a.id} className="flex items-center gap-2 px-4 py-2 transition hover:bg-muted/40">
                                            <div className="min-w-0 flex-1">
                                                <Link href={`/articles/${a.id}`}
                                                    className="block truncate text-[13px] font-medium hover:underline">
                                                    {a.title}
                                                </Link>
                                                <p className="text-muted-foreground text-[11px]">
                                                    {a.author?.name} · {timeAgo(a.created_at)}
                                                </p>
                                            </div>
                                            <Link href={`/articles/${a.id}`}
                                                className="flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition hover:bg-muted">
                                                <Eye className="size-3" /> Review
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>

                        {/* Pending comments */}
                        <Card className="flex-1 overflow-hidden">
                            <SectionHead icon={MessageSquare} title="Pending Comments" href="/admin/comments" count={stats.comments.pending} />
                            {recentComments.length === 0 ? (
                                <div className="flex flex-col items-center gap-1 px-4 py-4 text-center">
                                    <CheckCircle2 className="size-6 text-emerald-400" />
                                    <p className="text-muted-foreground text-xs">No pending comments!</p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {recentComments.map((c) => {
                                        const author = c.user?.name ?? c.guest_name ?? 'Guest';
                                        return (
                                            <div key={c.id} className="px-4 py-2 transition hover:bg-muted/40">
                                                <div className="flex items-center gap-1.5">
                                                    <Avatar className="size-5 shrink-0">
                                                        <AvatarFallback className="text-[9px]">{initials(author)}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-[12px] font-medium">{author}</span>
                                                    <span className="text-muted-foreground ml-auto text-[10px]">{timeAgo(c.created_at)}</span>
                                                </div>
                                                <p className="text-muted-foreground mt-0.5 line-clamp-1 text-[11px]">{c.body}</p>
                                                {c.article && (
                                                    <p className="mt-0.5 truncate text-[10px] text-primary/60">↳ {c.article.title}</p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </Card>
                    </div>
                </div>

                {/* ── Activity log ── */}
                {recentActivity.length > 0 && (
                    <Card className="overflow-hidden">
                        <SectionHead icon={Activity} title="Recent Activity" />
                        <div className="divide-y">
                            {recentActivity.map((log) => (
                                <div key={log.id} className="flex items-center gap-3 px-4 py-2 transition hover:bg-muted/40">
                                    <Avatar className="size-6 shrink-0">
                                        <AvatarFallback className="text-[9px]">
                                            {log.user ? initials(log.user.name) : '⚙'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[12px] font-medium">{log.user?.name ?? 'System'}</span>
                                            <span className="rounded bg-muted px-1.5 py-px text-[10px] font-medium">{log.action}</span>
                                        </div>
                                        {log.description && (
                                            <p className="text-muted-foreground truncate text-[11px]">{log.description}</p>
                                        )}
                                    </div>
                                    <span className="text-muted-foreground shrink-0 text-[10px]">{timeAgo(log.created_at)}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

            </div>
        </AppLayout>
    );
}
