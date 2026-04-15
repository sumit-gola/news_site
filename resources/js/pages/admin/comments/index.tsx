import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    CheckCircle2, XCircle, AlertTriangle, Trash2, Filter, Search,
    MessageSquare, Clock, RotateCcw, ChevronLeft, ChevronRight,
    Pencil, RefreshCw, X, Save, ShieldAlert,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Paginated } from '@/types/auth';

type CommentRecord = {
    id: number;
    body: string;
    status: 'pending' | 'approved' | 'rejected' | 'spam';
    author_name: string;
    author_initials: string;
    guest_email: string | null;
    ip_address: string | null;
    parent_id: number | null;
    article: { id: number; title: string; slug: string } | null;
    user: { id: number; name: string } | null;
    created_at: string;
    deleted_at: string | null;
};

type Filters = {
    status?: string;
    article_id?: string;
    search?: string;
    sort_dir?: string;
    per_page?: string;
    trashed?: boolean;
};

type Summary = {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    spam: number;
    trashed: number;
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

// ── Edit Modal ────────────────────────────────────────────────────────────────
function EditModal({ comment, onClose }: { comment: CommentRecord; onClose: () => void }) {
    const form = useForm({
        body: comment.body,
        status: comment.status,
    });

    const save = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        form.put(`/admin/comments/${comment.id}`, {
            preserveScroll: true,
            onSuccess: onClose,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-xl border bg-card shadow-2xl">
                <div className="flex items-center justify-between border-b px-5 py-3">
                    <h2 className="flex items-center gap-2 text-sm font-semibold">
                        <Pencil className="size-4 text-indigo-500" />
                        Edit Comment
                    </h2>
                    <button onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                        <X className="size-4" />
                    </button>
                </div>
                <form onSubmit={save} className="space-y-4 p-5">
                    <div>
                        <p className="mb-1 text-xs text-muted-foreground">Author: <strong>{comment.author_name}</strong></p>
                        {comment.article && (
                            <p className="text-xs text-muted-foreground">Article: <strong>{comment.article.title}</strong></p>
                        )}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium">Body</label>
                        <Textarea
                            rows={5}
                            value={form.data.body}
                            onChange={(e) => form.setData('body', e.target.value)}
                            className="resize-none text-sm"
                            autoFocus
                        />
                        {form.errors.body && <p className="text-xs text-red-500">{form.errors.body}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium">Status</label>
                        <Select value={form.data.status} onValueChange={(v) => form.setData('status', v as typeof form.data.status)}>
                            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                                <SelectItem value="spam">Spam</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                        <Button type="button" size="sm" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" size="sm" disabled={form.processing} className="gap-1.5">
                            <Save className="size-3.5" />
                            Save Changes
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Row Actions ───────────────────────────────────────────────────────────────
function RowActions({ comment, onEdit }: { comment: CommentRecord; onEdit: () => void }) {
    const form = useForm({});
    const isTrashed = !!comment.deleted_at;

    const act = (action: string) => {
        if (action === 'force' && !confirm('Permanently delete this comment? This cannot be undone.')) return;
        if (action === 'delete' && !confirm('Move this comment to trash?')) return;

        const urls: Record<string, string> = {
            approve: `/admin/comments/${comment.id}/approve`,
            reject:  `/admin/comments/${comment.id}/reject`,
            spam:    `/admin/comments/${comment.id}/spam`,
            restore: `/admin/comments/${comment.id}/restore`,
            delete:  `/admin/comments/${comment.id}`,
            force:   `/admin/comments/${comment.id}/force`,
        };
        const methods: Record<string, 'patch' | 'delete'> = {
            approve: 'patch', reject: 'patch', spam: 'patch',
            restore: 'patch', delete: 'delete', force: 'delete',
        };

        if (methods[action] === 'patch') {
            form.patch(urls[action], { preserveScroll: true });
        } else {
            form.delete(urls[action], { preserveScroll: true });
        }
    };

    return (
        <div className="flex shrink-0 flex-wrap items-center gap-1">
            {!isTrashed && (
                <>
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
                    <button onClick={onEdit} title="Edit"
                        className="rounded p-1.5 text-muted-foreground hover:bg-indigo-50 hover:text-indigo-600 transition dark:hover:bg-indigo-950/30">
                        <Pencil className="size-3.5" />
                    </button>
                    <button onClick={() => act('delete')} disabled={form.processing} title="Move to trash"
                        className="rounded p-1.5 text-muted-foreground hover:bg-amber-50 hover:text-amber-600 transition disabled:opacity-50 dark:hover:bg-amber-950/30">
                        <Trash2 className="size-3.5" />
                    </button>
                </>
            )}
            {isTrashed && (
                <>
                    <button onClick={() => act('restore')} disabled={form.processing}
                        className="rounded px-2 py-1 text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-950/30 dark:text-green-300 disabled:opacity-50 transition flex items-center gap-1">
                        <RefreshCw className="size-3" />Restore
                    </button>
                    <button onClick={() => act('force')} disabled={form.processing}
                        className="rounded px-2 py-1 text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 disabled:opacity-50 transition flex items-center gap-1">
                        <ShieldAlert className="size-3" />Delete Forever
                    </button>
                </>
            )}
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CommentsIndex({ comments, filters, summary }: Props) {
    const [search, setSearch]       = useState(filters.search ?? '');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [editingComment, setEditingComment] = useState<CommentRecord | null>(null);
    const bulkForm = useForm<{ action: string; ids: number[] }>({ action: '', ids: [] });
    const isTrashed = !!filters.trashed;

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
        if ((action === 'force_delete') && !confirm(`Permanently delete ${selectedIds.length} comment(s)? Cannot be undone.`)) return;
        if (action === 'delete' && !confirm(`Move ${selectedIds.length} comment(s) to trash?`)) return;
        bulkForm.setData({ action, ids: selectedIds });
        bulkForm.patch('/admin/comments/bulk-action', {
            preserveScroll: true,
            onSuccess: () => setSelectedIds([]),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isTrashed ? 'Trashed Comments' : 'Comment Moderation'} />
            {editingComment && <EditModal comment={editingComment} onClose={() => setEditingComment(null)} />}

            <div className="space-y-5 p-6">

                {/* Summary */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
                    {[
                        { key: undefined,  label: 'All',      value: summary.total,    color: 'text-foreground',         trashed: false },
                        { key: 'pending',  label: 'Pending',  value: summary.pending,  color: 'text-amber-600',          trashed: false },
                        { key: 'approved', label: 'Approved', value: summary.approved, color: 'text-green-600',          trashed: false },
                        { key: 'rejected', label: 'Rejected', value: summary.rejected, color: 'text-red-600',            trashed: false },
                        { key: 'spam',     label: 'Spam',     value: summary.spam,     color: 'text-orange-600',         trashed: false },
                        { key: 'trashed',  label: 'Trash',    value: summary.trashed,  color: 'text-muted-foreground',   trashed: true  },
                    ].map((stat) => {
                        const isActive = stat.trashed
                            ? isTrashed
                            : (filters.status === stat.key || (!stat.key && !filters.status && !isTrashed));
                        return (
                            <button
                                key={stat.label}
                                onClick={() => applyFilters({ status: stat.trashed ? undefined : stat.key, trashed: stat.trashed || undefined, page: 1 })}
                                className={`rounded-xl border p-3 text-left transition hover:shadow-sm bg-card ${isActive ? 'ring-2 ring-indigo-500' : ''}`}
                            >
                                <p className="text-xs text-muted-foreground">{stat.label}</p>
                                <p className={`mt-0.5 text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                            </button>
                        );
                    })}
                </div>

                <Card>
                    <CardHeader className="border-b pb-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                {isTrashed ? <Trash2 className="size-4 text-muted-foreground" /> : <MessageSquare className="size-4 text-indigo-500" />}
                                {isTrashed ? 'Trashed Comments' : 'All Comments'}
                                {summary.pending > 0 && !isTrashed && (
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
                                        placeholder="Search…"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && applyFilters({ search, page: 1 })}
                                    />
                                </div>
                                {!isTrashed && (
                                    <Select value={filters.status ?? 'all'} onValueChange={(v) => applyFilters({ status: v === 'all' ? undefined : v, page: 1 })}>
                                        <SelectTrigger className="h-8 w-32 text-sm">
                                            <Filter className="mr-1.5 size-3.5" /><SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All status</SelectItem>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="approved">Approved</SelectItem>
                                            <SelectItem value="rejected">Rejected</SelectItem>
                                            <SelectItem value="spam">Spam</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                                <Select value={filters.sort_dir ?? 'desc'} onValueChange={(v) => applyFilters({ sort_dir: v, page: 1 })}>
                                    <SelectTrigger className="h-8 w-28 text-sm"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="desc">Newest</SelectItem>
                                        <SelectItem value="asc">Oldest</SelectItem>
                                    </SelectContent>
                                </Select>
                                {(filters.status || filters.search || isTrashed) && (
                                    <Button size="sm" variant="ghost" className="h-8 gap-1 text-xs"
                                        onClick={() => { setSearch(''); applyFilters({ status: undefined, search: undefined, trashed: undefined, page: 1 }); }}>
                                        <RotateCcw className="size-3" /> Reset
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardHeader>

                    {/* Bulk bar */}
                    {selectedIds.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 border-b bg-indigo-50 px-4 py-2 text-sm dark:bg-indigo-950/30">
                            <span className="font-medium text-indigo-700 dark:text-indigo-300">{selectedIds.length} selected</span>
                            <div className="ml-3 flex flex-wrap gap-1.5">
                                {!isTrashed && (
                                    <>
                                        <Button size="sm" variant="outline" className="h-7 gap-1 text-xs text-green-700" onClick={() => applyBulk('approve')}>
                                            <CheckCircle2 className="size-3" /> Approve
                                        </Button>
                                        <Button size="sm" variant="outline" className="h-7 gap-1 text-xs text-red-600" onClick={() => applyBulk('reject')}>
                                            <XCircle className="size-3" /> Reject
                                        </Button>
                                        <Button size="sm" variant="outline" className="h-7 gap-1 text-xs text-orange-600" onClick={() => applyBulk('spam')}>
                                            <AlertTriangle className="size-3" /> Spam
                                        </Button>
                                        <Button size="sm" variant="outline" className="h-7 gap-1 text-xs text-amber-700" onClick={() => applyBulk('delete')}>
                                            <Trash2 className="size-3" /> Move to Trash
                                        </Button>
                                    </>
                                )}
                                {isTrashed && (
                                    <>
                                        <Button size="sm" variant="outline" className="h-7 gap-1 text-xs text-green-700" onClick={() => applyBulk('restore')}>
                                            <RefreshCw className="size-3" /> Restore
                                        </Button>
                                        <Button size="sm" variant="outline" className="h-7 gap-1 text-xs text-red-700" onClick={() => applyBulk('force_delete')}>
                                            <ShieldAlert className="size-3" /> Delete Forever
                                        </Button>
                                    </>
                                )}
                            </div>
                            <button className="ml-auto text-xs text-muted-foreground hover:text-foreground" onClick={() => setSelectedIds([])}>Clear</button>
                        </div>
                    )}

                    <CardContent className="p-0">
                        {comments.data.length === 0 ? (
                            <div className="py-16 text-center">
                                <MessageSquare className="mx-auto mb-3 size-10 text-muted-foreground/30" />
                                <p className="text-sm text-muted-foreground">{isTrashed ? 'Trash is empty.' : 'No comments found.'}</p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {/* Header row */}
                                <div className="hidden grid-cols-[auto_1fr_180px_120px_auto] items-center gap-4 bg-muted/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:grid">
                                    <input type="checkbox" className="size-3.5"
                                        checked={selectedIds.length === comments.data.length && comments.data.length > 0}
                                        onChange={toggleAll} />
                                    <span>Comment / Author</span>
                                    <span>Article</span>
                                    <span>Status</span>
                                    <span>Actions</span>
                                </div>

                                {comments.data.map((comment) => (
                                    <div key={comment.id}
                                        className={`grid grid-cols-1 items-start gap-3 px-4 py-3.5 transition hover:bg-muted/20 md:grid-cols-[auto_1fr_180px_120px_auto] md:items-center md:gap-4 ${comment.deleted_at ? 'opacity-70' : ''}`}>
                                        <input type="checkbox" className="size-3.5"
                                            checked={selectedIds.includes(comment.id)}
                                            onChange={() => toggleOne(comment.id)} />

                                        {/* Author + body */}
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-[10px] font-bold text-white">
                                                    {comment.author_initials}
                                                </div>
                                                <span className="text-sm font-semibold">{comment.author_name}</span>
                                                {comment.user ? (
                                                    <Badge variant="secondary" className="px-1.5 py-0 text-xs">Member</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="px-1.5 py-0 text-xs">Guest</Badge>
                                                )}
                                                {comment.parent_id && (
                                                    <Badge variant="outline" className="px-1.5 py-0 text-[10px]">Reply</Badge>
                                                )}
                                                {comment.deleted_at && (
                                                    <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-600 dark:bg-red-950/30 dark:text-red-400">
                                                        Trashed {timeAgo(comment.deleted_at)}
                                                    </span>
                                                )}
                                                <span className="text-xs text-muted-foreground">{timeAgo(comment.created_at)}</span>
                                            </div>
                                            <p className="mt-0.5 line-clamp-2 text-sm text-foreground/80">{comment.body}</p>
                                            {comment.guest_email && (
                                                <p className="mt-0.5 text-xs text-muted-foreground">{comment.guest_email}</p>
                                            )}
                                        </div>

                                        {/* Article */}
                                        <div>
                                            {comment.article ? (
                                                <Link href={`/news/${comment.article.slug}`} target="_blank"
                                                    className="line-clamp-2 text-xs text-indigo-600 hover:underline dark:text-indigo-400">
                                                    {comment.article.title}
                                                </Link>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">—</span>
                                            )}
                                        </div>

                                        <StatusBadge status={comment.status} />

                                        <RowActions comment={comment} onEdit={() => setEditingComment(comment)} />
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
                                <Button size="sm" variant="outline" className="h-7 w-7 p-0"
                                    disabled={comments.current_page === 1}
                                    onClick={() => applyFilters({ page: comments.current_page - 1 })}>
                                    <ChevronLeft className="size-3.5" />
                                </Button>
                                <span className="min-w-[60px] text-center text-xs text-muted-foreground">
                                    {comments.current_page} / {comments.last_page}
                                </span>
                                <Button size="sm" variant="outline" className="h-7 w-7 p-0"
                                    disabled={comments.current_page === comments.last_page}
                                    onClick={() => applyFilters({ page: comments.current_page + 1 })}>
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
