import { Head, Link, router } from '@inertiajs/react';
import { Clock, Eye, ChevronLeft, ChevronRight, TrendingUp, Flame, Tag as TagIcon, ArrowRight, BookOpen, ChevronRight as Chevron, LayoutGrid, Rows3 } from 'lucide-react';
import { useState } from 'react';
import React from 'react';
import AdSlot from '@/components/ads/AdSlot';
import PublicLayout from '@/layouts/public-layout';
import type { Article, Category, Paginated, Tag } from '@/types';

/* ─── Types ─────────────────────────────────────────── */
interface OtherCategory {
    id: number; name: string; slug: string;
    color: string; icon: string | null;
    articles_count: number;
}
interface Props {
    category: Category & { parent?: Category | null; children?: Category[] };
    articles: Paginated<Article>;
    tags?: Tag[];
    filters?: { sort?: string | null; tag?: string | null };
    trending?: Article[];
    otherCategories?: OtherCategory[];
}

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
function ArticleRow({ article, accent }: { article: Article; accent: string }) {
    const cat = article.categories?.[0];
    const readTime = article.meta?.read_time;
    const isNew = article.published_at
        ? (Date.now() - new Date(article.published_at).getTime()) < 86400000 * 2 : false;
    const initials = article.author?.name
        ? article.author.name.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase() : '?';

    return (
        <Link href={`/news/${article.slug}`}
            className="group relative flex overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition hover:border-gray-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700">
            <div className="absolute inset-y-0 left-0 w-0.5 rounded-l-xl opacity-0 transition-opacity group-hover:opacity-100"
                style={{ backgroundColor: accent }} />

            {/* thumbnail */}
            <div className="my-3 ml-3 shrink-0">
                {article.featured_image_url ? (
                    <img src={article.featured_image_url} alt={article.title}
                        className="h-[90px] w-32 rounded-lg object-cover transition group-hover:brightness-95" />
                ) : (
                    <div className="flex h-[90px] w-32 items-center justify-center rounded-lg text-3xl font-black"
                        style={{ background: `${accent}15`, color: `${accent}50` }}>
                        {article.title[0]}
                    </div>
                )}
            </div>

            {/* content */}
            <div className="flex min-w-0 flex-1 flex-col justify-between gap-1 py-3 pl-3 pr-4">
                <div className="flex flex-wrap items-center gap-1.5">
                    {cat && (
                        <span className="inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
                            style={{ backgroundColor: cat.color ?? accent }}>{cat.name}</span>
                    )}
                    {isNew && <span className="inline-flex rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">New</span>}
                    {article.views > 3000 && (
                        <span className="inline-flex items-center gap-0.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            <TrendingUp className="size-2.5" /> Hot
                        </span>
                    )}
                </div>
                <h3 className="line-clamp-2 text-[14px] font-bold leading-snug text-gray-900 transition group-hover:text-red-600 dark:text-gray-100 dark:group-hover:text-red-400">
                    {article.title}
                </h3>
                {article.excerpt && (
                    <p className="line-clamp-1 text-[11px] text-gray-500 dark:text-gray-400">{article.excerpt}</p>
                )}
                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                    {article.author && (
                        <div className="flex items-center gap-1">
                            <span className="flex size-4 items-center justify-center rounded-full text-[8px] font-bold text-white"
                                style={{ backgroundColor: accent }}>{initials}</span>
                            <span className="font-medium text-gray-600 dark:text-gray-300">{article.author.name}</span>
                        </div>
                    )}
                    {article.published_at && (
                        <><span className="text-gray-300 dark:text-gray-700">·</span>
                        <span className="flex items-center gap-0.5"><Clock className="size-2.5" />{fmt(article.published_at)}</span></>
                    )}
                    {readTime && (
                        <><span className="text-gray-300 dark:text-gray-700">·</span>
                        <span className="flex items-center gap-0.5"><BookOpen className="size-2.5" />{readTime}m</span></>
                    )}
                    <span className="ml-auto flex items-center gap-0.5 font-semibold">
                        <Eye className="size-2.5" />{fmtV(article.views)}
                    </span>
                </div>
            </div>
        </Link>
    );
}

