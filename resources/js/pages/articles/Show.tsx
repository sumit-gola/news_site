import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Eye, Send, ThumbsDown, ThumbsUp, MessageSquare, CheckCircle2, XCircle,
    AlertTriangle, Trash2, Clock, RefreshCw, ShieldAlert, Pencil, X, Save,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { Article, BreadcrumbItem } from '@/types';

type ArticleComment = {
    id: number;
    body: string;
    status: 'pending' | 'approved' | 'rejected' | 'spam';
    author_name: string;
    author_initials: string;
    guest_email: string | null;
    parent_id: number | null;
    parent_body: string | null;
    user: { id: number; name: string } | null;
    created_at: string;
    deleted_at: string | null;
};

type Props = {
    article: Article;
    comments: ArticleComment[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/reporter/dashboard' },
    { title: 'Articles', href: '/articles' },
    { title: 'Preview', href: '/articles' },
];

const STATUS_CFG = {
    pending:  { label: 'Pending',  cls: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',   Icon: Clock },
    approved: { label: 'Approved', cls: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300',   Icon: CheckCircle2 },
    rejected: { label: 'Rejected', cls: 'bg-red-100   text-red-700   dark:bg-red-950/40   dark:text-red-300',     Icon: XCircle },
    spam:     { label: 'Spam',     cls: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300', Icon: AlertTriangle },
} as const;

function CommentStatusBadge({ status }: { status: ArticleComment['status'] }) {
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
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function EditCommentModal({ comment, onClose }: { comment: ArticleComment; onClose: () => void }) {
    const form = useForm({ body: comment.body, status: comment.status });
    const save = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        form.put(`/admin/comments/${comment.id}`, { preserveScroll: true, onSuccess: onClose });
    };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-xl border bg-card shadow-2xl">
                <div className="flex items-center justify-between border-b px-5 py-3">
                    <h2 className="flex items-center gap-2 text-sm font-semibold">
                        <Pencil className="size-4 text-indigo-500" />Edit Comment
                    </h2>
                    <button onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-muted">
                        <X className="size-4" />
                    </button>
                </div>
                <form onSubmit={save} className="space-y-4 p-5">
                    <Textarea rows={5} value={form.data.body}
                        onChange={(e) => form.setData('body', e.target.value)}
                        className="resize-none text-sm" autoFocus />
                    {form.errors.body && <p className="text-xs text-red-500">{form.errors.body}</p>}
                    <Select value={form.data.status} onValueChange={(v) => form.setData('status', v as ArticleComment['status'])}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="spam">Spam</SelectItem>
                        </SelectContent>
                    </Select>
                    <div className="flex justify-end gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" size="sm" disabled={form.processing} className="gap-1.5">
                            <Save className="size-3.5" />Save
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function CommentRow({ comment, onEdit }: { comment: ArticleComment; onEdit: () => void }) {
    const form = useForm({});
    const isTrashed = !!comment.deleted_at;

    const act = (action: string) => {
        if (action === 'force' && !confirm('Permanently delete? This cannot be undone.')) return;
        const map: Record<string, [string, 'patch' | 'delete']> = {
            approve: [`/admin/comments/${comment.id}/approve`, 'patch'],
            reject:  [`/admin/comments/${comment.id}/reject`,  'patch'],
            spam:    [`/admin/comments/${comment.id}/spam`,    'patch'],
            restore: [`/admin/comments/${comment.id}/restore`, 'patch'],
            trash:   [`/admin/comments/${comment.id}`,         'delete'],
            force:   [`/admin/comments/${comment.id}/force`,   'delete'],
        };
        const [url, method] = map[action];
        if (method === 'patch') form.patch(url, { preserveScroll: true });
        else form.delete(url, { preserveScroll: true });
    };

    return (
        <div className={`flex items-start gap-3 rounded-lg border p-3 transition ${isTrashed ? 'border-red-200 bg-red-50/50 opacity-75 dark:border-red-900 dark:bg-red-950/20' : 'bg-card hover:bg-muted/30'}`}>
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white">
                {comment.author_initials}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="text-sm font-semibold">{comment.author_name}</span>
                    {comment.user
                        ? <Badge variant="secondary" className="px-1.5 py-0 text-xs">Member</Badge>
                        : <Badge variant="outline" className="px-1.5 py-0 text-xs">Guest</Badge>
                    }
                    {comment.parent_id && <Badge variant="outline" className="px-1.5 py-0 text-[10px]">Reply</Badge>}
                    <CommentStatusBadge status={comment.status} />
                    {isTrashed && (
                        <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-600 dark:bg-red-950/30 dark:text-red-400">
                            Trashed
                        </span>
                    )}
                    <span className="text-xs text-muted-foreground">{timeAgo(comment.created_at)}</span>
                </div>

                {comment.parent_body && (
                    <p className="rounded border-l-2 border-indigo-300 pl-2 text-xs italic text-muted-foreground">
                        Replying to: "{comment.parent_body}"
                    </p>
                )}

                <p className="text-sm leading-relaxed">{comment.body}</p>

                {comment.guest_email && (
                    <p className="text-xs text-muted-foreground">{comment.guest_email}</p>
                )}

                <div className="flex flex-wrap items-center gap-1 pt-0.5">
                    {!isTrashed && (
                        <>
                            {comment.status !== 'approved' && (
                                <button onClick={() => act('approve')} disabled={form.processing}
                                    className="rounded px-2 py-0.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 dark:bg-green-950/30 dark:text-green-300 disabled:opacity-50 transition">
                                    Approve
                                </button>
                            )}
                            {comment.status !== 'rejected' && (
                                <button onClick={() => act('reject')} disabled={form.processing}
                                    className="rounded px-2 py-0.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 disabled:opacity-50 transition">
                                    Reject
                                </button>
                            )}
                            {comment.status !== 'spam' && (
                                <button onClick={() => act('spam')} disabled={form.processing}
                                    className="rounded px-2 py-0.5 text-xs font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 disabled:opacity-50 transition">
                                    Spam
                                </button>
                            )}
                            <button onClick={onEdit} title="Edit"
                                className="rounded p-1 text-muted-foreground hover:bg-indigo-50 hover:text-indigo-600 transition">
                                <Pencil className="size-3.5" />
                            </button>
                            <button onClick={() => act('trash')} disabled={form.processing} title="Move to trash"
                                className="rounded p-1 text-muted-foreground hover:bg-amber-50 hover:text-amber-600 disabled:opacity-50 transition">
                                <Trash2 className="size-3.5" />
                            </button>
                        </>
                    )}
                    {isTrashed && (
                        <>
                            <button onClick={() => act('restore')} disabled={form.processing}
                                className="flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-50 transition">
                                <RefreshCw className="size-3" />Restore
                            </button>
                            <button onClick={() => act('force')} disabled={form.processing}
                                className="flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50 transition">
                                <ShieldAlert className="size-3" />Delete Forever
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ShowArticle({ article, comments }: Props) {
    const permissions = article.permissions;
    const [editingComment, setEditingComment] = useState<ArticleComment | null>(null);
    const [tab, setTab] = useState<'all' | 'pending' | 'trashed'>('all');

    const action = (type: 'submit' | 'approve' | 'reject' | 'publish') => {
        const map = {
            submit:  `/articles/${article.id}/submit`,
            approve: `/articles/${article.id}/approve`,
            reject:  `/articles/${article.id}/reject`,
            publish: `/admin/articles/${article.id}/publish`,
        };
        router.post(map[type]);
    };

    const activeComments  = comments.filter((c) => !c.deleted_at);
    const trashedComments = comments.filter((c) => !!c.deleted_at);
    const pendingCount    = activeComments.filter((c) => c.status === 'pending').length;

    const tabComments = tab === 'all'
        ? activeComments
        : tab === 'pending'
        ? activeComments.filter((c) => c.status === 'pending')
        : trashedComments;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={article.title} />
            {editingComment && (
                <EditCommentModal comment={editingComment} onClose={() => setEditingComment(null)} />
            )}

            <div className="grid gap-6 p-6">
                {/* Article info card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-4">
                        <div>
                            <CardTitle>{article.title}</CardTitle>
                            <p className="text-muted-foreground mt-1 text-xs">/{article.slug}</p>
                        </div>
                        <Badge variant={article.status === 'published' ? 'default' : article.status === 'rejected' ? 'destructive' : 'outline'}>
                            {article.status}
                        </Badge>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
                            <span>Author: {article.author?.name ?? '-'}</span>
                            <span className="flex items-center gap-1"><Eye className="size-4" />{article.views.toLocaleString()} views</span>
                            <span>Published: {article.published_at ? new Date(article.published_at).toLocaleString() : 'Not published'}</span>
                        </div>

                        {article.featured_image_url && (
                            <img src={article.featured_image_url} alt={article.title} className="max-h-80 w-full rounded-lg object-cover" />
                        )}

                        <div className="prose max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: article.content }} />

                        <div className="flex flex-wrap gap-2">
                            {article.tags?.map((tag) => (
                                <Badge key={tag.id} variant="secondary">#{tag.name}</Badge>
                            ))}
                        </div>

                        <div className="flex flex-wrap justify-between gap-3">
                            {permissions?.update ? (
                                <Button variant="outline" asChild>
                                    <Link href={`/articles/${article.id}/edit`}>Edit Article</Link>
                                </Button>
                            ) : <span />}

                            <div className="flex flex-wrap gap-2">
                                {permissions?.submit && article.status === 'draft' && (
                                    <Button onClick={() => action('submit')}>
                                        <Send className="mr-1.5 size-4" />Submit For Review
                                    </Button>
                                )}
                                {article.status === 'pending' && permissions?.approve && (
                                    <>
                                        <Button onClick={() => action('approve')}>
                                            <ThumbsUp className="mr-1.5 size-4" />Approve
                                        </Button>
                                        {permissions.reject && (
                                            <Button variant="destructive" onClick={() => action('reject')}>
                                                <ThumbsDown className="mr-1.5 size-4" />Reject
                                            </Button>
                                        )}
                                    </>
                                )}
                                {permissions?.publish && article.status !== 'published' && (
                                    <Button variant="secondary" onClick={() => action('publish')}>Publish Now</Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Comments Management */}
                <Card>
                    <CardHeader className="border-b pb-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <MessageSquare className="size-4 text-indigo-500" />
                                Comments
                                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">{comments.length}</span>
                                {pendingCount > 0 && (
                                    <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-xs font-bold text-white">
                                        {pendingCount} pending
                                    </span>
                                )}
                            </CardTitle>
                            <Link
                                href={`/admin/comments?article_id=${article.id}`}
                                className="text-xs text-indigo-600 hover:underline dark:text-indigo-400"
                            >
                                Open in Comments Manager →
                            </Link>
                        </div>

                        {/* Tab switcher */}
                        <div className="mt-3 flex gap-1">
                            {([
                                { key: 'all',     label: `All (${activeComments.length})` },
                                { key: 'pending', label: `Pending (${pendingCount})` },
                                { key: 'trashed', label: `Trash (${trashedComments.length})` },
                            ] as const).map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => setTab(key)}
                                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${tab === key ? 'bg-indigo-600 text-white' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </CardHeader>

                    <CardContent className="p-4">
                        {tabComments.length === 0 ? (
                            <div className="py-10 text-center">
                                <MessageSquare className="mx-auto mb-2 size-8 text-muted-foreground/30" />
                                <p className="text-sm text-muted-foreground">
                                    {tab === 'trashed' ? 'Trash is empty.' : 'No comments yet.'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {tabComments.map((comment) => (
                                    <CommentRow
                                        key={comment.id}
                                        comment={comment}
                                        onEdit={() => setEditingComment(comment)}
                                    />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
