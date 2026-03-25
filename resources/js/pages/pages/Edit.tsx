import { Head, Link, useForm } from '@inertiajs/react';
import {
    Calendar,
    ChevronDown,
    Eye,
    FileText,
    Globe,
    Hash,
    Image as ImageIcon,
    Info,
    LayoutTemplate,
    Link2,
    Loader2,
    RefreshCw,
    Search,
    Star,
} from 'lucide-react';
import * as React from 'react';

import { RichTextEditor } from '@/components/rich-text-editor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem, Category, Page } from '@/types';

interface Props {
    page: Page;
    categories: Category[];
}

type PageFormData = {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    featured_image: string;
    category_id: string;
    status: 'draft' | 'published';
    template: 'default' | 'full-width' | 'landing';
    published_at: string;
    show_in_menu: boolean;
    is_featured: boolean;
    noindex: boolean;
    order: string;
    meta_title: string;
    meta_description: string;
    meta_keywords: string;
    og_image: string;
    canonical_url: string;
};

const slugify = (v: string) =>
    v.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

const TEMPLATE_OPTIONS = [
    { value: 'default',    label: 'Default',    desc: 'Standard page with sidebar' },
    { value: 'full-width', label: 'Full Width',  desc: 'No sidebar, full content width' },
    { value: 'landing',    label: 'Landing',     desc: 'No header/footer distractions' },
] as const;