/* ─── Article grid card ──────────────────────────────── */
function ArticleGridCard({ article, accent }: { article: Article; accent: string }) {
    const cat = article.categories?.[0];
    const isNew = article.published_at
        ? (Date.now() - new Date(article.published_at).getTime()) < 86400000 * 2 : false;
    return (
        <Link href={`/news/${article.slug}`}
            className="group flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition hover:border-gray-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
            <div className="relative overflow-hidden">
                {article.featured_image_url ? (
                    <img src={article.featured_image_url} alt={article.title}
                        className="h-40 w-full object-cover transition duration-300 group-hover:scale-105" />
                ) : (
                    <div className="flex h-40 items-center justify-center text-4xl font-black"
                        style={{ background: `${accent}15`, color: `${accent}40` }}>
                        {article.title[0]}
                    </div>
                )}
                {isNew && <span className="absolute top-2 left-2 rounded bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">NEW</span>}
                {article.views > 3000 && (
                    <span className="absolute top-2 right-2 flex items-center gap-0.5 rounded bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                        <TrendingUp className="size-2.5" /> Hot
                    </span>
                )}
            </div>
            <div className="flex flex-1 flex-col gap-1.5 p-3">
                {cat && (
                    <span className="inline-block w-fit rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
                        style={{ backgroundColor: cat.color ?? accent }}>{cat.name}</span>
                )}
                <h3 className="line-clamp-2 text-[13px] font-bold leading-snug transition group-hover:text-red-600 dark:group-hover:text-red-400">
                    {article.title}
                </h3>
                <div className="mt-auto flex items-center gap-2 text-[10px] text-gray-400">
                    {article.published_at && <span className="flex items-center gap-0.5"><Clock className="size-2.5" />{fmt(article.published_at)}</span>}
                    <span className="ml-auto flex items-center gap-0.5"><Eye className="size-2.5" />{fmtV(article.views)}</span>
                </div>
            </div>
        </Link>
    );
}

