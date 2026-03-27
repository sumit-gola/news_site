import { Head, Link, useForm } from '@inertiajs/react';
import * as React from 'react';
import {
    Calendar,
    Check,
    ChevronDown,
    ChevronRight,
    Clock,
    Globe,
    Hash,
    Image as ImageIcon,
    Layers,
    Link2,
    RefreshCw,
    Send,
    Tag,
    Upload,
    X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/rich-text-editor';
import AppLayout from '@/layouts/app-layout';
import type { Article, BreadcrumbItem, Category, Tag as TagType } from '@/types';

type Props = {
    article: Article;
    categories: Category[];
    tags: TagType[];
    languages: Record<string, string>;
};

type ArticleFormData = {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    language: string;
    thumbnail: File | null;
    featured_image: File | string;
    use_thumbnail_as_featured: boolean;
    published_at: string;
    category_ids: string[];
    tag_names: string[];
    meta_title: string;
    meta_description: string;
    meta_keywords: string;
    og_image: string;
    canonical_url: string;
};

// ─── Hinglish slug transliteration ───────────────────────────────────────────
const DEVANAGARI_MAP: Record<string, string> = {
    'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo',
    'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au', 'ऋ': 'ri', 'ॠ': 'ri',
    'ा': 'a', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo',
    'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', 'ृ': 'ri',
    'ं': 'n', 'ः': 'h', '्': '', 'ँ': 'n', 'ॅ': 'e',
    'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'n',
    'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'n',
    'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
    'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
    'प': 'p', 'फ': 'f', 'ब': 'b', 'भ': 'bh', 'म': 'm',
    'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v', 'श': 'sh',
    'ष': 'sh', 'स': 's', 'ह': 'h', 'ळ': 'l',
    'क्ष': 'ksh', 'त्र': 'tr', 'ज्ञ': 'gya',
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
};

const isDevanagari = (t: string) => /[\u0900-\u097F]/.test(t);

const transliterate = (text: string): string => {
    let result = '';
    let i = 0;
    while (i < text.length) {
        if (i + 2 < text.length && DEVANAGARI_MAP[text.slice(i, i + 3)] !== undefined) {
            result += DEVANAGARI_MAP[text.slice(i, i + 3)]; i += 3;
        } else if (DEVANAGARI_MAP[text[i]] !== undefined) {
            result += DEVANAGARI_MAP[text[i]]; i++;
        } else { result += text[i]; i++; }
    }
    return result;
};

const slugify = (v: string) => {
    const p = isDevanagari(v) ? transliterate(v) : v;
    return p.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
};

const toInputDateTime = (value: string | null): string => {
    if (!value) return '';
    const d = new Date(value);
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

// ─── Status helpers ───────────────────────────────────────────────────────────
const STATUS_STYLE: Record<string, string> = {
    draft:     'bg-muted text-muted-foreground',
    pending:   'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    published: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    rejected:  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function EditArticle({ article, categories, tags, languages = { en: 'English', hi: 'हिंदी' } }: Props) {
    const { data, setData, put, processing, errors } = useForm<ArticleFormData>({
        title:                    article.title,
        slug:                     article.slug,
        excerpt:                  article.excerpt ?? '',
        content:                  article.content,
        language:                 article.language ?? 'en',
        thumbnail:                null,
        featured_image:           article.featured_image_url ?? article.featured_image ?? '',
        use_thumbnail_as_featured: false,
        published_at:             toInputDateTime(article.published_at),
        category_ids:             article.categories?.map((c) => String(c.id)) ?? [],
        tag_names:                article.tags?.map((t) => t.name) ?? [],
        meta_title:               article.meta?.meta_title ?? '',
        meta_description:         article.meta?.meta_description ?? '',
        meta_keywords:            article.meta?.meta_keywords ?? '',
        og_image:                 article.meta?.og_image ?? '',
        canonical_url:            article.meta?.canonical_url ?? '',
    });

    const [tagInput, setTagInput]           = React.useState('');
    const [dirtySlug, setDirtySlug]         = React.useState(false);
    const [isCategoryOpen, setCategoryOpen] = React.useState(false);
    const [seoOpen, setSeoOpen]             = React.useState(false);

    // Image previews — initialise from existing article images
    const [thumbnailPreview, setThumbnailPreview] = React.useState<string | undefined>(
        article.thumbnail_url ?? undefined,
    );
    const [featuredPreview, setFeaturedPreview] = React.useState<string | undefined>(
        article.featured_image_url ?? article.featured_image ?? undefined,
    );
    const thumbnailInputRef = React.useRef<HTMLInputElement>(null);
    const featuredInputRef  = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (!dirtySlug) setData('slug', slugify(data.title));
    }, [data.title]);

    // ── image handlers ──────────────────────────────────────────────────────
    const handleThumbnailFile = (file: File | null) => {
        if (!file) return;
        const url = URL.createObjectURL(file);
        setThumbnailPreview(url);
        setData('thumbnail', file);
        if (data.use_thumbnail_as_featured) setFeaturedPreview(url);
    };

    const handleFeaturedFile = (file: File | null) => {
        if (!file) return;
        setFeaturedPreview(URL.createObjectURL(file));
        setData('featured_image', file);
    };

    const clearThumbnail = () => {
        if (thumbnailPreview?.startsWith('blob:')) URL.revokeObjectURL(thumbnailPreview);
        setThumbnailPreview(undefined);
        setData('thumbnail', null);
        if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
    };

    const clearFeaturedImage = () => {
        if (featuredPreview?.startsWith('blob:')) URL.revokeObjectURL(featuredPreview);
        setFeaturedPreview(undefined);
        setData('featured_image', '');
        if (featuredInputRef.current) featuredInputRef.current.value = '';
    };

    // ── categories ──────────────────────────────────────────────────────────
    const allFlatCategories = React.useMemo(() => {
        const flat: Category[] = [];
        const walk = (cats: Category[]) => cats.forEach((c) => { flat.push(c); if (c.children?.length) walk(c.children); });
        walk(categories);
        return flat;
    }, [categories]);

    const selectedCategoryNames = React.useMemo(() => {
        const s = new Set(data.category_ids);
        return allFlatCategories.filter((c) => s.has(String(c.id))).map((c) => c.name);
    }, [allFlatCategories, data.category_ids]);

    const toggleCategory = (id: string) =>
        setData('category_ids', data.category_ids.includes(id)
            ? data.category_ids.filter((v) => v !== id)
            : [...data.category_ids, id]);

    // ── tags ────────────────────────────────────────────────────────────────
    const addTag = () => {
        const v = tagInput.trim();
        if (!v || data.tag_names.includes(v)) return;
        setData('tag_names', [...data.tag_names, v]);
        setTagInput('');
    };

    const submit = (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); put(`/articles/${article.id}`); };

    const excerptLen = data.excerpt.length;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/reporter/dashboard' },
        { title: 'Articles',  href: '/articles' },
        { title: article.title.slice(0, 30) + (article.title.length > 30 ? '…' : ''), href: `/articles/${article.id}/edit` },
    ];

    // ── reusable image slot ─────────────────────────────────────────────────
    const ImageSlot = ({
        label, preview, inputRef, onFile, onClear, urlValue, onUrl,
    }: {
        label: string;
        preview?: string;
        inputRef: React.RefObject<HTMLInputElement>;
        onFile: (f: File | null) => void;
        onClear: () => void;
        urlValue?: string;
        onUrl?: (v: string) => void;
    }) => (
        <div className="space-y-1">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            {preview ? (
                <div className="relative overflow-hidden rounded border">
                    <img src={preview} alt={label} className="aspect-video w-full object-cover" />
                    <button type="button" onClick={onClear}
                        className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80">
                        <X className="size-2.5" />
                    </button>
                </div>
            ) : (
                <>
                    <button type="button"
                        onClick={() => inputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files[0] ?? null); }}
                        className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded border border-dashed bg-muted/30 py-3 text-[10px] text-muted-foreground/60 transition hover:bg-muted/50">
                        <Upload className="size-3" />
                        Drop or click to upload
                    </button>
                    {onUrl !== undefined && (
                        <Input value={urlValue ?? ''} onChange={(e) => onUrl(e.target.value)}
                            placeholder="or paste URL…" className="h-7 text-xs" />
                    )}
                </>
            )}
            <input ref={inputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
        </div>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit: ${article.title}`} />

            <form onSubmit={submit}>
                {/* ── Sticky top bar ── */}
                <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-background/95 px-4 py-2 backdrop-blur">
                    <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${STATUS_STYLE[article.status]}`}>
                            {article.status}
                        </span>
                        <span className="text-muted-foreground max-w-[260px] truncate text-xs">
                            {data.title || 'Untitled'}
                        </span>
                        {article.views > 0 && (
                            <span className="text-muted-foreground/60 text-[10px]">{article.views.toLocaleString()} views</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                            <Link href="/articles">Cancel</Link>
                        </Button>
                        <Button size="sm" type="submit" disabled={processing} className="h-7 gap-1.5 text-xs">
                            <Send className="size-3" />
                            Save Changes
                        </Button>
                    </div>
                </div>

                {/* ── Two-column layout ── */}
                <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-4 p-4 xl:grid-cols-[1fr_300px]">

                    {/* ════ LEFT ════ */}
                    <div className="space-y-3">

                        {/* Title + Slug */}
                        <div className="space-y-2">
                            <textarea
                                value={data.title}
                                onChange={(e) => setData('title', e.target.value)}
                                placeholder="Article title…"
                                rows={2}
                                className="w-full resize-none border-0 bg-transparent p-0 text-3xl font-bold leading-tight tracking-tight placeholder:text-muted-foreground/40 focus:outline-none"
                            />
                            {errors.title && <p className="text-destructive text-xs">{errors.title}</p>}

                            <div className="flex items-center gap-1.5 rounded border bg-muted/30 px-2.5 py-1.5">
                                <Link2 className="text-muted-foreground size-3 shrink-0" />
                                <span className="text-muted-foreground text-[11px]">/news/</span>
                                <input
                                    value={data.slug}
                                    onChange={(e) => { setDirtySlug(true); setData('slug', e.target.value); }}
                                    placeholder="article-slug"
                                    className="min-w-0 flex-1 bg-transparent text-[11px] font-mono focus:outline-none"
                                />
                                {dirtySlug && (
                                    <button type="button" title="Reset"
                                        onClick={() => { setDirtySlug(false); setData('slug', slugify(data.title)); }}
                                        className="text-muted-foreground hover:text-foreground">
                                        <RefreshCw className="size-2.5" />
                                    </button>
                                )}
                                {errors.slug && <span className="text-destructive text-[11px]">{errors.slug}</span>}
                            </div>
                        </div>

                        {/* Excerpt */}
                        <Card>
                            <CardContent className="pb-3 pt-3">
                                <Textarea
                                    value={data.excerpt}
                                    onChange={(e) => setData('excerpt', e.target.value)}
                                    placeholder="Brief summary shown in article cards and search results…"
                                    className="h-16 resize-none text-sm"
                                    maxLength={300}
                                />
                                <div className="mt-1 flex items-center justify-between">
                                    {errors.excerpt
                                        ? <p className="text-destructive text-[11px]">{errors.excerpt}</p>
                                        : <span className="text-[10px] text-muted-foreground">Excerpt / Summary</span>}
                                    <span className={`text-[11px] tabular-nums ${excerptLen > 280 ? 'text-orange-500' : 'text-muted-foreground'}`}>
                                        {excerptLen}/300
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Content */}
                        <Card>
                            <CardContent className="pb-3 pt-3">
                                <RichTextEditor
                                    value={data.content}
                                    onChange={(v) => setData('content', v)}
                                    placeholder="Write your story…"
                                />
                                {errors.content && <p className="text-destructive mt-1 text-xs">{errors.content}</p>}
                            </CardContent>
                        </Card>

                        {/* SEO — collapsible */}
                        <Card>
                            <button type="button" onClick={() => setSeoOpen((v) => !v)}
                                className="flex w-full items-center justify-between px-4 py-3 text-left">
                                <div className="flex items-center gap-2">
                                    <Globe className="text-muted-foreground size-3.5" />
                                    <span className="text-sm font-medium">SEO &amp; Open Graph</span>
                                    {(data.meta_title || data.meta_description) && (
                                        <Badge variant="outline" className="text-[10px]">Filled</Badge>
                                    )}
                                </div>
                                <ChevronDown className={`text-muted-foreground size-3.5 transition-transform ${seoOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {seoOpen && (
                                <>
                                    <Separator />
                                    <CardContent className="grid gap-2.5 pb-4 pt-3">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-medium text-muted-foreground">
                                                    Meta Title <span className="font-normal">({data.meta_title.length}/60)</span>
                                                </p>
                                                <Input value={data.meta_title} onChange={(e) => setData('meta_title', e.target.value)}
                                                    placeholder="Defaults to title" className="h-7 text-xs" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-medium text-muted-foreground">Meta Keywords</p>
                                                <Input value={data.meta_keywords} onChange={(e) => setData('meta_keywords', e.target.value)}
                                                    placeholder="keyword1, keyword2" className="h-7 text-xs" />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-medium text-muted-foreground">
                                                Meta Description <span className="font-normal">({data.meta_description.length}/160)</span>
                                            </p>
                                            <Textarea value={data.meta_description} onChange={(e) => setData('meta_description', e.target.value)}
                                                placeholder="Shown in Google search results…" className="h-14 resize-none text-xs" maxLength={160} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-medium text-muted-foreground">OG Image URL</p>
                                                <Input value={data.og_image} onChange={(e) => setData('og_image', e.target.value)}
                                                    placeholder="https://…" className="h-7 text-xs" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-medium text-muted-foreground">Canonical URL</p>
                                                <Input value={data.canonical_url} onChange={(e) => setData('canonical_url', e.target.value)}
                                                    placeholder="https://…" className="h-7 text-xs" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </>
                            )}
                        </Card>
                    </div>

                    {/* ════ RIGHT: Single panel ════ */}
                    <div>
                        <Card className="divide-y">

                            {/* Publish + Language */}
                            <div className="space-y-3 p-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="text-muted-foreground size-3.5" />
                                        <span className="text-xs font-medium">Publish</span>
                                    </div>
                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${STATUS_STYLE[article.status]}`}>
                                        {article.status}
                                    </span>
                                </div>

                                {/* Language */}
                                <div className="grid grid-cols-2 gap-1.5">
                                    {Object.entries(languages).map(([code, label]) => (
                                        <button key={code} type="button" onClick={() => setData('language', code)}
                                            className={`flex items-center justify-center gap-1 rounded border px-2 py-1.5 text-[11px] font-medium transition ${
                                                data.language === code
                                                    ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                                                    : 'border-border text-muted-foreground hover:bg-muted/50'
                                            }`}>
                                            <span>{code === 'en' ? '🇬🇧' : '🇮🇳'}</span>
                                            {label}
                                        </button>
                                    ))}
                                </div>

                                {/* Schedule */}
                                <div className="space-y-1">
                                    <p className="text-[10px] text-muted-foreground">Schedule (optional)</p>
                                    <Input type="datetime-local" value={data.published_at}
                                        onChange={(e) => setData('published_at', e.target.value)}
                                        className="h-7 text-xs" />
                                    {errors.published_at && <p className="text-destructive text-[11px]">{errors.published_at}</p>}
                                </div>

                                {/* Timestamps */}
                                {article.updated_at && (
                                    <p className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                                        <Clock className="size-2.5" />
                                        Updated {new Date(article.updated_at).toLocaleDateString()}
                                    </p>
                                )}

                                <Button type="submit" disabled={processing} className="w-full h-8 gap-1.5 text-xs">
                                    <Send className="size-3" />
                                    Save Changes
                                </Button>
                            </div>

                            {/* Images */}
                            <div className="space-y-2.5 p-3">
                                <div className="flex items-center gap-1.5">
                                    <ImageIcon className="text-muted-foreground size-3.5" />
                                    <span className="text-xs font-medium">Images</span>
                                </div>

                                <ImageSlot label="Thumbnail"
                                    preview={thumbnailPreview}
                                    inputRef={thumbnailInputRef}
                                    onFile={handleThumbnailFile}
                                    onClear={clearThumbnail}
                                />

                                <label className="flex cursor-pointer items-center gap-2">
                                    <input type="checkbox" checked={data.use_thumbnail_as_featured}
                                        onChange={(e) => {
                                            setData('use_thumbnail_as_featured', e.target.checked);
                                            if (e.target.checked && thumbnailPreview) setFeaturedPreview(thumbnailPreview);
                                        }}
                                        className="size-3 accent-red-600" />
                                    <span className="text-[11px] text-muted-foreground">Use as featured image</span>
                                </label>

                                {!data.use_thumbnail_as_featured && (
                                    <ImageSlot label="Featured Image"
                                        preview={featuredPreview}
                                        inputRef={featuredInputRef}
                                        onFile={handleFeaturedFile}
                                        onClear={clearFeaturedImage}
                                        urlValue={typeof data.featured_image === 'string' ? data.featured_image : ''}
                                        onUrl={(v) => { setData('featured_image', v); setFeaturedPreview(v || undefined); }}
                                    />
                                )}
                            </div>

                            {/* Categories */}
                            <div className="space-y-2 p-3">
                                <div className="flex items-center gap-1.5">
                                    <Layers className="text-muted-foreground size-3.5" />
                                    <span className="text-xs font-medium">Categories</span>
                                    {data.category_ids.length > 0 && (
                                        <Badge variant="secondary" className="ml-auto px-1.5 text-[10px]">
                                            {data.category_ids.length}
                                        </Badge>
                                    )}
                                </div>
                                <Popover open={isCategoryOpen} onOpenChange={setCategoryOpen}>
                                    <PopoverTrigger asChild>
                                        <Button type="button" variant="outline" role="combobox"
                                            className="h-7 w-full justify-between text-xs font-normal">
                                            <span className="truncate text-muted-foreground">
                                                {selectedCategoryNames.length > 0
                                                    ? selectedCategoryNames.slice(0, 2).join(', ') + (selectedCategoryNames.length > 2 ? ` +${selectedCategoryNames.length - 2}` : '')
                                                    : 'Select categories…'}
                                            </span>
                                            <ChevronDown className="ml-1 size-3 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[272px] p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Search…" className="text-xs" />
                                            <CommandList>
                                                <CommandEmpty className="py-3 text-xs">No categories found.</CommandEmpty>
                                                {categories.map((parent) => (
                                                    <CommandGroup key={parent.id} heading={parent.name}>
                                                        <CommandItem value={parent.name} onSelect={() => toggleCategory(String(parent.id))} className="cursor-pointer text-xs">
                                                            <span className={`mr-2 flex size-3.5 items-center justify-center rounded-sm border ${data.category_ids.includes(String(parent.id)) ? 'border-red-500 bg-red-500' : 'border-muted-foreground/40'}`}>
                                                                {data.category_ids.includes(String(parent.id)) && <Check className="size-2.5 text-white" />}
                                                            </span>
                                                            {parent.name}
                                                        </CommandItem>
                                                        {parent.children?.map((child) => (
                                                            <React.Fragment key={child.id}>
                                                                <CommandItem value={`${parent.name} ${child.name}`} onSelect={() => toggleCategory(String(child.id))} className="cursor-pointer text-xs">
                                                                    <span className={`mr-2 flex size-3.5 items-center justify-center rounded-sm border ${data.category_ids.includes(String(child.id)) ? 'border-red-500 bg-red-500' : 'border-muted-foreground/40'}`}>
                                                                        {data.category_ids.includes(String(child.id)) && <Check className="size-2.5 text-white" />}
                                                                    </span>
                                                                    <ChevronRight className="mr-1 size-3 shrink-0 text-muted-foreground/40" />
                                                                    {child.name}
                                                                </CommandItem>
                                                                {child.children?.map((gc) => (
                                                                    <CommandItem key={gc.id} value={`${parent.name} ${child.name} ${gc.name}`} onSelect={() => toggleCategory(String(gc.id))} className="cursor-pointer text-xs">
                                                                        <span className={`mr-2 flex size-3.5 items-center justify-center rounded-sm border ${data.category_ids.includes(String(gc.id)) ? 'border-red-500 bg-red-500' : 'border-muted-foreground/40'}`}>
                                                                            {data.category_ids.includes(String(gc.id)) && <Check className="size-2.5 text-white" />}
                                                                        </span>
                                                                        <span className="mr-1 text-[10px] text-muted-foreground/40">››</span>
                                                                        {gc.name}
                                                                    </CommandItem>
                                                                ))}
                                                            </React.Fragment>
                                                        ))}
                                                    </CommandGroup>
                                                ))}
                                            </CommandList>
                                        </Command>
                                        {data.category_ids.length > 0 && (
                                            <div className="flex items-center justify-between border-t px-3 py-1.5">
                                                <button type="button" className="text-xs text-muted-foreground hover:text-foreground"
                                                    onClick={() => setData('category_ids', [])}>Clear all</button>
                                                <button type="button" className="text-xs font-medium text-red-600 hover:text-red-700"
                                                    onClick={() => setCategoryOpen(false)}>Done</button>
                                            </div>
                                        )}
                                    </PopoverContent>
                                </Popover>
                                {selectedCategoryNames.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {selectedCategoryNames.map((name) => {
                                            const cat = allFlatCategories.find((c) => c.name === name);
                                            return (
                                                <Badge key={name} variant="secondary" className="gap-1 pr-1 text-[10px]">
                                                    {name}
                                                    <button type="button" onClick={() => cat && toggleCategory(String(cat.id))}
                                                        className="hover:text-destructive ml-0.5">
                                                        <X className="size-2.5" />
                                                    </button>
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Tags */}
                            <div className="space-y-2 p-3">
                                <div className="flex items-center gap-1.5">
                                    <Tag className="text-muted-foreground size-3.5" />
                                    <span className="text-xs font-medium">Tags</span>
                                </div>
                                {data.tag_names.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {data.tag_names.map((tag) => (
                                            <Badge key={tag} variant="outline" className="gap-1 pr-1 text-[10px]">
                                                <Hash className="size-2.5" />
                                                {tag}
                                                <button type="button"
                                                    onClick={() => setData('tag_names', data.tag_names.filter((t) => t !== tag))}
                                                    className="hover:text-destructive ml-0.5">
                                                    <X className="size-2.5" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                                <div className="flex gap-1">
                                    <Input list="tag-list-edit" value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') { e.preventDefault(); addTag(); }
                                            if (e.key === ',') { e.preventDefault(); addTag(); }
                                        }}
                                        placeholder="Add tag…" className="h-7 text-xs" />
                                    <Button type="button" size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={addTag}>Add</Button>
                                </div>
                                <datalist id="tag-list-edit">
                                    {tags.map((tag) => <option key={tag.id} value={tag.name} />)}
                                </datalist>
                                {errors.tag_names && <p className="text-destructive text-[11px]">{errors.tag_names}</p>}
                            </div>

                        </Card>
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}
