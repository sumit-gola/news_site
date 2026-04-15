import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowUpDown,
    BookOpen,
    Calendar,
    CheckCircle2,
    ChevronDown,
    Clock3,
    Edit2,
    Eye,
    FileText,
    Filter,
    Globe2,
    MoreHorizontal,
    Plus,
    RefreshCw,
    RotateCcw,
    Search,
    Send,
    ThumbsDown,
    ThumbsUp,
    Trash2,
    TrendingUp,
    X,
    XCircle,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import type { Article, BreadcrumbItem, Category, Paginated, Tag, User } from '@/types';

type Filters = {
    search?: string;
    status?: string;
    author_id?: string;
    category_id?: string;
    tag_id?: string;
    from_date?: string;
    to_date?: string;
    sort?: string;
    per_page?: string;
};

type Props = {
    articles: Paginated<Article>;
    filters: Filters;
    statuses: string[];
    summary: Record<'total' | 'draft' | 'pending' | 'published' | 'rejected', number>;
    authors: Pick<User, 'id' | 'name'>[];
    categories: Pick<Category, 'id' | 'name'>[];
    tags: Tag[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Admin', href: '/admin/users' },
    { title: 'Articles', href: '/admin/articles' },
];

const STATUS_META = {
    draft:     { label: 'Draft',     dot: 'bg-slate-400',   badge: 'bg-slate-100 text-slate-600 ring-slate-200',      icon: FileText },
    pending:   { label: 'Pending',   dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 ring-amber-200',       icon: Clock3 },
    published: { label: 'Published', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200', icon: Globe2 },
    rejected:  { label: 'Rejected',  dot: 'bg-red-400',     badge: 'bg-red-50 text-red-600 ring-red-200',             icon: XCircle },
} as const;

const SORT_OPTIONS = [
    { value: 'updated_at_desc',   label: 'Latest Updated' },
    { value: 'updated_at_asc',    label: 'Oldest Updated' },
    { value: 'published_at_desc', label: 'Latest Published' },
    { value: 'views_desc',        label: 'Most Viewed' },
    { value: 'title_asc',         label: 'Title A–Z' },
];

function fmtDate(d: string | null | undefined) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AdminArticleIndex({
    articles, filters, statuses, summary, authors, categories, tags,
}: Props) {
    const [search, setSearch]           = useState(filters.search ?? '');
    const [showFilters, setShowFilters] = useState(
        !!(filters.author_id || filters.category_id || filters.tag_id || filters.from_date || filters.to_date)
    );
    const [selected, setSelected]       = useState<number[]>([]);
    const searchRef                     = useRef<HTMLInputElement>(null);

    const go = (next: Partial<Filters>) =>
        router.get('/admin/articles', { ...filters, ...next }, { preserveState: true, preserveScroll: true, replace: true });

    const reset = () => { setSearch(''); router.get('/admin/articles', {}, { preserveState: true, preserveScroll: true, replace: true }); };

    const activeFilterCount = [filters.author_id, filters.category_id, filters.tag_id, filters.from_date, filters.to_date].filter(Boolean).length;
    const hasFilters = !!(filters.search || filters.status || activeFilterCount);

    const toggleSelect = (id: number) =>
        setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
    const toggleAll = () =>
        setSelected((s) => s.length === articles.data.length ? [] : articles.data.map((a) => a.id));

    const publish = (id: number) => router.post(`/admin/articles/${id}/publish`, {}, { preserveScroll: true });
    const approve = (id: number) => router.post(`/articles/${id}/approve`,       {}, { preserveScroll: true });
    const reject  = (id: number) => router.post(`/articles/${id}/reject`,        {}, { preserveScroll: true });
    const remove  = (id: number) => {
        if (!window.confirm('Delete this article permanently?')) return;
        router.delete(`/articles/${id}`, { preserveScroll: true });
    };

    const bulkDelete = () => {
        if (!window.confirm(`Delete ${selected.length} article(s) permanently?`)) return;
        router.post('/admin/articles/bulk-delete', { ids: selected }, {
            preserveScroll: true,
            onSuccess: () => setSelected([]),
        });
    };
    const bulkPublish = () => {
        router.post('/admin/articles/bulk-publish', { ids: selected }, {
            preserveScroll: true,
            onSuccess: () => setSelected([]),
        });
    };

    const publishedPct = summary.total > 0 ? Math.round((summary.published / summary.total) * 100) : 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Article Management" />

            <div className="flex flex-col gap-4 p-4 md:p-6">

                {/* ─── TOP BAR ─────────────────────────────────────────────── */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Article Management</h1>
                        <p className="text-muted-foreground mt-0.5 text-xs">
                            {summary.total.toLocaleString()} total · {publishedPct}% published
                        </p>
                    </div>
                    <Button asChild size="sm" className="h-8 gap-1.5 text-xs">
                        <Link href="/articles/create">
                            <Plus className="size-3.5" /> New Article
                        </Link>
                    </Button>
                </div>

                {/* ─── STAT PILLS ──────────────────────────────────────────── */}
                <div className="flex flex-wrap gap-2">
                    <StatPill
                        active={!filters.status}
                        onClick={() => go({ status: undefined })}
                        icon={<TrendingUp className="size-3.5 text-primary" />}
                        iconBg="bg-primary/10"
                        label="Total"
                        count={summary.total}
                    />
                    {(['draft', 'pending', 'published', 'rejected'] as const).map((s) => {
                        const m   = STATUS_META[s];
                        const Ico = m.icon;
                        const pct = summary.total > 0 ? Math.round((summary[s] / summary.total) * 100) : 0;
                        return (
                            <StatPill
                                key={s}
                                active={filters.status === s}
                                onClick={() => go({ status: filters.status === s ? undefined : s })}
                                icon={<Ico className="size-3.5" />}
                                iconBg={m.badge + ' ring-1'}
                                label={m.label}
                                count={summary[s]}
                                pct={pct}
                            />
                        );
                    })}
                </div>

                {/* ─── TOOLBAR ─────────────────────────────────────────────── */}
                <div className="rounded-lg border bg-card shadow-sm">
                    <div className="flex flex-wrap items-center gap-2 p-3">
                        {/* Search */}
                        <div className="relative min-w-[200px] flex-1">
                            <Search className="text-muted-foreground absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2" />
                            <input
                                ref={searchRef}
                                value={search}
                                className="border-input bg-background h-8 w-full rounded-md border pl-8 pr-8 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                                placeholder="Search title or excerpt…"
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') go({ search: search || undefined });
                                    if (e.key === 'Escape') { setSearch(''); go({ search: undefined }); }
                                }}
                            />
                            {search && (
                                <button className="text-muted-foreground hover:text-foreground absolute right-2.5 top-1/2 -translate-y-1/2" onClick={() => { setSearch(''); go({ search: undefined }); }}>
                                    <X className="size-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Status tabs */}
                        <div className="flex items-center gap-1 rounded-md border bg-muted/40 p-0.5">
                            {[{ value: '', label: 'All' }, ...statuses.map((s) => ({ value: s, label: STATUS_META[s as keyof typeof STATUS_META]?.label ?? s }))].map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => go({ status: opt.value || undefined })}
                                    className={[
                                        'h-7 rounded px-2.5 text-xs font-medium transition-all',
                                        (filters.status ?? '') === opt.value
                                            ? 'bg-background shadow text-foreground'
                                            : 'text-muted-foreground hover:text-foreground',
                                    ].join(' ')}
                                >
                                    {opt.value && (
                                        <span className={`mr-1 inline-block size-1.5 rounded-full ${STATUS_META[opt.value as keyof typeof STATUS_META]?.dot}`} />
                                    )}
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        <div className="hidden h-6 w-px bg-border sm:block" />

                        {/* Sort */}
                        <div className="flex items-center gap-1">
                            <ArrowUpDown className="text-muted-foreground size-3.5" />
                            <select
                                className="border-input bg-background h-8 rounded-md border px-2 text-xs"
                                value={filters.sort ?? 'updated_at_desc'}
                                onChange={(e) => go({ sort: e.target.value })}
                            >
                                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>

                        {/* Per page */}
                        <select
                            className="border-input bg-background h-8 rounded-md border px-2 text-xs"
                            value={filters.per_page ?? '20'}
                            onChange={(e) => go({ per_page: e.target.value })}
                        >
                            {['10', '20', '50', '100'].map((n) => <option key={n} value={n}>{n}/pg</option>)}
                        </select>

                        {/* Filter toggle */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={[
                                'flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors',
                                showFilters ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-primary/40',
                            ].join(' ')}
                        >
                            <Filter className="size-3.5" />
                            Filters
                            {activeFilterCount > 0 && (
                                <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                    {activeFilterCount}
                                </span>
                            )}
                            <ChevronDown className={`size-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                        </button>

                        {hasFilters && (
                            <button onClick={reset} className="flex h-8 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground hover:text-red-500 transition-colors">
                                <RotateCcw className="size-3.5" /> Reset
                            </button>
                        )}
                    </div>

                    {/* Expanded filters */}
                    {showFilters && (
                        <div className="grid gap-2 border-t px-3 py-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                            <FilterSelect label="Author"   value={filters.author_id ?? ''}   onChange={(v) => go({ author_id: v || undefined })}   options={authors.map((a) => ({ value: String(a.id), label: a.name }))}     placeholder="All authors" />
                            <FilterSelect label="Category" value={filters.category_id ?? ''} onChange={(v) => go({ category_id: v || undefined })} options={categories.map((c) => ({ value: String(c.id), label: c.name }))} placeholder="All categories" />
                            <FilterSelect label="Tag"      value={filters.tag_id ?? ''}      onChange={(v) => go({ tag_id: v || undefined })}      options={tags.map((t) => ({ value: String(t.id), label: t.name }))}       placeholder="All tags" />
                            <div>
                                <p className="mb-1 text-[11px] font-medium text-muted-foreground">From</p>
                                <input type="date" className="border-input bg-background h-8 w-full rounded-md border px-2 text-xs" value={filters.from_date ?? ''} onChange={(e) => go({ from_date: e.target.value || undefined })} />
                            </div>
                            <div>
                                <p className="mb-1 text-[11px] font-medium text-muted-foreground">To</p>
                                <input type="date" className="border-input bg-background h-8 w-full rounded-md border px-2 text-xs" value={filters.to_date ?? ''} onChange={(e) => go({ to_date: e.target.value || undefined })} />
                            </div>
                        </div>
                    )}

                    {/* Active filter chips */}
                    {hasFilters && (
                        <div className="flex flex-wrap gap-1.5 border-t px-3 py-2">
                            {filters.search    && <Chip label={`"${filters.search}"`} icon={<Search className="size-2.5" />} onRemove={() => { setSearch(''); go({ search: undefined }); }} />}
                            {filters.status    && <Chip label={STATUS_META[filters.status as keyof typeof STATUS_META]?.label ?? filters.status} icon={<span className={`size-1.5 rounded-full ${STATUS_META[filters.status as keyof typeof STATUS_META]?.dot}`} />} onRemove={() => go({ status: undefined })} />}
                            {filters.author_id    && <Chip label={authors.find((a) => String(a.id) === filters.author_id)?.name ?? 'Author'}   onRemove={() => go({ author_id: undefined })} />}
                            {filters.category_id  && <Chip label={categories.find((c) => String(c.id) === filters.category_id)?.name ?? 'Category'} onRemove={() => go({ category_id: undefined })} />}
                            {filters.tag_id       && <Chip label={tags.find((t) => String(t.id) === filters.tag_id)?.name ?? 'Tag'}            onRemove={() => go({ tag_id: undefined })} />}
                            {filters.from_date && <Chip label={`From ${filters.from_date}`} icon={<Calendar className="size-2.5" />} onRemove={() => go({ from_date: undefined })} />}
                            {filters.to_date   && <Chip label={`To ${filters.to_date}`}   icon={<Calendar className="size-2.5" />} onRemove={() => go({ to_date: undefined })} />}
                        </div>
                    )}
                </div>

                {/* ─── TABLE ───────────────────────────────────────────────── */}
                <div className="rounded-lg border bg-card shadow-sm">
                    {/* Header row */}
                    <div className="flex items-center justify-between border-b px-4 py-2.5">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">
                                {hasFilters ? 'Filtered' : 'All'} Articles
                            </span>
                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                {articles.from ?? 0}–{articles.to ?? 0} / {articles.total.toLocaleString()}
                            </span>
                            {selected.length > 0 && (
                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                    {selected.length} selected
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Bulk actions */}
                            {selected.length > 0 && (
                                <div className="flex items-center gap-1.5 rounded-md border bg-muted/30 px-2 py-1">
                                    <span className="text-[11px] text-muted-foreground">{selected.length} selected:</span>
                                    <button
                                        onClick={bulkPublish}
                                        className="flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium text-emerald-600 hover:bg-emerald-50 transition-colors"
                                    >
                                        <Globe2 className="size-3" /> Publish
                                    </button>
                                    <button
                                        onClick={bulkDelete}
                                        className="flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium text-red-500 hover:bg-red-50 transition-colors"
                                    >
                                        <Trash2 className="size-3" /> Delete
                                    </button>
                                    <button
                                        onClick={() => setSelected([])}
                                        className="text-muted-foreground hover:text-foreground ml-0.5 transition-colors"
                                    >
                                        <X className="size-3" />
                                    </button>
                                </div>
                            )}
                            <button
                                onClick={() => router.reload({ only: ['articles'] })}
                                className="text-muted-foreground hover:text-foreground rounded p-1 transition-colors"
                                title="Refresh"
                            >
                                <RefreshCw className="size-3.5" />
                            </button>
                        </div>
                    </div>

                    {articles.data.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 py-16 text-center">
                            <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
                                <FileText className="text-muted-foreground size-5" />
                            </div>
                            <div>
                                <p className="font-semibold">No articles found</p>
                                <p className="text-muted-foreground mt-0.5 text-sm">Try adjusting your filters</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={reset}>Clear filters</Button>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[900px] text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/20 text-left">
                                            <th className="w-8 px-3 py-2.5">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-input"
                                                    checked={selected.length === articles.data.length && articles.data.length > 0}
                                                    onChange={toggleAll}
                                                />
                                            </th>
                                            <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Article</th>
                                            <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Author</th>
                                            <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Category</th>
                                            <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                                            <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Stats</th>
                                            <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                                            <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {articles.data.map((article) => (
                                            <ArticleRow
                                                key={article.id}
                                                article={article}
                                                selected={selected.includes(article.id)}
                                                onToggle={() => toggleSelect(article.id)}
                                                onPublish={() => publish(article.id)}
                                                onApprove={() => approve(article.id)}
                                                onReject={() => reject(article.id)}
                                                onDelete={() => remove(article.id)}
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-2.5">
                                <span className="text-xs text-muted-foreground">
                                    Page {articles.current_page} of {articles.last_page}
                                    &nbsp;·&nbsp;{articles.total.toLocaleString()} articles
                                </span>
                                <div className="flex flex-wrap gap-1">
                                    {articles.links.map((link, i) => (
                                        <Link
                                            key={i}
                                            href={link.url ?? '#'}
                                            className={[
                                                'inline-flex min-w-[28px] items-center justify-center rounded px-2 py-1 text-xs transition-colors',
                                                link.active ? 'bg-primary text-primary-foreground font-semibold' : 'border hover:bg-muted',
                                                !link.url ? 'pointer-events-none opacity-40' : '',
                                            ].join(' ')}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

// ─── ArticleRow ───────────────────────────────────────────────────────────────

function ArticleRow({
    article, selected, onToggle, onPublish, onApprove, onReject, onDelete,
}: {
    article: Article;
    selected: boolean;
    onToggle: () => void;
    onPublish: () => void;
    onApprove: () => void;
    onReject: () => void;
    onDelete: () => void;
}) {
    const s = STATUS_META[article.status as keyof typeof STATUS_META] ?? STATUS_META.draft;
    const readTime = (article as any).meta?.read_time;
    const wordCount = (article as any).meta?.word_count;

    const dateLabel = article.status === 'published' && article.published_at
        ? fmtDate(article.published_at)
        : fmtDate(article.updated_at);

    const datePrefix = article.status === 'published' && article.published_at ? 'Published' : 'Updated';

    return (
        <tr className={`group transition-colors hover:bg-muted/30 ${selected ? 'bg-primary/5' : ''}`}>
            {/* Checkbox */}
            <td className="w-8 px-3 py-3">
                <input type="checkbox" className="rounded border-input" checked={selected} onChange={onToggle} />
            </td>

            {/* Article */}
            <td className="px-3 py-3 max-w-[340px]">
                <div className="flex items-start gap-3">
                    {/* Thumbnail */}
                    {article.thumbnail_url || article.featured_image_url ? (
                        <img
                            src={article.thumbnail_url ?? article.featured_image_url ?? ''}
                            alt=""
                            className="size-12 flex-shrink-0 rounded-md object-cover ring-1 ring-border"
                        />
                    ) : (
                        <div className="flex size-12 flex-shrink-0 items-center justify-center rounded-md bg-muted ring-1 ring-border">
                            <FileText className="size-4.5 text-muted-foreground" />
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        {/* Title */}
                        <Link
                            href={`/articles/${article.id}/edit`}
                            className="line-clamp-2 text-sm font-semibold leading-snug hover:text-primary hover:underline"
                        >
                            {article.title}
                        </Link>
                        {/* Excerpt */}
                        {article.excerpt && (
                            <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
                                {article.excerpt}
                            </p>
                        )}
                        {/* Slug + meta */}
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                            <span className="truncate max-w-[160px]">/{article.slug}</span>
                            {readTime && (
                                <span className="flex items-center gap-0.5">
                                    <BookOpen className="size-2.5" /> {readTime} min
                                </span>
                            )}
                            {wordCount && (
                                <span>{wordCount.toLocaleString()} words</span>
                            )}
                        </div>
                    </div>
                </div>
            </td>

            {/* Author */}
            <td className="px-3 py-3">
                <div className="flex items-center gap-1.5">
                    <div className="flex size-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary ring-1 ring-primary/20">
                        {article.author?.name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="min-w-0">
                        <p className="max-w-[90px] truncate text-xs font-medium">{article.author?.name ?? '—'}</p>
                    </div>
                </div>
            </td>

            {/* Category */}
            <td className="px-3 py-3">
                {article.categories?.length ? (
                    <div className="flex flex-col gap-1">
                        {article.categories.slice(0, 2).map((c) => (
                            <span key={c.id} className="inline-flex w-fit items-center rounded-md bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-secondary-foreground">
                                {c.name}
                            </span>
                        ))}
                        {article.categories.length > 2 && (
                            <span className="text-[10px] text-muted-foreground">+{article.categories.length - 2} more</span>
                        )}
                    </div>
                ) : (
                    <span className="text-[11px] text-muted-foreground">—</span>
                )}
            </td>

            {/* Status */}
            <td className="px-3 py-3">
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${s.badge}`}>
                    <span className={`size-1.5 rounded-full ${s.dot}`} />
                    {s.label}
                </span>
                {article.status === 'pending' && (
                    <p className="mt-1 flex items-center gap-0.5 text-[10px] text-amber-600">
                        <AlertCircle className="size-2.5" /> Awaiting review
                    </p>
                )}
                {article.status === 'rejected' && (
                    <p className="mt-1 flex items-center gap-0.5 text-[10px] text-red-500">
                        <XCircle className="size-2.5" /> Needs revision
                    </p>
                )}
            </td>

            {/* Stats */}
            <td className="px-3 py-3">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1 text-xs font-medium">
                        <Eye className="size-3 text-muted-foreground" />
                        {(article.views ?? 0).toLocaleString()}
                    </div>
                    {readTime && (
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Clock3 className="size-3" />
                            {readTime} min read
                        </div>
                    )}
                </div>
            </td>

            {/* Date */}
            <td className="px-3 py-3">
                <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{datePrefix}</span>
                    <span className="text-xs font-medium whitespace-nowrap">{dateLabel}</span>
                    {article.status === 'published' && article.updated_at !== article.published_at && (
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            Edited {fmtDate(article.updated_at)}
                        </span>
                    )}
                </div>
            </td>

            {/* Actions */}
            <td className="px-3 py-3 text-right">
                <div className="flex items-center justify-end gap-1">

                    {/* Pending quick actions — always visible */}
                    {article.status === 'pending' && article.permissions?.approve && (
                        <button
                            onClick={onApprove}
                            title="Approve article"
                            className="flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
                        >
                            <ThumbsUp className="size-3" /> Approve
                        </button>
                    )}
                    {article.status === 'pending' && article.permissions?.reject && (
                        <button
                            onClick={onReject}
                            title="Reject article"
                            className="flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700 transition-colors hover:bg-amber-100"
                        >
                            <ThumbsDown className="size-3" /> Reject
                        </button>
                    )}

                    {/* Publish quick action for non-published */}
                    {article.status !== 'published' && article.status !== 'pending' && article.permissions?.publish && (
                        <button
                            onClick={onPublish}
                            title="Publish article"
                            className="flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-700 transition-colors hover:bg-blue-100"
                        >
                            <Send className="size-3" /> Publish
                        </button>
                    )}

                    {/* Edit */}
                    <Link
                        href={`/articles/${article.id}/edit`}
                        className="flex size-7 items-center justify-center rounded-md border border-transparent text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground"
                        title="Edit article"
                    >
                        <Edit2 className="size-3.5" />
                    </Link>

                    {/* More dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex size-7 items-center justify-center rounded-md border border-transparent transition-colors hover:border-border hover:bg-muted">
                                <MoreHorizontal className="size-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem asChild>
                                <Link href={`/articles/${article.id}`} className="flex items-center gap-2 text-xs">
                                    <Eye className="size-3.5" /> View on Site
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href={`/articles/${article.id}/edit`} className="flex items-center gap-2 text-xs">
                                    <Edit2 className="size-3.5" /> Edit Article
                                </Link>
                            </DropdownMenuItem>

                            {article.permissions?.publish && article.status !== 'published' && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={onPublish} className="flex items-center gap-2 text-xs text-blue-600 focus:text-blue-600">
                                        <Globe2 className="size-3.5" /> Publish Now
                                    </DropdownMenuItem>
                                </>
                            )}
                            {article.permissions?.approve && article.status === 'pending' && (
                                <DropdownMenuItem onClick={onApprove} className="flex items-center gap-2 text-xs text-emerald-600 focus:text-emerald-600">
                                    <CheckCircle2 className="size-3.5" /> Approve
                                </DropdownMenuItem>
                            )}
                            {article.permissions?.reject && article.status === 'pending' && (
                                <DropdownMenuItem onClick={onReject} className="flex items-center gap-2 text-xs text-amber-600 focus:text-amber-600">
                                    <XCircle className="size-3.5" /> Reject
                                </DropdownMenuItem>
                            )}

                            {article.permissions?.delete && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={onDelete} className="flex items-center gap-2 text-xs text-red-500 focus:text-red-500">
                                        <Trash2 className="size-3.5" /> Delete Article
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </td>
        </tr>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatPill({
    active, onClick, icon, iconBg, label, count, pct,
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    iconBg: string;
    label: string;
    count: number;
    pct?: number;
}) {
    return (
        <button
            onClick={onClick}
            className={[
                'group flex items-center gap-2.5 rounded-lg border px-3.5 py-2 text-left transition-all',
                active ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/40 hover:bg-muted/50',
            ].join(' ')}
        >
            <div className={`flex size-8 items-center justify-center rounded-md ${iconBg}`}>
                {icon}
            </div>
            <div>
                <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
                <p className="text-lg font-bold leading-none">{count.toLocaleString()}</p>
            </div>
            {pct !== undefined && (
                <span className="ml-1 hidden rounded bg-muted px-1 py-0.5 text-[10px] text-muted-foreground sm:inline">
                    {pct}%
                </span>
            )}
        </button>
    );
}

function FilterSelect({
    label, value, onChange, options, placeholder,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
    placeholder: string;
}) {
    return (
        <div>
            <p className="mb-1 text-[11px] font-medium text-muted-foreground">{label}</p>
            <select
                className="border-input bg-background h-8 w-full rounded-md border px-2 text-xs"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            >
                <option value="">{placeholder}</option>
                {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
        </div>
    );
}

function Chip({ label, icon, onRemove }: { label: string; icon?: React.ReactNode; onRemove: () => void }) {
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground ring-1 ring-border">
            {icon}
            {label}
            <button onClick={onRemove} className="ml-0.5 hover:text-foreground transition-colors">
                <X className="size-2.5" />
            </button>
        </span>
    );
}
