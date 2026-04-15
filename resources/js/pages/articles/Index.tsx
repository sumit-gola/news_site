import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { Article, BreadcrumbItem, Category, Paginated, Tag, User } from '@/types';

type Filters = {
    search?: string;
    status?: string;
    author_id?: string;
    category_id?: string;
    tag_id?: string;
};

type Props = {
    articles: Paginated<Article>;
    filters: Filters;
    statuses: string[];
    summary: Record<'total' | 'draft' | 'pending' | 'published' | 'rejected', number>;
    authors: Pick<User, 'id' | 'name'>[];
    categories: Category[];
    tags: Tag[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/reporter/dashboard' },
    { title: 'Articles', href: '/articles' },
];

const statusTone: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    draft: 'secondary',
    pending: 'outline',
    published: 'default',
    rejected: 'destructive',
};

export default function ArticleIndex({ articles, filters, statuses, summary, authors, categories, tags }: Props) {
    const applyFilter = (next: Partial<Filters>) => {
        router.get('/articles', { ...filters, ...next }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const resetFilters = () => {
        router.get('/articles', {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    const remove = (id: number) => {
        if (!window.confirm('Delete this article?')) return;
        router.delete(`/articles/${id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Articles" />

            <div className="grid gap-6 p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Article CMS</h1>
                        <p className="text-muted-foreground text-sm">Manage drafts, approval workflow, and published stories.</p>
                    </div>
                    <Button asChild>
                        <Link href="/articles/create">
                            <Plus className="mr-1.5 size-4" />
                            New Article
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-5">
                    <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{summary.total}</div></CardContent></Card>
                    <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Draft</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{summary.draft}</div></CardContent></Card>
                    <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Pending</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{summary.pending}</div></CardContent></Card>
                    <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Published</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{summary.published}</div></CardContent></Card>
                    <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Rejected</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{summary.rejected}</div></CardContent></Card>
                </div>

                <Card>
                    <CardContent className="grid gap-3 p-4 md:grid-cols-6">
                        <div className="md:col-span-2">
                            <Label htmlFor="search">Search</Label>
                            <div className="relative mt-1">
                                <Search className="text-muted-foreground absolute left-2.5 top-2.5 size-4" />
                                <Input
                                    id="search"
                                    defaultValue={filters.search ?? ''}
                                    className="pl-8"
                                    placeholder="Title or excerpt"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            applyFilter({ search: (e.target as HTMLInputElement).value });
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="author_id">Author</Label>
                            <select
                                id="author_id"
                                className="border-input bg-background mt-1 h-9 w-full rounded-md border px-3 text-sm"
                                value={filters.author_id ?? ''}
                                onChange={(e) => applyFilter({ author_id: e.target.value || undefined })}
                            >
                                <option value="">All authors</option>
                                {authors.map((author) => (
                                    <option key={author.id} value={String(author.id)}>{author.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <Label htmlFor="status">Status</Label>
                            <select
                                id="status"
                                className="border-input bg-background mt-1 h-9 w-full rounded-md border px-3 text-sm"
                                value={filters.status ?? ''}
                                onChange={(e) => applyFilter({ status: e.target.value || undefined })}
                            >
                                <option value="">All statuses</option>
                                {statuses.map((status) => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <Label htmlFor="category_id">Category</Label>
                            <select
                                id="category_id"
                                className="border-input bg-background mt-1 h-9 w-full rounded-md border px-3 text-sm"
                                value={filters.category_id ?? ''}
                                onChange={(e) => applyFilter({ category_id: e.target.value || undefined })}
                            >
                                <option value="">All categories</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={String(category.id)}>{category.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <Label htmlFor="tag_id">Tag</Label>
                            <div className="mt-1 flex gap-2">
                                <select
                                    id="tag_id"
                                    className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                                    value={filters.tag_id ?? ''}
                                    onChange={(e) => applyFilter({ tag_id: e.target.value || undefined })}
                                >
                                    <option value="">All tags</option>
                                    {tags.map((tag) => (
                                        <option key={tag.id} value={String(tag.id)}>{tag.name}</option>
                                    ))}
                                </select>
                                <Button type="button" variant="outline" onClick={resetFilters}>Reset</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Articles</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4 text-sm text-muted-foreground">
                            Showing {articles.from ?? 0}-{articles.to ?? 0} of {articles.total} articles
                        </div>

                        {articles.data.length === 0 ? (
                            <div className="rounded-lg border border-dashed p-10 text-center">
                                <h3 className="text-base font-semibold">No articles matched these filters</h3>
                                <p className="mt-2 text-sm text-muted-foreground">Try adjusting the search, author, status, category, or tag filters.</p>
                                <Button type="button" variant="outline" className="mt-4" onClick={resetFilters}>Reset filters</Button>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[900px] text-sm">
                                        <thead>
                                            <tr className="border-b text-left">
                                                <th className="py-2 pr-3">Title</th>
                                                <th className="py-2 pr-3">Author</th>
                                                <th className="py-2 pr-3">Category</th>
                                                <th className="py-2 pr-3">Tags</th>
                                                <th className="py-2 pr-3">Status</th>
                                                <th className="py-2 pr-3">Updated</th>
                                                <th className="py-2 pr-3 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {articles.data.map((article) => (
                                                <tr key={article.id} className="border-b">
                                                    <td className="py-3 pr-3 align-top">
                                                        <Link href={`/articles/${article.id}/edit`} className="font-medium hover:underline">{article.title}</Link>
                                                        <p className="text-muted-foreground text-xs">/{article.slug}</p>
                                                    </td>
                                                    <td className="py-3 pr-3 align-top">{article.author?.name ?? '-'}</td>
                                                    <td className="py-3 pr-3 align-top">{article.categories?.[0]?.name ?? '-'}</td>
                                                    <td className="py-3 pr-3 align-top">
                                                        <div className="flex flex-wrap gap-1">
                                                            {article.tags?.slice(0, 3).map((tag) => (
                                                                <Badge key={tag.id} variant="outline">{tag.name}</Badge>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 pr-3 align-top">
                                                        <Badge variant={statusTone[article.status] ?? 'secondary'}>{article.status}</Badge>
                                                    </td>
                                                    <td className="py-3 pr-3 align-top">{new Date(article.updated_at).toLocaleString()}</td>
                                                    <td className="py-3 pr-0 align-top">
                                                        <div className="flex justify-end gap-2">
                                                            {article.permissions?.view && (
                                                                <Button size="sm" variant="outline" asChild>
                                                                    <Link href={`/articles/${article.id}`}>View</Link>
                                                                </Button>
                                                            )}
                                                            {article.permissions?.update && (
                                                                <Button size="sm" variant="outline" asChild>
                                                                    <Link href={`/articles/${article.id}/edit`}>Edit</Link>
                                                                </Button>
                                                            )}
                                                            {article.permissions?.delete && (
                                                                <Button size="sm" variant="destructive" onClick={() => remove(article.id)}>
                                                                    <Trash2 className="size-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-4 flex flex-wrap items-center gap-2">
                                    {articles.links.map((link, idx) => (
                                        <Link
                                            key={`${link.label}-${idx}`}
                                            href={link.url ?? '#'}
                                            className={`rounded-md px-3 py-1.5 text-sm ${link.active ? 'bg-primary text-primary-foreground' : 'border'} ${!link.url ? 'pointer-events-none opacity-50' : ''}`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
