import { Head, Link, useForm } from '@inertiajs/react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/rich-text-editor';
import AppLayout from '@/layouts/app-layout';
import type { Article, BreadcrumbItem, Category, Tag } from '@/types';

type Props = {
    article: Article;
    categories: Category[];
    tags: Tag[];
};

type ArticleFormData = {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    featured_image: string;
    published_at: string;
    category_ids: string[];
    tag_names: string[];
    meta_title: string;
    meta_description: string;
    meta_keywords: string;
    og_image: string;
    canonical_url: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/reporter/dashboard' },
    { title: 'Articles', href: '/articles' },
    { title: 'Edit', href: '/articles' },
];

const slugify = (value: string) =>
    value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

const toInputDateTime = (value: string | null): string => {
    if (!value) return '';
    const date = new Date(value);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export default function EditArticle({ article, categories, tags }: Props) {
    const { data, setData, put, processing, errors } = useForm<ArticleFormData>({
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt ?? '',
        content: article.content,
        featured_image: article.featured_image ?? '',
        published_at: toInputDateTime(article.published_at),
        category_ids: article.categories?.map((category) => String(category.id)) ?? [],
        tag_names: article.tags?.map((tag) => tag.name) ?? [],
        meta_title: article.meta?.meta_title ?? '',
        meta_description: article.meta?.meta_description ?? '',
        meta_keywords: article.meta?.meta_keywords ?? '',
        og_image: article.meta?.og_image ?? '',
        canonical_url: article.meta?.canonical_url ?? '',
    });
    const [tagInput, setTagInput] = React.useState('');
    const [dirtySlug, setDirtySlug] = React.useState(false);

    React.useEffect(() => {
        if (!dirtySlug) setData('slug', slugify(data.title));
    }, [data.title]);

    const addTag = () => {
        const value = tagInput.trim();
        if (!value || data.tag_names.includes(value)) return;
        setData('tag_names', [...data.tag_names, value]);
        setTagInput('');
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/articles/${article.id}`);
    };

    const submitForReview = () => {
        put(`/articles/${article.id}`, {
            onSuccess: () => {
                window.location.href = `/articles/${article.id}`;
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit: ${article.title}`} />
            <div className="grid gap-6 p-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between gap-2">
                            <span>Edit Article</span>
                            <span className="text-muted-foreground text-xs uppercase">{article.status}</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="grid gap-4">
                            <div className="grid gap-1.5">
                                <Label htmlFor="title">Title</Label>
                                <Input id="title" value={data.title} onChange={(e) => setData('title', e.target.value)} />
                                {errors.title && <p className="text-destructive text-xs">{errors.title}</p>}
                            </div>

                            <div className="grid gap-1.5 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="slug">Slug</Label>
                                    <Input id="slug" value={data.slug} onChange={(e) => { setDirtySlug(true); setData('slug', e.target.value); }} />
                                    {errors.slug && <p className="text-destructive text-xs">{errors.slug}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="published_at">Publish Date</Label>
                                    <Input id="published_at" type="datetime-local" value={data.published_at} onChange={(e) => setData('published_at', e.target.value)} />
                                </div>
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="featured_image">Featured Image URL</Label>
                                <Input id="featured_image" value={data.featured_image} onChange={(e) => setData('featured_image', e.target.value)} />
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="excerpt">Excerpt</Label>
                                <Textarea id="excerpt" className="h-24" value={data.excerpt} onChange={(e) => setData('excerpt', e.target.value)} />
                                {errors.excerpt && <p className="text-destructive text-xs">{errors.excerpt}</p>}
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="content">Content</Label>
                                <RichTextEditor value={data.content} onChange={(value) => setData('content', value)} placeholder="Write your story..." />
                                {errors.content && <p className="text-destructive text-xs">{errors.content}</p>}
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="category_ids">Categories</Label>
                                    <select
                                        id="category_ids"
                                        multiple
                                        value={data.category_ids}
                                        onChange={(e) => setData('category_ids', Array.from(e.target.selectedOptions, (o) => o.value))}
                                        className="border-input bg-background h-32 rounded-md border px-3 py-2 text-sm"
                                    >
                                        {categories.map((category) => (
                                            <option key={category.id} value={String(category.id)}>{category.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid gap-1.5">
                                    <Label htmlFor="tags">Tags</Label>
                                    <div className="flex flex-wrap gap-2 pb-2">
                                        {data.tag_names.map((tag) => (
                                            <button
                                                key={tag}
                                                type="button"
                                                onClick={() => setData('tag_names', data.tag_names.filter((item) => item !== tag))}
                                                className="bg-muted rounded-full px-3 py-1 text-xs"
                                            >
                                                {tag} ×
                                            </button>
                                        ))}
                                    </div>
                                    <Input
                                        id="tags"
                                        list="tag-list"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addTag();
                                            }
                                        }}
                                        placeholder="Type tag and press Enter"
                                    />
                                    <datalist id="tag-list">
                                        {tags.map((tag) => (
                                            <option key={tag.id} value={tag.name} />
                                        ))}
                                    </datalist>
                                </div>
                            </div>

                            <details className="rounded-lg border p-4">
                                <summary className="cursor-pointer text-sm font-medium">SEO Metadata</summary>
                                <div className="mt-4 grid gap-3">
                                    <Input placeholder="Meta title" value={data.meta_title} onChange={(e) => setData('meta_title', e.target.value)} />
                                    <Textarea placeholder="Meta description" value={data.meta_description} onChange={(e) => setData('meta_description', e.target.value)} />
                                    <Input placeholder="Meta keywords" value={data.meta_keywords} onChange={(e) => setData('meta_keywords', e.target.value)} />
                                    <Input placeholder="OG image URL" value={data.og_image} onChange={(e) => setData('og_image', e.target.value)} />
                                    <Input placeholder="Canonical URL" value={data.canonical_url} onChange={(e) => setData('canonical_url', e.target.value)} />
                                </div>
                            </details>

                            <div className="flex flex-wrap justify-between gap-2">
                                <Button variant="outline" asChild>
                                    <Link href="/articles">Back</Link>
                                </Button>
                                <div className="flex gap-2">
                                    <Button type="button" variant="secondary" onClick={submitForReview} disabled={processing}>Save & Continue</Button>
                                    <Button type="submit" disabled={processing}>Save Changes</Button>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