export default function EditPage({ page, categories }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Pages', href: '/pages' },
        { title: page.title, href: `/pages/${page.slug}/edit` },
    ];

    const { data, setData, put, processing, errors } = useForm<PageFormData>({
        title:            page.title,
        slug:             page.slug,
        excerpt:          page.excerpt ?? '',
        content:          page.content ?? '',
        featured_image:   page.featured_image ?? '',
        category_id:      page.category_id ? String(page.category_id) : '',
        status:           page.status,
        template:         page.template,
        published_at:     page.published_at
            ? new Date(page.published_at).toISOString().slice(0, 16)
            : '',
        show_in_menu:     page.show_in_menu,
        is_featured:      page.is_featured,
        noindex:          page.noindex,
        order:            String(page.order),
        meta_title:       page.seo_meta?.meta_title ?? '',
        meta_description: page.seo_meta?.meta_description ?? '',
        meta_keywords:    page.seo_meta?.meta_keywords ?? '',
        og_image:         page.seo_meta?.og_image ?? '',
        canonical_url:    page.seo_meta?.canonical_url ?? '',
    });

    const [dirtySlug, setDirtySlug] = React.useState(true); // always true for edit (don't auto-change)
    const [catOpen, setCatOpen] = React.useState(false);
    const [catQuery, setCatQuery] = React.useState('');
    const catRef = React.useRef<HTMLDivElement>(null);
    const [imgError, setImgError] = React.useState(false);

    React.useEffect(() => {
        if (!dirtySlug) setData('slug', slugify(data.title));
    }, [data.title]);

    React.useEffect(() => { setImgError(false); }, [data.featured_image]);

    React.useEffect(() => {
        if (!catOpen) return;
        const handler = (e: MouseEvent) => {
            if (catRef.current && !catRef.current.contains(e.target as Node)) setCatOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [catOpen]);

    const filteredCats = React.useMemo(() => {
        const q = catQuery.toLowerCase();
        return q ? categories.filter((c) => c.name.toLowerCase().includes(q)) : categories;
    }, [categories, catQuery]);

    const selectedCat = categories.find((c) => String(c.id) === data.category_id);

    const submit = (e: React.FormEvent) => { e.preventDefault(); put(`/pages/${page.slug}`); };

    const metaDescLen = data.meta_description.length;
    const metaTitleLen = data.meta_title.length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit — ${page.title}`} />

            <form onSubmit={submit}>
                {/* ── Sticky top bar ── */}
                <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-background/95 px-6 py-3 backdrop-blur">
                    <div className="flex items-center gap-3">
                        <Badge
                            variant="secondary"
                            className={cn('text-xs font-medium', data.status === 'published' && 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300')}
                        >
                            {data.status === 'published' ? 'Published' : 'Draft'}
                        </Badge>
                        <span className="text-muted-foreground text-xs truncate max-w-48">
                            "{data.title.slice(0, 45)}{data.title.length > 45 ? '…' : ''}"
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {page.status === 'published' && (
                            <Button variant="ghost" size="sm" type="button" asChild className="gap-1.5 text-xs">
                                <a href={`/page/${page.slug}`} target="_blank" rel="noopener noreferrer">
                                    <Eye className="size-3.5" /> View
                                </a>
                            </Button>
                        )}
                        <Button variant="outline" size="sm" type="button" asChild>
                            <Link href="/pages">Cancel</Link>
                        </Button>
                        <Button size="sm" type="submit" disabled={processing} className="gap-1.5">
                            {processing && <Loader2 className="size-3.5 animate-spin" />}
                            Save Changes
                        </Button>
                    </div>
                </div>

                {/* ── Two-column layout ── */}
                <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 p-6 xl:grid-cols-[1fr_320px]">

                    {/* ════ LEFT ════ */}
                    <div className="space-y-5 min-w-0">

                        {/* Title */}
                        <div className="space-y-1">
                            <textarea
                                value={data.title}
                                onChange={(e) => setData('title', e.target.value)}
                                placeholder="Page title…"
                                rows={2}
                                className="w-full resize-none border-0 bg-transparent p-0 text-3xl font-bold leading-tight tracking-tight placeholder:text-muted-foreground/40 focus:outline-none"
                            />
                            {errors.title && <p className="text-destructive text-xs">{errors.title}</p>}
                        </div>

                        {/* Slug */}
                        <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
                            <Hash className="text-muted-foreground size-3.5 shrink-0" />
                            <span className="text-muted-foreground text-xs">/page/</span>
                            <input
                                value={data.slug}
                                onChange={(e) => { setDirtySlug(true); setData('slug', e.target.value.toLowerCase().replace(/\s+/g, '-')); }}
                                className="flex-1 bg-transparent text-xs font-mono text-foreground focus:outline-none"
                            />
                            <button
                                type="button"
                                onClick={() => { setDirtySlug(false); setData('slug', slugify(data.title)); }}
                                className="text-muted-foreground hover:text-foreground"
                                title="Re-generate from title"
                            >
                                <RefreshCw className="size-3" />
                            </button>
                        </div>
                        {errors.slug && <p className="text-destructive text-xs -mt-4">{errors.slug}</p>}

                        {/* Tabs */}
                        <Tabs defaultValue="content" className="space-y-4">
                            <TabsList className="h-9">
                                <TabsTrigger value="content" className="gap-1.5 text-xs">
                                    <FileText className="size-3.5" /> Content
                                </TabsTrigger>
                                <TabsTrigger value="seo" className="gap-1.5 text-xs">
                                    <Search className="size-3.5" /> SEO
                                </TabsTrigger>
                                <TabsTrigger value="settings" className="gap-1.5 text-xs">
                                    <Info className="size-3.5" /> Settings
                                </TabsTrigger>
                            </TabsList>

                            {/* ── Content Tab ── */}
                            <TabsContent value="content" className="space-y-5 mt-0">
                                <div className="space-y-1.5">
                                    <Label htmlFor="excerpt">Excerpt</Label>
                                    <Textarea
                                        id="excerpt"
                                        value={data.excerpt}
                                        onChange={(e) => setData('excerpt', e.target.value)}
                                        placeholder="Short summary shown in listings…"
                                        rows={3}
                                        className="resize-none text-sm"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label>Content</Label>
                                    <div className="rounded-lg border overflow-hidden">
                                        <RichTextEditor
                                            value={data.content}
                                            onChange={(v) => setData('content', v)}
                                            uploadUrl="/editor/images/upload"
                                            placeholder="Start writing…"
                                        />
                                    </div>
                                    {errors.content && <p className="text-destructive text-xs">{errors.content}</p>}
                                </div>
                            </TabsContent>

                            {/* ── SEO Tab ── */}
                            <TabsContent value="seo" className="space-y-5 mt-0">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="meta_title">Meta Title</Label>
                                            <span className={cn('text-xs', metaTitleLen > 60 ? 'text-destructive' : 'text-muted-foreground')}>
                                                {metaTitleLen}/60
                                            </span>
                                        </div>
                                        <Input
                                            id="meta_title"
                                            value={data.meta_title}
                                            onChange={(e) => setData('meta_title', e.target.value)}
                                            placeholder="Override page title for search engines"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="canonical_url">
                                            <span className="flex items-center gap-1.5"><Link2 className="size-3.5" /> Canonical URL</span>
                                        </Label>
                                        <Input
                                            id="canonical_url"
                                            value={data.canonical_url}
                                            onChange={(e) => setData('canonical_url', e.target.value)}
                                            placeholder="https://…"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="meta_description">Meta Description</Label>
                                        <span className={cn('text-xs', metaDescLen > 160 ? 'text-destructive' : 'text-muted-foreground')}>
                                            {metaDescLen}/160
                                        </span>
                                    </div>
                                    <Textarea
                                        id="meta_description"
                                        value={data.meta_description}
                                        onChange={(e) => setData('meta_description', e.target.value)}
                                        placeholder="Summary shown in Google search results (max 160 chars)"
                                        rows={3}
                                        className="resize-none text-sm"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="meta_keywords">Meta Keywords</Label>
                                    <Input
                                        id="meta_keywords"
                                        value={data.meta_keywords}
                                        onChange={(e) => setData('meta_keywords', e.target.value)}
                                        placeholder="keyword1, keyword2, keyword3"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="og_image">
                                        <span className="flex items-center gap-1.5"><ImageIcon className="size-3.5" /> OG Image URL</span>
                                    </Label>
                                    <Input
                                        id="og_image"
                                        value={data.og_image}
                                        onChange={(e) => setData('og_image', e.target.value)}
                                        placeholder="https://… (used for social sharing)"
                                    />
                                </div>

                                {/* SEO Preview */}
                                <div className="rounded-xl border bg-muted/20 p-4">
                                    <p className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Search Preview</p>
                                    <div className="space-y-0.5">
                                        <p className="text-xs text-green-700 dark:text-green-400">/page/{data.slug}</p>
                                        <p className="text-base font-medium text-blue-700 dark:text-blue-400 line-clamp-1">
                                            {data.meta_title || data.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {data.meta_description || data.excerpt || 'No description provided.'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                                    <div>
                                        <p className="text-sm font-medium">No-index</p>
                                        <p className="text-muted-foreground text-xs">Tell search engines not to index this page</p>
                                    </div>
                                    <Switch checked={data.noindex} onCheckedChange={(v) => setData('noindex', v)} />
                                </div>
                            </TabsContent>

                            {/* ── Settings Tab ── */}
                            <TabsContent value="settings" className="space-y-5 mt-0">
                                <div className="space-y-2">
                                    <Label>Page Template</Label>
                                    <div className="grid gap-3 sm:grid-cols-3">
                                        {TEMPLATE_OPTIONS.map((t) => (
                                            <button
                                                key={t.value}
                                                type="button"
                                                onClick={() => setData('template', t.value)}
                                                className={cn(
                                                    'flex flex-col items-start gap-1 rounded-xl border p-3.5 text-left transition-all',
                                                    data.template === t.value
                                                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                                        : 'hover:border-muted-foreground/30',
                                                )}
                                            >
                                                <span className="flex items-center gap-2 font-medium text-sm">
                                                    <LayoutTemplate className={cn('size-4', data.template === t.value ? 'text-primary' : 'text-muted-foreground')} />
                                                    {t.label}
                                                </span>
                                                <span className="text-muted-foreground text-xs">{t.desc}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-3">
                                    {([
                                        { key: 'show_in_menu', label: 'Show in navigation menu', desc: 'Display a link to this page in the site navigation' },
                                        { key: 'is_featured',  label: 'Featured page', desc: 'Highlight this page in listings and widgets' },
                                    ] as const).map(({ key, label, desc }) => (
                                        <div key={key} className="flex items-center justify-between rounded-lg border px-4 py-3">
                                            <div>
                                                <p className="text-sm font-medium">{label}</p>
                                                <p className="text-muted-foreground text-xs">{desc}</p>
                                            </div>
                                            <Switch checked={data[key]} onCheckedChange={(v) => setData(key, v)} />
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="order">Sort Order</Label>
                                    <Input
                                        id="order"
                                        type="number"
                                        min={0}
                                        value={data.order}
                                        onChange={(e) => setData('order', e.target.value)}
                                        className="w-28"
                                    />
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* ════ RIGHT SIDEBAR ════ */}
                    <div className="space-y-4 xl:sticky xl:top-[57px] xl:self-start">

                        {/* Publish card */}
                        <Card className="border shadow-none">
                            <CardHeader className="px-4 pb-2 pt-4">
                                <CardTitle className="text-sm font-semibold">Publish</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 px-4 pb-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground">Status</Label>
                                    <div className="flex gap-2">
                                        {(['draft', 'published'] as const).map((s) => (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => setData('status', s)}
                                                className={cn(
                                                    'flex-1 rounded-lg border py-1.5 text-xs font-medium transition-colors capitalize',
                                                    data.status === s
                                                        ? s === 'published'
                                                            ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
                                                            : 'border-primary bg-primary/10 text-primary'
                                                        : 'hover:bg-muted',
                                                )}
                                            >
                                                {s === 'published' ? 'Published' : 'Draft'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="published_at" className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <Calendar className="size-3" /> Publish Date
                                    </Label>
                                    <Input
                                        id="published_at"
                                        type="datetime-local"
                                        value={data.published_at}
                                        onChange={(e) => setData('published_at', e.target.value)}
                                        className="text-xs"
                                    />
                                </div>

                                <Separator />

                                <Button type="submit" size="sm" className="w-full gap-1.5" disabled={processing}>
                                    {processing && <Loader2 className="size-3.5 animate-spin" />}
                                    Save Changes
                                </Button>

                                {page.status === 'published' && (
                                    <a
                                        href={`/page/${page.slug}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                                    >
                                        <Eye className="size-3" /> View live page
                                    </a>
                                )}

                                <div className="text-muted-foreground text-xs space-y-0.5">
                                    <p>Views: <strong className="text-foreground">{page.views.toLocaleString()}</strong></p>
                                    <p>Created: {new Date(page.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Category */}
                        <Card className="border shadow-none">
                            <CardHeader className="px-4 pb-2 pt-4">
                                <CardTitle className="text-sm font-semibold">Category</CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                {categories.length === 0 ? (
                                    <p className="text-muted-foreground text-xs">No categories available.</p>
                                ) : (
                                    <div className="relative" ref={catRef}>
                                        <button
                                            type="button"
                                            onClick={() => setCatOpen(!catOpen)}
                                            className="border-input bg-background flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm shadow-xs hover:bg-muted/50 focus:outline-none"
                                        >
                                            {selectedCat ? (
                                                <span className="flex items-center gap-2">
                                                    <span className="size-2.5 rounded-full" style={{ backgroundColor: selectedCat.color }} />
                                                    <span className="font-medium text-sm">{selectedCat.name}</span>
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">Select category</span>
                                            )}
                                            <ChevronDown className="size-3.5 text-muted-foreground" />
                                        </button>

                                        {catOpen && (
                                            <div className="absolute z-50 mt-1 w-full rounded-xl border bg-popover shadow-xl">
                                                <div className="flex items-center gap-2 border-b px-3 py-2">
                                                    <Search className="text-muted-foreground size-3.5" />
                                                    <input
                                                        value={catQuery}
                                                        onChange={(e) => setCatQuery(e.target.value)}
                                                        placeholder="Search…"
                                                        className="flex-1 bg-transparent text-sm outline-none"
                                                        autoFocus
                                                    />
                                                </div>
                                                <div className="max-h-48 overflow-y-auto p-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => { setData('category_id', ''); setCatOpen(false); setCatQuery(''); }}
                                                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
                                                    >
                                                        None
                                                    </button>
                                                    {filteredCats.map((c) => (
                                                        <button
                                                            key={c.id}
                                                            type="button"
                                                            onClick={() => { setData('category_id', String(c.id)); setCatOpen(false); setCatQuery(''); }}
                                                            className={cn(
                                                                'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted',
                                                                data.category_id === String(c.id) && 'bg-accent font-medium',
                                                            )}
                                                        >
                                                            <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                                                            {c.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Featured Image */}
                        <Card className="border shadow-none">
                            <CardHeader className="px-4 pb-2 pt-4">
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                    <ImageIcon className="size-4 text-muted-foreground" /> Featured Image
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 px-4 pb-4">
                                <Input
                                    value={data.featured_image}
                                    onChange={(e) => setData('featured_image', e.target.value)}
                                    placeholder="https://… or /storage/…"
                                    className="text-xs"
                                />
                                {data.featured_image && !imgError && (
                                    <div className="overflow-hidden rounded-lg border">
                                        <img
                                            src={data.featured_image}
                                            alt="Preview"
                                            className="h-36 w-full object-cover"
                                            onError={() => setImgError(true)}
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Quick flags */}
                        <Card className="border shadow-none">
                            <CardContent className="space-y-3 px-4 py-4">
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-2 text-sm"><Star className="size-3.5 text-yellow-500" /> Featured</span>
                                    <Switch checked={data.is_featured} onCheckedChange={(v) => setData('is_featured', v)} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-2 text-sm"><Globe className="size-3.5 text-muted-foreground" /> Show in menu</span>
                                    <Switch checked={data.show_in_menu} onCheckedChange={(v) => setData('show_in_menu', v)} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}