/* ─── Trending sidebar ───────────────────────────────── */
function TrendingSidebar({ articles, accent }: { articles: Article[]; accent: string }) {
    if (!articles.length) return null;
    return (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                <Flame className="size-4" style={{ color: accent }} />
                <h2 className="text-sm font-black uppercase tracking-wider">Trending</h2>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {articles.map((a, i) => {
                    const cat = a.categories?.[0];
                    return (
                        <Link key={a.id} href={`/news/${a.slug}`}
                            className="group flex items-start gap-3 p-3.5 transition hover:bg-gray-50 dark:hover:bg-gray-800/60">
                            <span className="mt-0.5 w-7 shrink-0 text-xl font-black text-gray-200 dark:text-gray-700">
                                {String(i + 1).padStart(2, '0')}
                            </span>
                            <div className="min-w-0 flex-1">
                                {cat && (
                                    <span className="inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold text-white"
                                        style={{ backgroundColor: cat.color ?? accent }}>{cat.name}</span>
                                )}
                                <p className="mt-0.5 line-clamp-2 text-[13px] font-semibold leading-snug transition group-hover:text-red-600 dark:group-hover:text-red-400">
                                    {a.title}
                                </p>
                                <div className="mt-1 flex items-center gap-2 text-[10px] text-gray-400">
                                    {a.published_at && <span className="flex items-center gap-0.5"><Clock className="size-2.5" />{fmt(a.published_at)}</span>}
                                    <span className="flex items-center gap-0.5"><Eye className="size-2.5" />{fmtV(a.views)}</span>
                                </div>
                            </div>
                        </Link>
                    );
                })}
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
export default function CategoryPage({ category, articles, tags = [], filters = {}, trending = [], otherCategories = [] }: Props) {
    const accent = category.color ?? '#ef4444';
    const selectedSort = (typeof filters.sort === 'string' && filters.sort) ? filters.sort : 'latest';
    const selectedTag  = typeof filters.tag  === 'string' ? filters.tag : '';
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    const updateFilters = (next: { sort?: string; tag?: string }) => {
        const payload: Record<string, string> = {};
        const merged = { sort: selectedSort, tag: selectedTag, ...next };
        if (merged.sort && merged.sort !== 'latest') payload.sort = merged.sort;
        if (merged.tag) payload.tag = merged.tag;
        router.get(`/category/${category.slug}`, payload, { preserveScroll: true });
    };

    return (
        <PublicLayout>
            <Head title={`${category.name} — NewsPortal`}>
                <meta name="description" content={category.description ?? `Latest ${category.name} news.`} />
            </Head>

            {/* ── Hero header ─────────────────────────────────── */}
            <div className="relative overflow-hidden border-b border-gray-100 dark:border-gray-800"
                style={{ background: `linear-gradient(135deg, ${accent}18 0%, ${accent}06 50%, transparent 100%)` }}>
                {/* decorative blob */}
                <div className="absolute -right-20 -top-20 size-64 rounded-full opacity-10 blur-3xl"
                    style={{ backgroundColor: accent }} />

                <div className="relative mx-auto max-w-7xl px-4 py-5">
                    {/* breadcrumb */}
                    <div className="mb-3 flex items-center gap-1 text-[11px] text-gray-400">
                        <Link href="/" className="transition hover:text-red-600">Home</Link>
                        {category.parent && (
                            <><Chevron className="size-3" />
                            <Link href={`/category/${category.parent.slug}`} className="transition hover:text-red-600">{category.parent.name}</Link></>
                        )}
                        <Chevron className="size-3" />
                        <span className="font-semibold text-gray-700 dark:text-gray-300">{category.name}</span>
                    </div>

                    <div className="flex flex-wrap items-start gap-4">
                        {/* icon */}
                        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl text-2xl font-black text-white shadow-md"
                            style={{ backgroundColor: accent }}>
                            {category.icon ?? category.name[0]}
                        </div>

                        {/* meta */}
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-2xl font-black tracking-tight">{category.name}</h1>
                                <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white"
                                    style={{ backgroundColor: accent }}>
                                    {articles.total.toLocaleString()} articles
                                </span>
                            </div>
                            {category.description && (
                                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{category.description}</p>
                            )}
                        </div>
                    </div>

                    {/* subcategory pills */}
                    {category.children && category.children.length > 0 && (
                        <div className="mt-4">
                            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">Subcategories</p>
                            <div className="flex flex-wrap gap-1.5">
                                {category.children.map((child) => (
                                    <Link key={child.id} href={`/category/${child.slug}`}
                                        className="flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold transition hover:text-white"
                                        style={{ borderColor: `${accent}60`, color: accent }}
                                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = accent; e.currentTarget.style.borderColor = accent; }}
                                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = `${accent}60`; }}>
                                        {child.icon && <span>{child.icon}</span>}
                                        {child.name}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Body ────────────────────────────────────────── */}
            <div className="mx-auto max-w-7xl px-4 py-4">
                <div className="flex gap-5 lg:items-start">

                    {/* ══ MAIN ═════════════════════════════════════════ */}
                    <div className="min-w-0 flex-1">

                        {/* filter bar */}
                        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                            {/* sort chips */}
                            <div className="flex items-center gap-1">
                                {(['latest', 'popular', 'oldest'] as const).map((val) => (
                                    <button key={val} onClick={() => updateFilters({ sort: val })}
                                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize transition ${
                                            selectedSort === val ? 'text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'
                                        }`}
                                        style={selectedSort === val ? { backgroundColor: accent } : {}}>
                                        {val}
                                    </button>
                                ))}
                            </div>

                            <div className="h-4 w-px bg-gray-200 dark:bg-gray-700" />

                            {/* tag pills */}
                            <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden">
                                <button onClick={() => updateFilters({ tag: '' })}
                                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                                        !selectedTag ? 'text-white' : 'text-gray-500 hover:text-gray-800'
                                    }`}
                                    style={!selectedTag ? { backgroundColor: accent } : {}}>
                                    All
                                </button>
                                {tags.map((tag) => (
                                    <button key={tag.id} onClick={() => updateFilters({ tag: tag.slug })}
                                        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                                            selectedTag === tag.slug ? 'text-white' : 'text-gray-500 hover:text-gray-800'
                                        }`}
                                        style={selectedTag === tag.slug ? { backgroundColor: accent } : {}}>
                                        {tag.name}
                                    </button>
                                ))}
                            </div>

                            {/* view toggle + count */}
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] text-gray-400">
                                    {articles.from ?? 0}–{articles.to ?? 0} of {articles.total}
                                </span>
                                <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 p-0.5 dark:border-gray-700">
                                    <button onClick={() => setViewMode('list')}
                                        className={`flex size-6 items-center justify-center rounded-md transition ${viewMode === 'list' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-gray-600'}`}>
                                        <Rows3 className="size-3.5" />
                                    </button>
                                    <button onClick={() => setViewMode('grid')}
                                        className={`flex size-6 items-center justify-center rounded-md transition ${viewMode === 'grid' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-gray-600'}`}>
                                        <LayoutGrid className="size-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <AdSlot position="inline" page="category" categoryId={category.id} className="mb-4" />

                        {/* articles */}
                        {articles.data.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-gray-200 py-16 text-center dark:border-gray-700">
                                <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl text-2xl"
                                    style={{ background: `${accent}15`, color: accent }}>
                                    {category.icon ?? category.name[0]}
                                </div>
                                <p className="font-semibold text-gray-500">No articles in this category yet.</p>
                                <Link href="/" className="mt-2 inline-block text-sm text-red-600 hover:underline">Browse other news →</Link>
                            </div>
                        ) : viewMode === 'list' ? (
                            <div className="flex flex-col gap-2.5">
                                {articles.data.map((a, i) => (
                                    <React.Fragment key={a.id}>
                                        <ArticleRow article={a} accent={accent} />
                                        {i === 2 && <AdSlot position="between_articles" page="category" categoryId={category.id} />}
                                    </React.Fragment>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                {articles.data.map((a, i) => (
                                    <React.Fragment key={a.id}>
                                        <ArticleGridCard article={a} accent={accent} />
                                        {i === 2 && <div className="col-span-full"><AdSlot position="between_articles" page="category" categoryId={category.id} /></div>}
                                    </React.Fragment>
                                ))}
                            </div>
                        )}

                        <Pagination data={articles} />
                        <AdSlot position="footer" page="category" categoryId={category.id} className="mt-6" />
                    </div>

                    {/* ══ SIDEBAR ══════════════════════════════════════ */}
                    <aside className="hidden w-72 shrink-0 space-y-5 lg:block">
                        <AdSlot position="right_sidebar_top" page="category" categoryId={category.id} />

                        <TrendingSidebar articles={trending} accent={accent} />

                        <AdSlot position="sidebar" page="category" categoryId={category.id} />

                        {/* Other categories */}
                        {otherCategories.length > 0 && (
                            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                                <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                                    <TrendingUp className="size-4 text-red-600" />
                                    <h2 className="text-sm font-black uppercase tracking-wider">Other Categories</h2>
                                </div>
                                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {otherCategories.map((cat) => (
                                        <Link key={cat.id} href={`/category/${cat.slug}`}
                                            className="flex items-center gap-2.5 px-4 py-2.5 transition hover:bg-gray-50 dark:hover:bg-gray-800">
                                            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-black text-white"
                                                style={{ backgroundColor: cat.color ?? '#6366f1' }}>
                                                {cat.icon ?? cat.name[0]}
                                            </span>
                                            <span className="flex-1 text-[12px] font-semibold">{cat.name}</span>
                                            <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 dark:bg-gray-800">
                                                {cat.articles_count}
                                            </span>
                                            <ArrowRight className="size-3 text-gray-300 dark:text-gray-600" />
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Tag cloud */}
                        {tags.length > 0 && (
                            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                                <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                                    <TagIcon className="size-4 text-red-600" />
                                    <h2 className="text-sm font-black uppercase tracking-wider">Tags</h2>
                                </div>
                                <div className="flex flex-wrap gap-1.5 p-4">
                                    {tags.map((tag) => (
                                        <button key={tag.id}
                                            onClick={() => updateFilters({ tag: selectedTag === tag.slug ? '' : tag.slug })}
                                            className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                                                selectedTag === tag.slug
                                                    ? 'border-transparent text-white'
                                                    : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400'
                                            }`}
                                            style={selectedTag === tag.slug ? { backgroundColor: accent } : {}}>
                                            #{tag.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        <AdSlot position="right_sidebar_bottom" page="category" categoryId={category.id} />
                    </aside>
                </div>
            </div>
        </PublicLayout>
    );
}
