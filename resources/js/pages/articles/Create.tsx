import { Head, useForm } from '@inertiajs/react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/rich-text-editor';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Category, Tag } from '@/types';

type Props = {
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
    { title: 'Create', href: '/articles/create' },
];

const slugify = (value: string) =>
    value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

export default function CreateArticle({ categories, tags }: Props) {
    const { data, setData, post, processing, errors } = useForm<ArticleFormData>({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        featured_image: '',
        published_at: '',
        category_ids: [],
        tag_names: [],
        meta_title: '',
        meta_description: '',
        meta_keywords: '',
        og_image: '',
        canonical_url: '',
    });
    const [tagInput, setTagInput] = React.useState('');
    const [dirtySlug, setDirtySlug] = React.useState(false);
    const [isCategoryOpen, setIsCategoryOpen] = React.useState(false);
    const [categoryQuery, setCategoryQuery] = React.useState('');
    const categoryDropdownRef = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
        if (!dirtySlug) setData('slug', slugify(data.title));
    }, [data.title]);

    React.useEffect(() => {
        if (!isCategoryOpen) return;

        const onClickOutside = (event: MouseEvent) => {
            if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
                setIsCategoryOpen(false);
            }
        };

        document.addEventListener('mousedown', onClickOutside);

        return () => {
            document.removeEventListener('mousedown', onClickOutside);
        };
    }, [isCategoryOpen]);

    const filteredCategories = React.useMemo(() => {
        const q = categoryQuery.trim().toLowerCase();
        if (!q) return categories;

        return categories.filter((category) => category.name.toLowerCase().includes(q));
    }, [categories, categoryQuery]);

    const selectedCategoryNames = React.useMemo(() => {
        const selected = new Set(data.category_ids);
        return categories.filter((category) => selected.has(String(category.id))).map((category) => category.name);
    }, [categories, data.category_ids]);

    const addTag = () => {
        const value = tagInput.trim();
        if (!value || data.tag_names.includes(value)) return;
        setData('tag_names', [...data.tag_names, value]);
        setTagInput('');
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/articles');
    };

    const toggleCategory = (id: string) => {
        if (data.category_ids.includes(id)) {
            setData('category_ids', data.category_ids.filter((value) => value !== id));
            return;
        }

        setData('category_ids', [...data.category_ids, id]);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Article" />
            <div className="grid gap-6 p-6">
                <Card>
                    <CardHeader><CardTitle>Create Article</CardTitle></CardHeader>
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
                                    {errors.published_at && <p className="text-destructive text-xs">{errors.published_at}</p>}
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
                                    <div ref={categoryDropdownRef} className="relative">
                                        <Button
                                            id="category_ids"
                                            type="button"
                                            variant="outline"
                                            className="h-auto min-h-10 w-full justify-between px-3 py-2 text-left"
                                            onClick={() => setIsCategoryOpen((open) => !open)}
                                        >
                                            <span className="line-clamp-2 text-sm font-normal">
                                                {selectedCategoryNames.length > 0 ? selectedCategoryNames.join(', ') : 'Select categories'}
                                            </span>
                                            <span className="text-xs text-muted-foreground">Search</span>
                                        </Button>

                                        {isCategoryOpen && (
                                            <div className="bg-background absolute z-20 mt-2 w-full rounded-md border p-2 shadow-md">
                                                <Input
                                                    value={categoryQuery}
                                                    onChange={(e) => setCategoryQuery(e.target.value)}
                                                    placeholder="Search categories..."
                                                />

                                                <div className="mt-2 max-h-56 space-y-1 overflow-auto">
                                                    {filteredCategories.length === 0 && (
                                                        <p className="px-2 py-1 text-xs text-muted-foreground">No categories found.</p>
                                                    )}

                                                    {filteredCategories.map((category) => {
                                                        const id = String(category.id);
                                                        const checked = data.category_ids.includes(id);

                                                        return (
                                                            <label
                                                                key={category.id}
                                                                className="hover:bg-muted/60 flex cursor-pointer items-center gap-2 rounded-md px-2 py-1"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={checked}
                                                                    onChange={() => toggleCategory(id)}
                                                                    className="size-4"
                                                                />
                                                                <span className="text-sm">{category.name}</span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>

                                                <div className="mt-2 flex items-center justify-between">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setData('category_ids', [])}
                                                    >
                                                        Clear
                                                    </Button>
                                                    <Button type="button" size="sm" onClick={() => setIsCategoryOpen(false)}>
                                                        Done
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {selectedCategoryNames.length > 0 && (
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {selectedCategoryNames.map((name) => (
                                                <span key={name} className="bg-muted rounded-full px-2 py-0.5 text-xs">
                                                    {name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
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
                                    {errors.tag_names && <p className="text-destructive text-xs">{errors.tag_names}</p>}
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

                            <div className="flex justify-end">
                                <Button type="submit" disabled={processing}>Create Draft</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
