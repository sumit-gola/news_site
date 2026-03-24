import { Head, Link, useForm } from '@inertiajs/react';
import * as React from 'react';
import {
    Calendar,
    ChevronDown,
    Globe,
    Hash,
    Image as ImageIcon,
    Layers,
    Link2,
    RefreshCw,
    Search,
    Send,
    Tag,
    X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/rich-text-editor';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Category, Tag as TagType } from '@/types';

type Props = {
    categories: Category[];
    tags: TagType[];
    languages: Record<string, string>;
};

type ArticleFormData = {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    featured_image: string;
    language: string;
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
    { title: 'New Article', href: '/articles/create' },
];

const slugify = (value: string) =>
    value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

export default function CreateArticle({ categories, tags, languages = { en: 'English', hi: 'हिंदी' } }: Props) {
    const { data, setData, post, processing, errors } = useForm<ArticleFormData>({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        featured_image: '',
        language: 'en',
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
    const [seoOpen, setSeoOpen] = React.useState(false);
    const [imagePreviewError, setImagePreviewError] = React.useState(false);
    const categoryDropdownRef = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
        if (!dirtySlug) setData('slug', slugify(data.title));
    }, [data.title]);

    React.useEffect(() => {
        setImagePreviewError(false);
    }, [data.featured_image]);

    React.useEffect(() => {
        if (!isCategoryOpen) return;
        const onClickOutside = (e: MouseEvent) => {
            if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
                setIsCategoryOpen(false);
            }
        };
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, [isCategoryOpen]);

    const filteredCategories = React.useMemo(() => {
        const q = categoryQuery.trim().toLowerCase();
        return q ? categories.filter((c) => c.name.toLowerCase().includes(q)) : categories;
    }, [categories, categoryQuery]);

    const selectedCategoryNames = React.useMemo(() => {
        const selected = new Set(data.category_ids);
        return categories.filter((c) => selected.has(String(c.id))).map((c) => c.name);
    }, [categories, data.category_ids]);

    const addTag = () => {
        const value = tagInput.trim();
        if (!value || data.tag_names.includes(value)) return;
        setData('tag_names', [...data.tag_names, value]);
        setTagInput('');
    };

    const toggleCategory = (id: string) => {
        setData('category_ids',
            data.category_ids.includes(id)
                ? data.category_ids.filter((v) => v !== id)
                : [...data.category_ids, id],
        );
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/articles');
    };

    const excerptLen = data.excerpt.length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New Article" />

            <form onSubmit={submit}>
                {/* ── Top action bar ── */}
                <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-background/95 px-6 py-3 backdrop-blur">
                    <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="text-xs font-medium">Draft</Badge>
                        <span className="text-muted-foreground text-xs">
                            {data.title ? `"${data.title.slice(0, 40)}${data.title.length > 40 ? '…' : ''}"` : 'New article'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/articles">Discard</Link>
                        </Button>
                        <Button size="sm" type="submit" disabled={processing} className="gap-1.5">
                            <Send className="size-3.5" />
                            Save Draft
                        </Button>
                    </div>
                </div>

                {/* ── Two-column layout ── */}
                <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 p-6 xl:grid-cols-[1fr_320px]">

                    {/* ════ LEFT: Main content ════ */}
                    <div className="space-y-5">

                        {/* Title */}
                        <div className="space-y-1">
                            <textarea
                                value={data.title}
                                onChange={(e) => setData('title', e.target.value)}
                                placeholder="Article title…"
                                rows={2}
                                className="w-full resize-none border-0 bg-transparent p-0 text-3xl font-bold leading-tight tracking-tight placeholder:text-muted-foreground/50 focus:outline-none"
                            />
                            {errors.title && <p className="text-destructive text-xs">{errors.title}</p>}
                        </div>

                        {/* Slug row */}
                        <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
                            <Link2 className="text-muted-foreground size-3.5 shrink-0" />
                            <span className="text-muted-foreground text-xs">/news/</span>
                            <input
                                value={data.slug}
                                onChange={(e) => { setDirtySlug(true); setData('slug', e.target.value); }}
                                placeholder="article-slug"
                                className="min-w-0 flex-1 bg-transparent text-xs font-mono focus:outline-none"
                            />
                            {dirtySlug && (
                                <button
                                    type="button"
                                    onClick={() => { setDirtySlug(false); setData('slug', slugify(data.title)); }}
                                    className="text-muted-foreground hover:text-foreground"
                                    title="Reset to auto-generated"
                                >
                                    <RefreshCw className="size-3" />
                                </button>
                            )}
                            {errors.slug && <span className="text-destructive text-xs">{errors.slug}</span>}
                        </div>

                        {/* Excerpt */}
                        <Card>
                            <CardHeader className="pb-2 pt-4">
                                <CardTitle className="text-sm font-medium">Excerpt / Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="pb-4">
                                <Textarea
                                    value={data.excerpt}
                                    onChange={(e) => setData('excerpt', e.target.value)}
                                    placeholder="Brief summary shown in article cards and search results…"
                                    className="h-20 resize-none text-sm"
                                    maxLength={300}
                                />
                                <div className="mt-1.5 flex items-center justify-between">
                                    {errors.excerpt
                                        ? <p className="text-destructive text-xs">{errors.excerpt}</p>
                                        : <span />}
                                    <span className={`text-xs tabular-nums ${excerptLen > 280 ? 'text-orange-500' : 'text-muted-foreground'}`}>
                                        {excerptLen}/300
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Content */}
                        <Card>
                            <CardHeader className="pb-2 pt-4">
                                <CardTitle className="text-sm font-medium">Content</CardTitle>
                            </CardHeader>
                            <CardContent className="pb-4">
                                <RichTextEditor
                                    value={data.content}
                                    onChange={(value) => setData('content', value)}
                                    placeholder="Write your story…"
                                />
                                {errors.content && <p className="text-destructive mt-1.5 text-xs">{errors.content}</p>}
                            </CardContent>
                        </Card>

                        {/* SEO — collapsible */}
                        <Card>
                            <button
                                type="button"
                                onClick={() => setSeoOpen((v) => !v)}
                                className="flex w-full items-center justify-between px-6 py-4 text-left"
                            >
                                <div className="flex items-center gap-2">
                                    <Globe className="text-muted-foreground size-4" />
                                    <span className="text-sm font-medium">SEO &amp; Open Graph</span>
                                    {(data.meta_title || data.meta_description) && (
                                        <Badge variant="outline" className="text-[10px]">Filled</Badge>
                                    )}
                                </div>
                                <ChevronDown className={`text-muted-foreground size-4 transition-transform ${seoOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {seoOpen && (
                                <>
                                    <Separator />
                                    <CardContent className="grid gap-3 pt-4 pb-5">
                                        <div className="grid gap-1">
                                            <Label className="text-xs">Meta Title</Label>
                                            <Input
                                                value={data.meta_title}
                                                onChange={(e) => setData('meta_title', e.target.value)}
                                                placeholder="Defaults to article title"
                                                className="h-8 text-sm"
                                            />
                                            <p className="text-muted-foreground text-[11px]">
                                                {data.meta_title.length}/60 chars recommended
                                            </p>
                                        </div>
                                        <div className="grid gap-1">
                                            <Label className="text-xs">Meta Description</Label>
                                            <Textarea
                                                value={data.meta_description}
                                                onChange={(e) => setData('meta_description', e.target.value)}
                                                placeholder="Shown in Google search results…"
                                                className="h-18 resize-none text-sm"
                                                maxLength={160}
                                            />
                                            <p className="text-muted-foreground text-[11px]">
                                                {data.meta_description.length}/160 chars recommended
                                            </p>
                                        </div>
                                        <div className="grid gap-1">
                                            <Label className="text-xs">Meta Keywords</Label>
                                            <Input
                                                value={data.meta_keywords}
                                                onChange={(e) => setData('meta_keywords', e.target.value)}
                                                placeholder="keyword1, keyword2, …"
                                                className="h-8 text-sm"
                                            />
                                        </div>
                                        <div className="grid gap-1">
                                            <Label className="text-xs">OG Image URL</Label>
                                            <Input
                                                value={data.og_image}
                                                onChange={(e) => setData('og_image', e.target.value)}
                                                placeholder="https://…"
                                                className="h-8 text-sm"
                                            />
                                        </div>
                                        <div className="grid gap-1">
                                            <Label className="text-xs">Canonical URL</Label>
                                            <Input
                                                value={data.canonical_url}
                                                onChange={(e) => setData('canonical_url', e.target.value)}
                                                placeholder="https://…"
                                                className="h-8 text-sm"
                                            />
                                        </div>
                                    </CardContent>
                                </>
                            )}
                        </Card>
                    </div>

                    {/* ════ RIGHT: Sidebar ════ */}
                    <div className="space-y-4">

                        {/* Publish settings */}
                        <Card>
                            <CardHeader className="pb-2 pt-4">
                                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                                    <Calendar className="text-muted-foreground size-3.5" />
                                    Publish
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 pb-4">
                                <div className="grid gap-1">
                                    <Label className="text-xs">Schedule date &amp; time</Label>
                                    <Input
                                        type="datetime-local"
                                        value={data.published_at}
                                        onChange={(e) => setData('published_at', e.target.value)}
                                        className="h-8 text-xs"
                                    />
                                    {errors.published_at && (
                                        <p className="text-destructive text-xs">{errors.published_at}</p>
                                    )}
                                    <p className="text-muted-foreground text-[11px]">Leave blank to publish manually</p>
                                </div>
                                <Separator />
                                <Button type="submit" disabled={processing} className="w-full gap-2" size="sm">
                                    <Send className="size-3.5" />
                                    Save as Draft
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Language */}
                        <Card>
                            <CardHeader className="pb-2 pt-4">
                                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                                    <Globe className="text-muted-foreground size-3.5" />
                                    Language
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pb-4">
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(languages).map(([code, label]) => (
                                        <button
                                            key={code}
                                            type="button"
                                            onClick={() => setData('language', code)}
                                            className={`flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition ${
                                                data.language === code
                                                    ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                                                    : 'border-border text-muted-foreground hover:border-border/80 hover:bg-muted/50'
                                            }`}
                                        >
                                            <span>{code === 'en' ? '🇬🇧' : '🇮🇳'}</span>
                                            {label}
                                        </button>
                                    ))}
                                </div>
                                {errors.language && <p className="text-destructive mt-1 text-xs">{errors.language}</p>}
                            </CardContent>
                        </Card>

                        {/* Featured Image */}
                        <Card>
                            <CardHeader className="pb-2 pt-4">
                                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                                    <ImageIcon className="text-muted-foreground size-3.5" />
                                    Featured Image
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 pb-4">
                                {data.featured_image && !imagePreviewError ? (
                                    <div className="relative overflow-hidden rounded-md border">
                                        <img
                                            src={data.featured_image}
                                            alt="Featured"
                                            className="aspect-video w-full object-cover"
                                            onError={() => setImagePreviewError(true)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setData('featured_image', '')}
                                            className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                                        >
                                            <X className="size-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex aspect-video items-center justify-center rounded-md border border-dashed bg-muted/30">
                                        <div className="text-center">
                                            <ImageIcon className="text-muted-foreground/40 mx-auto size-8" />
                                            <p className="text-muted-foreground/60 mt-1 text-[11px]">Paste image URL below</p>
                                        </div>
                                    </div>
                                )}
                                <Input
                                    value={data.featured_image}
                                    onChange={(e) => setData('featured_image', e.target.value)}
                                    placeholder="https://example.com/image.jpg"
                                    className="h-8 text-xs"
                                />
                            </CardContent>
                        </Card>

                        {/* Categories */}
                        <Card>
                            <CardHeader className="pb-2 pt-4">
                                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                                    <Layers className="text-muted-foreground size-3.5" />
                                    Categories
                                    {data.category_ids.length > 0 && (
                                        <Badge variant="secondary" className="ml-auto text-[10px]">
                                            {data.category_ids.length}
                                        </Badge>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pb-4">
                                <div ref={categoryDropdownRef} className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setIsCategoryOpen((v) => !v)}
                                        className="flex h-8 w-full items-center justify-between rounded-md border bg-background px-3 text-xs text-muted-foreground hover:border-ring/50"
                                    >
                                        <span>
                                            {selectedCategoryNames.length > 0
                                                ? selectedCategoryNames.slice(0, 2).join(', ') + (selectedCategoryNames.length > 2 ? ` +${selectedCategoryNames.length - 2}` : '')
                                                : 'Select categories…'}
                                        </span>
                                        <ChevronDown className="size-3 shrink-0" />
                                    </button>

                                    {isCategoryOpen && (
                                        <div className="bg-background absolute z-30 mt-1 w-full rounded-md border shadow-lg">
                                            <div className="p-2">
                                                <div className="relative">
                                                    <Search className="text-muted-foreground absolute left-2 top-1/2 size-3 -translate-y-1/2" />
                                                    <Input
                                                        value={categoryQuery}
                                                        onChange={(e) => setCategoryQuery(e.target.value)}
                                                        placeholder="Search…"
                                                        className="h-7 pl-6 text-xs"
                                                        autoFocus
                                                    />
                                                </div>
                                            </div>
                                            <div className="max-h-48 overflow-auto px-2 pb-2">
                                                {filteredCategories.length === 0 ? (
                                                    <p className="px-2 py-3 text-center text-xs text-muted-foreground">No categories found</p>
                                                ) : (
                                                    filteredCategories.map((category) => {
                                                        const id = String(category.id);
                                                        const checked = data.category_ids.includes(id);
                                                        return (
                                                            <label
                                                                key={category.id}
                                                                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-muted/60"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={checked}
                                                                    onChange={() => toggleCategory(id)}
                                                                    className="size-3.5 accent-red-600"
                                                                />
                                                                {category.name}
                                                            </label>
                                                        );
                                                    })
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between border-t px-2 py-1.5">
                                                <button
                                                    type="button"
                                                    className="text-xs text-muted-foreground hover:text-foreground"
                                                    onClick={() => setData('category_ids', [])}
                                                >
                                                    Clear all
                                                </button>
                                                <button
                                                    type="button"
                                                    className="text-xs font-medium text-red-600 hover:text-red-700"
                                                    onClick={() => setIsCategoryOpen(false)}
                                                >
                                                    Done
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {selectedCategoryNames.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {selectedCategoryNames.map((name, i) => {
                                            const cat = categories.find((c) => c.name === name);
                                            return (
                                                <Badge
                                                    key={name}
                                                    variant="secondary"
                                                    className="gap-1 pr-1 text-[10px]"
                                                >
                                                    {name}
                                                    <button
                                                        type="button"
                                                        onClick={() => cat && toggleCategory(String(cat.id))}
                                                        className="hover:text-destructive ml-0.5"
                                                    >
                                                        <X className="size-2.5" />
                                                    </button>
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Tags */}
                        <Card>
                            <CardHeader className="pb-2 pt-4">
                                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                                    <Tag className="text-muted-foreground size-3.5" />
                                    Tags
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pb-4 space-y-2">
                                {data.tag_names.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {data.tag_names.map((tag) => (
                                            <Badge key={tag} variant="outline" className="gap-1 pr-1 text-[10px]">
                                                <Hash className="size-2.5" />
                                                {tag}
                                                <button
                                                    type="button"
                                                    onClick={() => setData('tag_names', data.tag_names.filter((t) => t !== tag))}
                                                    className="hover:text-destructive ml-0.5"
                                                >
                                                    <X className="size-2.5" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                                <div className="flex gap-1.5">
                                    <Input
                                        list="tag-list"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') { e.preventDefault(); addTag(); }
                                            if (e.key === ',' ) { e.preventDefault(); addTag(); }
                                        }}
                                        placeholder="Add tag…"
                                        className="h-8 text-xs"
                                    />
                                    <Button type="button" size="sm" variant="outline" className="h-8 px-2.5" onClick={addTag}>
                                        Add
                                    </Button>
                                </div>
                                <datalist id="tag-list">
                                    {tags.map((tag) => <option key={tag.id} value={tag.name} />)}
                                </datalist>
                                <p className="text-muted-foreground text-[11px]">Press Enter or comma to add</p>
                                {errors.tag_names && <p className="text-destructive text-xs">{errors.tag_names}</p>}
                            </CardContent>
                        </Card>

                    </div>
                </div>
            </form>
        </AppLayout>
    );
}
