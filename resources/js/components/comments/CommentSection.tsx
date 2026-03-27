import { useForm, usePage } from '@inertiajs/react';
import { MessageSquare, Reply, Trash2, ChevronDown, ChevronUp, Send, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import type { User } from '@/types/auth';

export type CommentItem = {
    id: number;
    body: string;
    author_name: string;
    author_initials: string;
    user_id: number | null;
    parent_id: number | null;
    created_at: string;
    replies?: CommentItem[];
};

type Props = {
    articleSlug: string;
    comments: CommentItem[];
    commentsCount: number;
};

function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function Avatar({ initials, size = 'md' }: { initials: string; size?: 'sm' | 'md' }) {
    const cls = size === 'sm'
        ? 'size-7 text-xs'
        : 'size-9 text-sm';
    return (
        <div className={`${cls} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 font-semibold text-white`}>
            {initials}
        </div>
    );
}

type CommentFormProps = {
    articleSlug: string;
    parentId?: number | null;
    onCancel?: () => void;
    autoFocus?: boolean;
};

function CommentForm({ articleSlug, parentId = null, onCancel, autoFocus }: CommentFormProps) {
    const { auth } = usePage<{ auth: { user: User | null } }>().props;
    const user = auth?.user;

    const form = useForm({
        body: '',
        parent_id: parentId,
        guest_name: '',
        guest_email: '',
    });

    const submit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        form.post(`/news/${articleSlug}/comments`, {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                onCancel?.();
            },
        });
    };

    return (
        <form onSubmit={submit} className="space-y-2.5">
            {!user && (
                <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                        <Input
                            placeholder="Your name *"
                            value={form.data.guest_name}
                            onChange={(e) => form.setData('guest_name', e.target.value)}
                            className="h-8 text-sm"
                            autoFocus={autoFocus}
                        />
                        {form.errors.guest_name && (
                            <p className="mt-0.5 text-xs text-red-500">{form.errors.guest_name}</p>
                        )}
                    </div>
                    <div>
                        <Input
                            type="email"
                            placeholder="Your email *"
                            value={form.data.guest_email}
                            onChange={(e) => form.setData('guest_email', e.target.value)}
                            className="h-8 text-sm"
                        />
                        {form.errors.guest_email && (
                            <p className="mt-0.5 text-xs text-red-500">{form.errors.guest_email}</p>
                        )}
                    </div>
                </div>
            )}
            <div>
                <Textarea
                    placeholder={parentId ? 'Write a reply…' : 'Join the discussion…'}
                    value={form.data.body}
                    onChange={(e) => form.setData('body', e.target.value)}
                    rows={3}
                    className="resize-none text-sm"
                    autoFocus={autoFocus && !!user}
                />
                {form.errors.body && (
                    <p className="mt-0.5 text-xs text-red-500">{form.errors.body}</p>
                )}
            </div>
            <div className="flex items-center gap-2">
                <Button type="submit" size="sm" disabled={form.processing} className="gap-1.5">
                    {form.processing ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                    {parentId ? 'Reply' : 'Post comment'}
                </Button>
                {onCancel && (
                    <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
                {!user && (
                    <p className="ml-auto text-xs text-muted-foreground">
                        Email not published. Comments await moderation.
                    </p>
                )}
            </div>
        </form>
    );
}

type CommentNodeProps = {
    comment: CommentItem;
    articleSlug: string;
    currentUserId?: number | null;
    isReply?: boolean;
};

function CommentNode({ comment, articleSlug, currentUserId, isReply = false }: CommentNodeProps) {
    const [replying, setReplying] = useState(false);
    const [showReplies, setShowReplies] = useState(true);
    const replyCount = comment.replies?.length ?? 0;

    const deleteForm = useForm({});
    const handleDelete = () => {
        if (!confirm('Delete this comment?')) return;
        deleteForm.delete(`/comments/${comment.id}`, { preserveScroll: true });
    };

    return (
        <div className={`group flex gap-3 ${isReply ? 'mt-3' : ''}`}>
            <Avatar initials={comment.author_initials} size={isReply ? 'sm' : 'md'} />
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="text-sm font-semibold leading-tight">{comment.author_name}</span>
                    <span className="text-xs text-muted-foreground">{timeAgo(comment.created_at)}</span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-foreground/90">{comment.body}</p>
                <div className="mt-1.5 flex items-center gap-1">
                    {!isReply && (
                        <button
                            onClick={() => setReplying((v) => !v)}
                            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        >
                            <Reply className="size-3" />
                            Reply
                        </button>
                    )}
                    {currentUserId && currentUserId === comment.user_id && (
                        <button
                            onClick={handleDelete}
                            disabled={deleteForm.processing}
                            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                        >
                            <Trash2 className="size-3" />
                            Delete
                        </button>
                    )}
                    {!isReply && replyCount > 0 && (
                        <button
                            onClick={() => setShowReplies((v) => !v)}
                            className="ml-1 flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        >
                            {showReplies ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                            {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                        </button>
                    )}
                </div>

                {replying && (
                    <div className="mt-3 rounded-lg border bg-muted/30 p-3">
                        <CommentForm
                            articleSlug={articleSlug}
                            parentId={comment.id}
                            onCancel={() => setReplying(false)}
                            autoFocus
                        />
                    </div>
                )}

                {!isReply && showReplies && replyCount > 0 && (
                    <div className="mt-1 space-y-0 border-l-2 border-muted pl-4">
                        {comment.replies!.map((reply) => (
                            <CommentNode
                                key={reply.id}
                                comment={reply}
                                articleSlug={articleSlug}
                                currentUserId={currentUserId}
                                isReply
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function CommentSection({ articleSlug, comments, commentsCount }: Props) {
    const { auth } = usePage<{ auth: { user: User | null } }>().props;
    const user = auth?.user;
    const [showForm, setShowForm] = useState(false);

    return (
        <section className="mt-10 border-t pt-8">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-bold">
                    <MessageSquare className="size-5 text-indigo-500" />
                    {commentsCount > 0 ? `${commentsCount} Comment${commentsCount > 1 ? 's' : ''}` : 'Comments'}
                </h2>
                {!showForm && (
                    <Button size="sm" variant="outline" onClick={() => setShowForm(true)} className="gap-1.5">
                        <MessageSquare className="size-3.5" />
                        Write a comment
                    </Button>
                )}
            </div>

            {/* New comment form */}
            {showForm && (
                <div className="mb-6 rounded-xl border bg-card p-4 shadow-sm">
                    {user ? (
                        <div className="mb-3 flex items-center gap-2">
                            <Avatar initials={user.name.slice(0, 2).toUpperCase()} />
                            <span className="text-sm font-medium">{user.name}</span>
                        </div>
                    ) : (
                        <p className="mb-3 text-sm text-muted-foreground">
                            Commenting as guest —{' '}
                            <a href="/login" className="text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-400">sign in</a>
                            {' '}for faster approval.
                        </p>
                    )}
                    <CommentForm articleSlug={articleSlug} onCancel={() => setShowForm(false)} />
                </div>
            )}

            {/* Comment list */}
            {comments.length === 0 ? (
                <div className="rounded-xl border border-dashed py-10 text-center">
                    <MessageSquare className="mx-auto mb-2 size-8 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">No comments yet. Be the first to comment!</p>
                    {!showForm && (
                        <Button size="sm" variant="outline" className="mt-3" onClick={() => setShowForm(true)}>
                            Write a comment
                        </Button>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    {comments.map((comment) => (
                        <CommentNode
                            key={comment.id}
                            comment={comment}
                            articleSlug={articleSlug}
                            currentUserId={user?.id}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
