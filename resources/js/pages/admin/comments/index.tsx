import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { CheckCircle, MessageSquare, Trash2, XCircle, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { PaginatedData } from '@/types';

interface Comment {
    id: number;
    body: string;
    status: string;
    author_name: string;
    author_email: string;
    ip_address: string;
    created_at: string;
    article: { id: number; title: string; slug: string };
    user?: { name: string };
}

interface Counts { pending: number; approved: number; spam: number }

const STATUS_COLORS: Record<string, string> = {
    pending:  'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-gray-100 text-gray-700',
    spam:     'bg-red-100 text-red-700',
};

export default function CommentsIndex({
    comments, filters, counts,
}: {
    comments: PaginatedData<Comment>;
    filters: { status?: string; search?: string };
    counts: Counts;
}) {
    const [selected, setSelected] = useState<number[]>([]);

    function action(id: number, act: string) {
        router.patch(`/admin/comments/${id}/${act}`);
    }
    function del(id: number) {
        if (confirm('Delete this comment?')) router.delete(`/admin/comments/${id}`);
    }
    function bulkAction(act: string) {
        if (!selected.length) return;
        router.post('/admin/comments/bulk-action', { ids: selected, action: act }, {
            onSuccess: () => setSelected([]),
        });
    }
    function toggleSelect(id: number) {
        setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    }

    return (
        <AppLayout breadcrumbs={[{ title: 'Admin', href: '/admin/dashboard' }, { title: 'Comments', href: '/admin/comments' }]}>
            <Head title="Comment Moderation" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Comment Moderation</h1>
                </div>

                {/* Counts */}
                <div className="flex gap-3">
                    {[
                        { label: 'Pending',  count: counts.pending,  status: 'pending',  icon: MessageSquare },
                        { label: 'Approved', count: counts.approved, status: 'approved', icon: CheckCircle   },
                        { label: 'Spam',     count: counts.spam,     status: 'spam',     icon: AlertTriangle },
                    ].map(({ label, count, status, icon: Icon }) => (
                        <button
                            key={status}
                            onClick={() => router.get('/admin/comments', { status }, { preserveState: true })}
                            className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted ${filters.status === status ? 'bg-muted font-medium' : ''}`}
                        >
                            <Icon className="size-4" />
                            {label} <Badge variant="secondary">{count}</Badge>
                        </button>
                    ))}
                    {filters.status && (
                        <Button variant="ghost" size="sm" onClick={() => router.get('/admin/comments', {})}>Clear filter</Button>
                    )}
                </div>

                {/* Bulk Actions */}
                {selected.length > 0 && (
                    <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2">
                        <span className="text-sm">{selected.length} selected</span>
                        <Button size="sm" variant="outline" onClick={() => bulkAction('approve')}>Approve</Button>
                        <Button size="sm" variant="outline" onClick={() => bulkAction('spam')}>Spam</Button>
                        <Button size="sm" variant="outline" className="text-red-600" onClick={() => bulkAction('delete')}>Delete</Button>
                    </div>
                )}

                {/* Search */}
                <Input
                    placeholder="Search comments…"
                    defaultValue={filters.search}
                    className="max-w-xs"
                    onChange={e => router.get('/admin/comments', { ...filters, search: e.target.value }, { preserveState: true, replace: true })}
                />

                {/* List */}
                <Card>
                    <CardContent className="p-0">
                        {comments.data.length === 0 ? (
                            <p className="px-4 py-8 text-center text-sm text-muted-foreground">No comments found.</p>
                        ) : (
                            <div className="divide-y">
                                {comments.data.map((comment) => (
                                    <div key={comment.id} className="flex gap-3 px-4 py-4">
                                        <input
                                            type="checkbox"
                                            className="mt-1 shrink-0"
                                            checked={selected.includes(comment.id)}
                                            onChange={() => toggleSelect(comment.id)}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-medium text-sm">
                                                    {comment.user?.name ?? comment.author_name ?? 'Anonymous'}
                                                </span>
                                                {comment.author_email && (
                                                    <span className="text-xs text-muted-foreground">{comment.author_email}</span>
                                                )}
                                                <Badge className={`text-xs ${STATUS_COLORS[comment.status] ?? ''}`} variant="secondary">
                                                    {comment.status}
                                                </Badge>
                                            </div>
                                            <p className="mt-1 text-sm">{comment.body}</p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                on{' '}
                                                <Link href={`/articles/${comment.article?.id}/edit`} className="hover:underline">
                                                    {comment.article?.title}
                                                </Link>
                                                {' '}· {new Date(comment.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 gap-1">
                                            {comment.status !== 'approved' && (
                                                <Button size="icon" variant="ghost" className="size-7 text-green-600" title="Approve" onClick={() => action(comment.id, 'approve')}>
                                                    <CheckCircle className="size-4" />
                                                </Button>
                                            )}
                                            {comment.status !== 'spam' && (
                                                <Button size="icon" variant="ghost" className="size-7 text-orange-500" title="Spam" onClick={() => action(comment.id, 'spam')}>
                                                    <AlertTriangle className="size-4" />
                                                </Button>
                                            )}
                                            {comment.status !== 'rejected' && (
                                                <Button size="icon" variant="ghost" className="size-7 text-gray-500" title="Reject" onClick={() => action(comment.id, 'reject')}>
                                                    <XCircle className="size-4" />
                                                </Button>
                                            )}
                                            <Button size="icon" variant="ghost" className="size-7 text-red-500" title="Delete" onClick={() => del(comment.id)}>
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
