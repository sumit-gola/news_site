import { Head, Link, router } from '@inertiajs/react';
import { Search, Filter, X, Clock, Eye, TrendingUp, Flame, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import PublicLayout from '@/layouts/public-layout';
import type { Article, Category, Paginated, Tag } from '@/types';

type Filters = {
    q?: string; category?: string; tag?: string; author?: string;
    sort?: string; from_date?: string; to_date?: string;
};
type AuthorOption = { id: number; name: string; slug: string };
type Props = {
    articles: Paginated<Article>;
    filters: Filters;
    categories: Category[];
    tags: Tag[];
    authors: AuthorOption[];
};

/* ─── Helpers ───────────────────────────────────────── */
function fmt(date: string) {
    const d = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
    if (d === 0) return 'Today';
    if (d === 1) return 'Yesterday';
    if (d < 7) return `${d}d ago`;
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function fmtV(n: number) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return n.toLocaleString();
}

/* ─── Article row card ───────────────────────────────── */
function ArticleRow({ article }: { article: Article }) {
    const cat = article.categories?.[0];
    const readTime = article.meta?.read_time;
    const isNew = article.published_at
        ? (Date.now() - new Date(article.published_at).getTime()) < 86400000 * 2 : false;
    const initials = article.author?.name
        ? article.author.name.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase() : '?';

    return (
        <Link href={`/news/${article.slug}`}
            className="group relative flex overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition hover:border-gray-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
            <div className="absolute inset-y-0 left-0 w-0.5 rounded-l-xl bg-red-500 opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="my-3 ml-3 shrink-0">
                {article.featured_image_url ? (
                    <img src={article.featured_image_url} alt={article.title}
                        className="h-[90px] w-32 rounded-lg object-cover transition group-hover:brightness-95" />
                ) : (
                    <div className="flex h-[90px] w-32 items-center justify-center rounded-lg bg-gray-100 text-3xl font-black text-gray-300 dark:bg-gray-800 dark:text-gray-600">
                        {article.title[0]}
                    </div>
                )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-between gap-1 py-3 pl-3 pr-4">
                <div className="flex flex-wrap items-center gap-1.5">
                    {cat && (
                        <span className="inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
                            style={{ backgroundColor: cat.color ?? '#ef4444' }}>{cat.name}</span>
                    )}
                    {isNew && <span className="inline-flex rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">New</span>}
                    {article.views > 5000 && (
                        <span className="inline-flex items-center gap-0.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                            <TrendingUp className="size-2.5" /> Popular
                        </span>
                    )}
                </div>
                <h3 className="line-clamp-2 text-[14px] font-bold leading-snug text-gray-900 transition group-hover:text-red-600 dark:text-gray-100 dark:group-hover:text-red-400">
                    {article.title}
                </h3>
                {article.excerpt && (
                    <p className="line-clamp-1 text-[11px] text-gray-500">{article.excerpt}</p>
                )}
                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                    {article.author && (
                        <div className="flex items-center gap-1">
                            <span className="flex size-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">{initials}</span>
                            <span className="font-medium text-gray-600 dark:text-gray-300">{article.author.name}</span>
                        </div>
                    )}
                    {article.published_at && (
                        <><span className="text-gray-300">·</span>
                        <span className="flex items-center gap-0.5"><Clock className="size-2.5" />{fmt(article.published_at)}</span></>
                    )}
                    {readTime && (
                        <><span className="text-gray-300">·</span>
                        <span>{readTime}m read</span></>
                    )}
                    <span className="ml-auto flex items-center gap-0.5 font-semibold">
                        <Eye className="size-2.5" />{fmtV(article.views)}
                    </span>
                </div>
            </div>
        </Link>
    );
}

/* ─── Skeleton ───────────────────────────────────────── */
function Skeleton() {
    return (
        <div className="flex animate-pulse overflow-hidden rounded-xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900">
            <div className="my-3 ml-3 h-[90px] w-32 shrink-0 rounded-lg bg-gray-200 dark:bg-gray-700" />
            <div className="flex-1 space-y-2 p-3">
                <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-4 w-4/5 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
        </div>
    );
}

/* ─── Trending sidebar ───────────────────────────────── */
function TrendingSidebar({ categories }: { categories: Category[] }) {
    if (!categories.length) return null;
    return (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                <Flame className="size-4 text-red-600" />
                <h2 className="text-sm font-black uppercase tracking-wider">Browse Categories</h2>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {categories.map((cat) => (
                    <Link key={cat.id} href={`/category/${cat.slug}`}
                        className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-gray-50 dark:hover:bg-gray-800/60">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-black text-white"
                            style={{ backgroundColor: cat.color ?? '#6366f1' }}>
                            {cat.icon ?? cat.name[0]}
                        </span>
                        <span className="flex-1 text-[12px] font-semibold">{cat.name}</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}

/* ─── Pagination ─────────────────────────────────────── */
function Pagination({ data }: { data: Paginated<Article> }) {
    if (data.last_page <= 1) return null;
    return (
        <div className="mt-6 flex items-center justify-center gap-1.5">
            {data.links.map((link, i) => {
                const isFirst = i === 0, isLast = i === data.links.length - 1;
                if (!link.url) return (
                    <span key={i} className="flex size-8 items-center justify-center rounded-lg text-sm text-gray-400">
                        {isFirst ? <ChevronLeft className="size-4" /> : isLast ? <ChevronRight className="size-4" /> : '…'}
                    </span>
                );
                return (
                    <Link key={i} href={link.url}
                        className={`flex size-8 items-center justify-center rounded-lg text-sm font-medium transition ${
                            link.active ? 'bg-red-600 text-white shadow-sm'
                                : 'border border-gray-200 text-gray-600 hover:border-red-400 hover:text-red-600 dark:border-gray-700 dark:text-gray-400'
                        }`}
                        dangerouslySetInnerHTML={{ __html: link.label }} />
                );
            })}
        </div>
    );
}

/* ─── Main page ──────────────────────────────────────── */
export default function NewsIndex({ articles, filters = {} as Filters, categories, tags, authors }: Props) {
    const selectedQ        = typeof filters?.q         === 'string' ? filters.q         : '';
    const selectedCategory = typeof filters?.category  === 'string' ? filters.category  : '';
    const selectedTag      = typeof filters?.tag       === 'string' ? filters.tag       : '';
    const selectedAuthor   = typeof filters?.author    === 'string' ? filters.author    : '';
    const selectedSort     = typeof filters?.sort      === 'string' ? filters.sort      : 'latest';
    const selectedFromDate = typeof filters?.from_date === 'string' ? filters.from_date : '';
    const selectedToDate   = typeof filters?.to_date   === 'string' ? filters.to_date   : '';

    const [showAdvanced, setShowAdvanced] = useState(false);
    const [isLoading, setIsLoading]   = useState(false);
    const [localSearch, setLocalSearch] = useState(selectedQ);

    const updateFilters = (next: Partial<Filters>) => {
        setIsLoading(true);
        const merged = { ...filters, ...next } as Record<string, unknown>;
        const params = Object.fromEntries(
            Object.entries(merged).filter(([, v]) => typeof v === 'string' && v),
        ) as Record<string, string>;
        router.get('/news', params, { preserveScroll: true });
    };

    useEffect(() => {
        const t = setTimeout(() => {
            if (localSearch !== selectedQ) updateFilters({ q: localSearch || undefined });
        }, 350);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [localSearch]);

    useEffect(() => { setIsLoading(false); }, [articles.current_page, articles.total]);
    useEffect(() => { setLocalSearch(selectedQ); }, [filters.q]);

    const visibleTags = useMemo(() => tags.slice(0, 16), [tags]);

    /* active filter pills */
    const activeFilters: { label: string; key: keyof Filters }[] = [
        ...(selectedCategory ? [{ label: categories.find(c => c.slug === selectedCategory)?.name ?? selectedCategory, key: 'category' as const }] : []),
        ...(selectedTag      ? [{ label: `#${tags.find(t => t.slug === selectedTag)?.name ?? selectedTag}`,            key: 'tag' as const }] : []),
        ...(selectedAuthor   ? [{ label: authors.find(a => String(a.id) === selectedAuthor)?.name ?? selectedAuthor,   key: 'author' as const }] : []),
        ...(selectedFromDate ? [{ label: `From ${selectedFromDate}`, key: 'from_date' as const }] : []),
        ...(selectedToDate   ? [{ label: `To ${selectedToDate}`,     key: 'to_date' as const }]   : []),
    ];

    return (
        <PublicLayout>
            <Head title="Latest News" />

            {/* ── Page header ─────────────────────────────────── */}
            <div className="border-b border-gray-100 bg-gradient-to-br from-gray-50 to-white dark:border-gray-800 dark:from-gray-950 dark:to-gray-900">
                <div className="mx-auto max-w-7xl px-4 py-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h1 className="text-2xl font-black tracking-tight">Latest News</h1>
                            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                                {articles.total.toLocaleString()} stories · Explore by topic, category, and tags
                            </p>
                        </div>
                        {/* sort chips */}
                        <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                            {(['latest', 'popular', 'oldest', 'title'] as const).map((val) => (
                                <button key={val} onClick={() => updateFilters({ sort: val })}
                                    className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold capitalize transition ${
                                        selectedSort === val ? 'bg-red-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'
                                    }`}>
                                    {val === 'latest' ? 'Latest' : val === 'popular' ? 'Popular' : val === 'oldest' ? 'Oldest' : 'A–Z'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 py-5">
                <div className="flex gap-6 lg:items-start">

                    {/* ══ MAIN ═════════════════════════════════════════ */}
                    <div className="min-w-0 flex-1">

                        {/* Search + filter bar */}
                        <div className="mb-4 space-y-3">
                            {/* primary bar */}
                            <div className="flex items-center gap-2">
                                {/* search */}
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                                    <input value={localSearch} onChange={(e) => setLocalSearch(e.target.value)}
                                        placeholder="Search headlines, keywords, topics..."
                                        className="h-9 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm shadow-sm focus:border-red-400 focus:outline-none dark:border-gray-700 dark:bg-gray-900" />
                                    {localSearch && (
                                        <button onClick={() => setLocalSearch('')}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                            <X className="size-3.5" />
                                        </button>
                                    )}
                                </div>
                                {/* advanced toggle */}
                                <button onClick={() => setShowAdvanced(v => !v)}
                                    className={`flex items-center gap-1.5 rounded-xl border px-3 h-9 text-[12px] font-semibold transition ${
                                        showAdvanced ? 'border-red-400 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                                            : 'border-gray-200 bg-white text-gray-600 hover:border-red-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400'
                                    }`}>
                                    <SlidersHorizontal className="size-3.5" />
                                    Filters
                                    {activeFilters.length > 0 && (
                                        <span className="flex size-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-black text-white">
                                            {activeFilters.length}
                                        </span>
                                    )}
                                </button>
                            </div>

                            {/* advanced filters panel */}
                            {showAdvanced && (
                                <div className="grid grid-cols-2 gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:grid-cols-4">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Category</label>
                                        <select value={selectedCategory}
                                            onChange={(e) => updateFilters({ category: e.target.value || undefined })}
                                            className="mt-1 h-8 w-full rounded-lg border border-gray-200 bg-white px-2 text-xs dark:border-gray-700 dark:bg-gray-800">
                                            <option value="">All categories</option>
                                            {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Author</label>
                                        <select value={selectedAuthor}
                                            onChange={(e) => updateFilters({ author: e.target.value || undefined })}
                                            className="mt-1 h-8 w-full rounded-lg border border-gray-200 bg-white px-2 text-xs dark:border-gray-700 dark:bg-gray-800">
                                            <option value="">All authors</option>
                                            {authors.map((a) => <option key={a.id} value={String(a.id)}>{a.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">From</label>
                                        <input type="date" value={selectedFromDate}
                                            onChange={(e) => updateFilters({ from_date: e.target.value || undefined })}
                                            className="mt-1 h-8 w-full rounded-lg border border-gray-200 bg-white px-2 text-xs dark:border-gray-700 dark:bg-gray-800" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">To</label>
                                        <input type="date" value={selectedToDate}
                                            onChange={(e) => updateFilters({ to_date: e.target.value || undefined })}
                                            className="mt-1 h-8 w-full rounded-lg border border-gray-200 bg-white px-2 text-xs dark:border-gray-700 dark:bg-gray-800" />
                                    </div>
                                </div>
                            )}

                            {/* active filter pills */}
                            {activeFilters.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="text-[11px] font-semibold text-gray-400">Active:</span>
                                    {activeFilters.map((f) => (
                                        <button key={f.key}
                                            onClick={() => updateFilters({ [f.key]: undefined })}
                                            className="flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold text-red-600 transition hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400">
                                            {f.label} <X className="size-2.5" />
                                        </button>
                                    ))}
                                    <button onClick={() => updateFilters({ category: undefined, tag: undefined, author: undefined, from_date: undefined, to_date: undefined })}
                                        className="text-[11px] text-gray-400 underline hover:text-red-600">
                                        Clear all
                                    </button>
                                </div>
                            )}

                            {/* tag pills */}
                            <div className="flex flex-wrap gap-1.5">
                                {visibleTags.map((tag) => (
                                    <button key={tag.id} onClick={() => updateFilters({ tag: selectedTag === tag.slug ? undefined : tag.slug })}
                                        className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition ${
                                            selectedTag === tag.slug
                                                ? 'border-red-500 bg-red-50 text-red-600 dark:bg-red-900/20'
                                                : 'border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-600 dark:border-gray-700 dark:text-gray-400'
                                        }`}>
                                        #{tag.name}
                                    </button>
                                ))}
                            </div>

                            {/* result count */}
                            <div className="flex items-center justify-between text-[11px] text-gray-400">
                                <span>{articles.from ?? 0}–{articles.to ?? 0} of {articles.total.toLocaleString()} articles</span>
                                {isLoading && <span className="flex items-center gap-1"><span className="size-1.5 animate-bounce rounded-full bg-red-500" />Loading…</span>}
                            </div>
                        </div>

                        {/* article list */}
                        {isLoading ? (
                            <div className="space-y-2.5">
                                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} />)}
                            </div>
                        ) : articles.data.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-gray-200 py-20 text-center dark:border-gray-700">
                                <Filter className="mx-auto mb-3 size-10 text-gray-300" />
                                <p className="font-semibold text-gray-500">No articles match your filters.</p>
                                <button onClick={() => updateFilters({ q: undefined, category: undefined, tag: undefined })}
                                    className="mt-2 text-sm text-red-600 hover:underline">Clear filters</button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2.5">
                                {articles.data.map((a) => <ArticleRow key={a.id} article={a} />)}
                            </div>
                        )}

                        <Pagination data={articles} />
                    </div>

                    {/* ══ SIDEBAR ══════════════════════════════════════ */}
                    <aside className="hidden w-64 shrink-0 space-y-5 lg:block lg:sticky lg:top-6 lg:self-start">
                        <TrendingSidebar categories={categories} />

                        {/* Popular tags */}
                        {visibleTags.length > 0 && (
                            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                                <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                                    <h2 className="text-sm font-black uppercase tracking-wider">Popular Tags</h2>
                                </div>
                                <div className="flex flex-wrap gap-1.5 p-4">
                                    {visibleTags.slice(0, 12).map((tag) => (
                                        <button key={tag.id} onClick={() => updateFilters({ tag: selectedTag === tag.slug ? undefined : tag.slug })}
                                            className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                                                selectedTag === tag.slug
                                                    ? 'border-red-500 bg-red-600 text-white'
                                                    : 'border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-600 dark:border-gray-700 dark:text-gray-400'
                                            }`}>
                                            #{tag.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </aside>
                </div>
            </div>
        </PublicLayout>
    );
}
