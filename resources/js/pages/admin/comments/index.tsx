import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    CheckCircle2, XCircle, AlertTriangle, Trash2, Filter, Search,
    MessageSquare, Clock, RotateCcw, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Paginated } from '@/types/auth';

type CommentRecord = {
    id: number;
    body: string;
    status: 'pending' | 'approved' | 'rejected' | 'spam';
    author_name: string;
    guest_email: string | null;
    ip_address: string | null;
    parent_id: number | null;
    article: { id: number; title: string; slug: string } | null;
    user: { id: number; name: string } | null;
    created_at: string;
};

type Filters = {
    status?: string;
    article_id?: string;
    search?: string;
    sort_dir?: string;
    per_page?: string;
};

type Summary = {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    spam: number;
};

type Props = {
    comments: Paginated<CommentRecord>;
    filters: Filters;
    summary: Summary;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Comments', href: '/admin/comments' },
];

const STATUS_CFG = {
    pending:  { label: 'Pending',  cls: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300',  Icon: Clock },
    approved: { label: 'Approved', cls: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300',  Icon: CheckCircle2 },
    rejected: { label: 'Rejected', cls: 'bg-red-100   text-red-700   border-red-200   dark:bg-red-950/40   dark:text-red-300',    Icon: XCircle },
    spam:     { label: 'Spam',     cls: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300', Icon: AlertTriangle },
} as const;

function StatusBadge({ status }: { status: CommentRecord['status'] }) {
    const { label, cls, Icon } = STATUS_CFG[status] ?? STATUS_CFG.pending;
    return (
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}>
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
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function RowActions({ comment }: { comment: CommentRecord }) {
    const form = useForm({});

    const act = (action: string) => {
        if (action === 'delete' && !confirm('Delete this comment?')) return;
        if (action === 'delete') {
            form.delete(`/admin/comments/${comment.id}`, { preserveScroll: true });
        } else {
            form.patch(`/admin/comments/${comment.id}/${action}`, { preserveScroll: true });
        }
    };

    return (
        <div className="flex shrink-0 items-center gap-1">
            {comment.status !== 'approved' && (
                <button onClick={() => act('approve')} disabled={form.processing}
                    className="rounded px-2 py-1 text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-950/30 dark:text-green-300 disabled:opacity-50 transition">
                    Approve
                </button>
            )}
            {comment.status !== 'rejected' && (
                <button onClick={() => act('reject')} disabled={form.processing}
                    className="rounded px-2 py-1 text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 disabled:opacity-50 transition">
                    Reject
                </button>
            )}
            {comment.status !== 'spam' && (
                <button onClick={() => act('spam')} disabled={form.processing}
                    className="rounded px-2 py-1 text-xs font-medium bg-orange-50 text-orange-600 hover:bg-orange-100 dark:bg-orange-950/30 dark:text-orange-400 disabled:opacity-50 transition">
                    Spam
                </button>
            )}
            <button onClick={() => act('delete')} disabled={form.processing}
                className="rounded px-2 py-1 text-xs font-medium bg-muted text-muted-foreground hover:bg-red-50 hover:text-red-600 disabled:opacity-50 transition">
                <Trash2 className="size-3.5" />
            </button>
        </div>
    );
}

export default function CommentsIndex({ comments, filters, summary }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const bulkForm = useForm<{ action: string; ids: number[] }>({ action: '', ids: [] });

    const applyFilters = (patch: Partial<Filters & { page?: number }>) => {
        router.get('/admin/comments', { ...filters, ...patch }, {
            preserveState: true, preserveScroll: true, replace: true,
        });
    };

    const toggleAll = () => {
        const ids = comments.data.map((c) => c.id);
        setSelectedIds((prev) => (prev.length === ids.length ? [] : ids));
    };

    const toggleOne = (id: number) =>
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

    const applyBulk = (action: string) => {
        if (!selectedIds.length) return;
        if (action === 'delete' && !confirm(`Delete ${selectedIds.length} comment(s)?`)) return;
        bulkForm.setData({ action, ids: selectedIds });
        bulkForm.patch('/admin/comments/bulk-action', {
            preserveScroll: true,
            onSuccess: () => setSelectedIds([]),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Comment Moderation" />
            <div className="space-y-5 p-6">

                {/* Summary */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    {[
                        { key: undefined,   label: 'All',      value: summary.total,    color: 'text-foreground' },
                        { key: 'pending',   label: 'Pending',  value: summary.pending,  color: 'text-amber-600' },
                        { key: 'approved',  label: 'Approved', value: summary.approved, color: 'text-green-600' },
                        { key: 'rejected',  label: 'Rejected', value: summary.rejected, color: 'text-red-600' },
                        { key: 'spam',      label: 'Spam',     value: summary.spam,     color: 'text-orange-600' },
                    ].map((stat) => (
                        <button
                            key={stat.label}
                            onClick={() => applyFilters({ status: stat.key, page: 1 })}
                            className={`rounded-xl border p-3 text-left transition hover:shadow-sm ${
                                (filters.status === stat.key || (!stat.key && !filters.status))
                                    ? 'ring-2 ring-indigo-500 bg-card'
                                    : 'bg-card'
                            }`}
                        >
                            <p className="text-xs text-muted-foreground">{stat.label}</p>
                            <p className={`mt-0.5 text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                        </button>
                    ))}
                </div>

                <Card>
                    <CardHeader className="border-b pb-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <MessageSquare className="size-4 text-indigo-500" />
                                Comments
                                {summary.pending > 0 && (
                                    <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-xs font-bold text-white">
                                        {summary.pending} pending
                                    </span>
                                )}
                            </CardTitle>

                            <div className="flex flex-wrap items-center gap-2">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        className="h-8 w-52 pl-8 text-sm"
                                        placeholder="Search comments…"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && applyFilters({ search, page: 1 })}
                                    />
                                </div>
                                <Select
                                    value={filters.sort_dir ?? 'desc'}
                                    onValueChange={(v) => applyFilters({ sort_dir: v, page: 1 })}
                                >
                                    <SelectTrigger className="h-8 w-28 text-sm"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="desc">Newest</SelectItem>
                                        <SelectItem value="asc">Oldest</SelectItem>
                                    </SelectContent>
                                </Select>
                                {(filters.status || filters.search) && (
                                    <Button
                                        size="sm" variant="ghost"
                                        className="h-8 gap-1 text-xs"
                                        onClick={() => { setSearch(''); applyFilters({ status: undefined, search: undefined, page: 1 }); }}
                                    >
                                        <RotateCcw className="size-3" /> Reset
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardHeader>

                    {/* Bulk actions bar */}
                    {selectedIds.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 border-b bg-indigo-50 px-4 py-2 text-sm dark:bg-indigo-950/30">
                            <span className="font-medium text-indigo-700 dark:text-indigo-300">{selectedIds.length} selected</span>
                            <div className="ml-3 flex gap-1.5">
                                <Button size="sm" variant="outline" className="h-7 gap-1 text-xs text-green-700" onClick={() => applyBulk('approve')}>
                                    <CheckCircle2 className="size-3" /> Approve
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 gap-1 text-xs text-red-600" onClick={() => applyBulk('reject')}>
                                    <XCircle className="size-3" /> Reject
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 gap-1 text-xs text-orange-600" onClick={() => applyBulk('spam')}>
                                    <AlertTriangle className="size-3" /> Spam
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 gap-1 text-xs text-red-700" onClick={() => applyBulk('delete')}>
                                    <Trash2 className="size-3" /> Delete
                                </Button>
                            </div>
                            <button className="ml-auto text-xs text-muted-foreground hover:text-foreground" onClick={() => setSelectedIds([])}>
                                Clear
                            </button>
                        </div>
                    )}

                    <CardContent className="p-0">
                        {comments.data.length === 0 ? (
                            <div className="py-16 text-center">
                                <MessageSquare className="mx-auto mb-3 size-10 text-muted-foreground/30" />
                                <p className="text-sm text-muted-foreground">No comments found.</p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {/* Table header row */}
                                <div className="hidden grid-cols-[auto_1fr_200px_120px_auto] items-center gap-4 bg-muted/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:grid">
                                    <input
                                        type="checkbox"
                                        className="size-3.5"
                                        checked={selectedIds.length === comments.data.length && comments.data.length > 0}
                                        onChange={toggleAll}
                                    />
                                    <span>Comment / Author</span>
                                    <span>Article</span>
                                    <span>Status</span>
                                    <span>Actions</span>
                                </div>

                                {comments.data.map((comment) => (
                                    <div
                                        key={comment.id}
                                        className="grid grid-cols-1 items-start gap-3 px-4 py-3.5 transition hover:bg-muted/20 md:grid-cols-[auto_1fr_200px_120px_auto] md:items-center md:gap-4"
                                    >
                                        <input
                                            type="checkbox"
                                            className="size-3.5"
                                            checked={selectedIds.includes(comment.id)}
                                            onChange={() => toggleOne(comment.id)}
                                        />

                                        {/* Author + body */}
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                                <span className="text-sm font-semibold">{comment.author_name}</span>
                                                {comment.user ? (
                                                    <Badge variant="secondary" className="px-1.5 py-0 text-xs">Member</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="px-1.5 py-0 text-xs">Guest</Badge>
                                                )}
                                                {comment.parent_id && (
                                                    <Badge variant="outline" className="px-1.5 py-0 text-[10px]">Reply</Badge>
                                                )}
                                                {comment.guest_email && (
                                                    <span className="text-xs text-muted-foreground">{comment.guest_email}</span>
                                                )}
                                                <span className="text-xs text-muted-foreground">{timeAgo(comment.created_at)}</span>
                                            </div>
                                            <p className="mt-0.5 line-clamp-2 text-sm text-foreground/80">{comment.body}</p>
                                        </div>

                                        {/* Article */}
                                        <div className="text-right">
                                            {comment.article ? (
                                                <Link
                                                    href={`/news/${comment.article.slug}`}
                                                    className="line-clamp-2 text-xs text-indigo-600 hover:underline dark:text-indigo-400"
                                                    target="_blank"
                                                >
                                                    {comment.article.title}
                                                </Link>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">—</span>
                                            )}
                                        </div>

                                        <StatusBadge status={comment.status} />

                                        <RowActions comment={comment} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>

                    {/* Pagination */}
                    {comments.last_page > 1 && (
                        <div className="flex items-center justify-between border-t px-4 py-3">
                            <p className="text-xs text-muted-foreground">
                                {comments.from ?? 0}–{comments.to ?? 0} of {comments.total}
                            </p>
                            <div className="flex items-center gap-1">
                                <Button
                                    size="sm" variant="outline"
                                    className="h-7 w-7 p-0"
                                    disabled={comments.current_page === 1}
                                    onClick={() => applyFilters({ page: comments.current_page - 1 })}
                                >
                                    <ChevronLeft className="size-3.5" />
                                </Button>
                                <span className="min-w-[60px] text-center text-xs text-muted-foreground">
                                    {comments.current_page} / {comments.last_page}
                                </span>
                                <Button
                                    size="sm" variant="outline"
                                    className="h-7 w-7 p-0"
                                    disabled={comments.current_page === comments.last_page}
                                    onClick={() => applyFilters({ page: comments.current_page + 1 })}
                                >
                                    <ChevronRight className="size-3.5" />
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </AppLayout>
    );
}
