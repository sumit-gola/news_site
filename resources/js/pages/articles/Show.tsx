import { Head, Link, router, usePage } from '@inertiajs/react';
import { Eye, Send, ThumbsDown, ThumbsUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { Article, BreadcrumbItem, User } from '@/types';

type Props = {
    article: Article;
};

type PageProps = {
    auth: {
        user: User;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/reporter/dashboard' },
    { title: 'Articles', href: '/articles' },
    { title: 'Preview', href: '/articles' },
];

export default function ShowArticle({ article }: Props) {
    const { auth } = usePage<PageProps>().props;
    const roles = auth.user.roles?.map((role) => role.name) ?? [];
    const isAdmin = roles.includes('admin');
    const isManager = roles.includes('manager');
    const canApprove = isAdmin || isManager;

    const action = (type: 'submit' | 'approve' | 'reject' | 'publish') => {
        const map = {
            submit: `/articles/${article.id}/submit`,
            approve: `/articles/${article.id}/approve`,
            reject: `/articles/${article.id}/reject`,
            publish: `/admin/articles/${article.id}/publish`,
        };
        router.post(map[type]);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={article.title} />

            <div className="grid gap-6 p-6">
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

                        {article.featured_image && (
                            <img src={article.featured_image} alt={article.title} className="max-h-80 w-full rounded-lg object-cover" />
                        )}

                        <div className="prose max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: article.content }} />

                        <div className="flex flex-wrap gap-2">
                            {article.tags?.map((tag) => (
                                <Badge key={tag.id} variant="secondary">#{tag.name}</Badge>
                            ))}
                        </div>

                        <div className="flex flex-wrap justify-between gap-3">
                            <Button variant="outline" asChild>
                                <Link href={`/articles/${article.id}/edit`}>Edit Article</Link>
                            </Button>

                            <div className="flex flex-wrap gap-2">
                                {article.status === 'draft' && (
                                    <Button onClick={() => action('submit')}>
                                        <Send className="mr-1.5 size-4" />
                                        Submit For Review
                                    </Button>
                                )}

                                {article.status === 'pending' && canApprove && (
                                    <>
                                        <Button onClick={() => action('approve')}>
                                            <ThumbsUp className="mr-1.5 size-4" />
                                            Approve
                                        </Button>
                                        <Button variant="destructive" onClick={() => action('reject')}>
                                            <ThumbsDown className="mr-1.5 size-4" />
                                            Reject
                                        </Button>
                                    </>
                                )}

                                {isAdmin && article.status !== 'published' && (
                                    <Button variant="secondary" onClick={() => action('publish')}>Publish Now</Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
