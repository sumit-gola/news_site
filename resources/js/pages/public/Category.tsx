import { Head, Link, router } from '@inertiajs/react';
import { Clock, Eye, ChevronLeft, ChevronRight, TrendingUp, Flame, Tag as TagIcon, ArrowRight, LayoutGrid, List } from 'lucide-react';
import { useState } from 'react';
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

/* ─── Article cards ─────────────────────────────────── */

/** Hero card — large, first article */
function HeroCard({ article, accentColor }: { article: Article; accentColor: string }) {
    const cat = article.categories?.[0];
    return (
        <Link href={`/news/${article.slug}`} className="group relative block overflow-hidden rounded-2xl bg-gray-900">
            {article.featured_image_url ? (
                <img src={article.featured_image_url} alt={article.title}
                    className="h-72 w-full object-cover opacity-80 transition duration-500 group-hover:scale-105 group-hover:opacity-70" />
            ) : (
                <div className="flex h-72 items-center justify-center" style={{ background: `${accentColor}30` }}>
                    <span className="text-6xl font-black opacity-20">{article.title[0]}</span>
                </div>
            )}
            {/* gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
                {cat && (
                    <span className="mb-2 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white"
                        style={{ backgroundColor: accentColor }}>
                        {cat.name}
                    </span>
                )}
                <h2 className="line-clamp-2 text-lg font-black leading-snug text-white transition group-hover:text-white/90">
                    {article.title}
                </h2>
                {article.excerpt && (
                    <p className="mt-1.5 line-clamp-2 text-xs text-gray-300">{article.excerpt}</p>
                )}
                <div className="mt-2.5 flex items-center gap-3 text-[11px] text-gray-400">
                    {article.author && <span className="font-medium text-gray-300">{article.author.name}</span>}
                    {article.published_at && <span>{fmt(article.published_at)}</span>}
                    <span className="flex items-center gap-1"><Eye className="size-3" />{article.views.toLocaleString()}</span>
                </div>
            </div>
        </Link>
    );
}

/** Grid card — image top, content below */
function GridCard({ article, accentColor }: { article: Article; accentColor: string }) {
    const cat = article.categories?.[0];
    return (
        <Link href={`/news/${article.slug}`}
            className="group flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
            {article.featured_image_url ? (
                <div className="relative overflow-hidden">
                    <img src={article.featured_image_url} alt={article.title}
                        className="h-40 w-full object-cover transition duration-300 group-hover:scale-105" />
                    {cat && (
                        <span className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                            style={{ backgroundColor: accentColor }}>{cat.name}</span>
                    )}
                </div>
            ) : (
                <div className="relative flex h-40 items-center justify-center" style={{ background: `${accentColor}15` }}>
                    <span className="text-4xl font-black" style={{ color: `${accentColor}40` }}>{article.title[0]}</span>
                    {cat && (
                        <span className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                            style={{ backgroundColor: accentColor }}>{cat.name}</span>
                    )}
                </div>
            )}
            <div className="flex flex-1 flex-col p-3">
                <h3 className="line-clamp-2 text-[13px] font-bold leading-snug transition group-hover:text-red-600 dark:group-hover:text-red-400">
                    {article.title}
                </h3>
                <div className="mt-auto flex items-center gap-2 pt-2 text-[10px] text-gray-400">
                    {article.author && <span>{article.author.name}</span>}
                    {article.published_at && <><span>·</span><span>{fmt(article.published_at)}</span></>}
                    <span className="ml-auto flex items-center gap-0.5"><Eye className="size-3" />{article.views.toLocaleString()}</span>
                </div>
            </div>
        </Link>
    );
}

/** List card — horizontal, image left */
function ListCard({ article, accentColor, rank }: { article: Article; accentColor: string; rank?: number }) {
    return (
        <Link href={`/news/${article.slug}`}
            className="group flex gap-3 rounded-xl border border-gray-100 bg-white p-2.5 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
            {rank !== undefined && (
                <div className="flex size-6 shrink-0 items-center justify-center self-start rounded-full text-[11px] font-black text-white"
                    style={{ backgroundColor: accentColor }}>
                    {rank}
                </div>
            )}
            {article.featured_image_url ? (
                <img src={article.featured_image_url} alt={article.title}
                    className="size-16 shrink-0 rounded-lg object-cover transition group-hover:opacity-90" />
            ) : (
                <div className="flex size-16 shrink-0 items-center justify-center rounded-lg text-xl font-black"
                    style={{ background: `${accentColor}18`, color: `${accentColor}60` }}>
                    {article.title[0]}
                </div>
            )}
            <div className="min-w-0 flex-1">
                <h4 className="line-clamp-2 text-[12px] font-semibold leading-snug transition group-hover:text-red-600 dark:group-hover:text-red-400">
                    {article.title}
                </h4>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-gray-400">
                    {article.published_at && <span className="flex items-center gap-0.5"><Clock className="size-2.5" />{fmt(article.published_at)}</span>}
                    <span className="flex items-center gap-0.5"><Eye className="size-2.5" />{article.views.toLocaleString()}</span>
                </div>
            </div>
        </Link>
    );
}

/* ─── Pagination ────────────────────────────────────── */
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
                            link.active
                                ? 'bg-red-600 text-white shadow-sm'
                                : 'border border-gray-200 text-gray-600 hover:border-red-400 hover:text-red-600 dark:border-gray-700 dark:text-gray-400'
                        }`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                );
            })}
        </div>
    );
}

/* ─── Section label ─────────────────────────────────── */
function SectionLabel({ icon: Icon, title, color }: { icon: React.ElementType; title: string; color?: string }) {
    return (
        <div className="mb-3 flex items-center gap-2">
            <span className="rounded-md p-1" style={{ backgroundColor: `${color ?? '#ef4444'}18` }}>
                <Icon className="size-3.5" style={{ color: color ?? '#ef4444' }} />
            </span>
            <span className="text-[12px] font-black uppercase tracking-widest" style={{ color: color ?? '#ef4444' }}>{title}</span>
            <div className="flex-1 border-t border-dashed border-gray-200 dark:border-gray-700" />
        </div>
    );
}

/* ─── Main page ─────────────────────────────────────── */
export default function CategoryPage({ category, articles, tags = [], filters = {}, trending = [], otherCategories = [] }: Props) {
    const accent = category.color ?? '#ef4444';
    const selectedSort = (typeof filters.sort === 'string' && filters.sort) ? filters.sort : 'latest';
    const selectedTag  = typeof filters.tag === 'string' ? filters.tag : '';
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const updateFilters = (next: { sort?: string; tag?: string }) => {
        const payload: Record<string, string> = {};
        const merged = { sort: selectedSort, tag: selectedTag, ...next };
        if (merged.sort && merged.sort !== 'latest') payload.sort = merged.sort;
        if (merged.tag) payload.tag = merged.tag;
        router.get(`/category/${category.slug}`, payload, { preserveState: true, preserveScroll: true, replace: true });
    };

    const [hero, ...rest] = articles.data;

    return (
        <PublicLayout>
            <Head title={`${category.name} — NewsPortal`}>
                <meta name="description" content={category.description ?? `Latest ${category.name} news.`} />
            </Head>

            {/* ── Compact category strip ── */}
            <div className="border-b" style={{ borderColor: `${accent}25`, background: `linear-gradient(135deg,${accent}10 0%,transparent 70%)` }}>
                <div className="mx-auto max-w-7xl px-4 py-4">
                    {/* breadcrumb */}
                    <div className="mb-2 flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                        <Link href="/" className="transition hover:text-red-600">Home</Link>
                        {category.parent && (
                            <><span>/</span>
                            <Link href={`/category/${category.parent.slug}`} className="transition hover:text-red-600">{category.parent.name}</Link></>
                        )}
                        <span>/</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">{category.name}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* icon + name */}
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl text-lg font-black text-white shadow-sm"
                            style={{ backgroundColor: accent }}>
                            {category.icon ?? category.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl font-black leading-none">{category.name}</h1>
                            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                                {category.description && <span className="truncate max-w-xs">{category.description}</span>}
                                <span className="rounded-full px-2 py-0.5 font-semibold text-white text-[10px]"
                                    style={{ backgroundColor: accent }}>
                                    {articles.total.toLocaleString()} articles
                                </span>
                            </div>
                        </div>

                        {/* sub-categories inline */}
                        {category.children && category.children.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {category.children.map((child) => (
                                    <Link key={child.id} href={`/category/${child.slug}`}
                                        className="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition hover:text-white"
                                        style={{ borderColor: accent, color: accent }}
                                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = accent)}
                                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                                        {child.name}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 py-4">
                <div className="flex gap-5 lg:items-start">

                    {/* ══ MAIN CONTENT (2/3) ══════════════════════════════ */}
                    <div className="min-w-0 flex-1">

                        {/* ── Filter bar ── */}
                        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 dark:border-gray-800 dark:bg-gray-900">
                            {/* sort chips */}
                            <div className="flex items-center gap-1">
                                {[
                                    { value: 'latest',  label: 'Latest' },
                                    { value: 'popular', label: 'Popular' },
                                    { value: 'oldest',  label: 'Oldest' },
                                ].map((opt) => (
                                    <button key={opt.value}
                                        onClick={() => updateFilters({ sort: opt.value })}
                                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                                            selectedSort === opt.value
                                                ? 'text-white shadow-sm'
                                                : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                                        }`}
                                        style={selectedSort === opt.value ? { backgroundColor: accent } : {}}>
                                        {opt.label}
                                    </button>
                                ))}
                            </div>

                            <div className="h-4 w-px bg-gray-200 dark:bg-gray-700" />

                            {/* tag pills — scrollable */}
                            <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto pb-px">
                                <button onClick={() => updateFilters({ tag: '' })}
                                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                                        !selectedTag ? 'text-white' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'
                                    }`}
                                    style={!selectedTag ? { backgroundColor: accent } : {}}>
                                    All
                                </button>
                                {tags.map((tag) => (
                                    <button key={tag.id}
                                        onClick={() => updateFilters({ tag: tag.slug })}
                                        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                                            selectedTag === tag.slug ? 'text-white' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'
                                        }`}
                                        style={selectedTag === tag.slug ? { backgroundColor: accent } : {}}>
                                        {tag.name}
                                    </button>
                                ))}
                            </div>

                            <div className="h-4 w-px bg-gray-200 dark:bg-gray-700" />

                            {/* view mode toggle */}
                            <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 p-0.5 dark:border-gray-700">
                                <button onClick={() => setViewMode('grid')}
                                    className={`rounded-md p-1 transition ${viewMode === 'grid' ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                    <LayoutGrid className="size-3.5 text-gray-500" />
                                </button>
                                <button onClick={() => setViewMode('list')}
                                    className={`rounded-md p-1 transition ${viewMode === 'list' ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                    <List className="size-3.5 text-gray-500" />
                                </button>
                            </div>

                            <span className="ml-auto text-[11px] text-gray-400">
                                {articles.from}–{articles.to} of {articles.total}
                            </span>
                        </div>

                        <AdSlot position="inline" page="category" categoryId={category.id} className="mb-4" />

                        {/* ── Articles ── */}
                        {articles.data.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center dark:border-gray-700">
                                <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full text-2xl"
                                    style={{ background: `${accent}15`, color: accent }}>
                                    {category.icon ?? category.name[0]}
                                </div>
                                <p className="font-semibold text-gray-500">No articles in this category yet.</p>
                                <Link href="/" className="mt-2 inline-block text-sm text-red-600 hover:underline">Browse other news →</Link>
                            </div>
                        ) : viewMode === 'grid' ? (
                            <>
                                {/* Hero + side stack */}
                                {hero && (
                                    <div className="mb-3 grid gap-3 sm:grid-cols-3">
                                        <div className="sm:col-span-2">
                                            <HeroCard article={hero} accentColor={accent} />
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            {rest.slice(0, 2).map((a) => (
                                                <GridCard key={a.id} article={a} accentColor={accent} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {/* Remaining in 3-col grid */}
                                {rest.length > 2 && (
                                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                        {rest.slice(2).map((a) => (
                                            <GridCard key={a.id} article={a} accentColor={accent} />
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {articles.data.map((a) => (
                                    <ListCard key={a.id} article={a} accentColor={accent} />
                                ))}
                            </div>
                        )}

                        <Pagination data={articles} />
                        <AdSlot position="footer" page="category" categoryId={category.id} className="mt-6" />
                    </div>

                    {/* ══ SIDEBAR (1/3) ═══════════════════════════════════ */}
                    <aside className="hidden w-72 shrink-0 space-y-5 lg:block">

                        {/* ── Trending in this category ── */}
                        {trending.length > 0 && (
                            <div>
                                <SectionLabel icon={Flame} title="Trending" color={accent} />
                                <div className="space-y-2">
                                    {trending.map((a, i) => (
                                        <ListCard key={a.id} article={a} accentColor={accent} rank={i + 1} />
                                    ))}
                                </div>
                            </div>
                        )}

                        <AdSlot position="sidebar" page="category" categoryId={category.id} />

                        {/* ── Other categories ── */}
                        {otherCategories.length > 0 && (
                            <div>
                                <SectionLabel icon={TrendingUp} title="Other Categories" color={accent} />
                                <div className="overflow-hidden rounded-xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900">
                                    {otherCategories.map((cat, i) => (
                                        <Link key={cat.id} href={`/category/${cat.slug}`}
                                            className={`flex items-center gap-2.5 px-3 py-2.5 transition hover:bg-gray-50 dark:hover:bg-gray-800 ${
                                                i > 0 ? 'border-t border-gray-100 dark:border-gray-800' : ''
                                            }`}>
                                            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-black text-white"
                                                style={{ backgroundColor: cat.color ?? '#6366f1' }}>
                                                {cat.icon ?? cat.name[0]}
                                            </span>
                                            <span className="flex-1 text-[12px] font-semibold leading-none">{cat.name}</span>
                                            <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 dark:bg-gray-800">
                                                {cat.articles_count}
                                            </span>
                                            <ArrowRight className="size-3 text-gray-300 dark:text-gray-600" />
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Tag cloud ── */}
                        {tags.length > 0 && (
                            <div>
                                <SectionLabel icon={TagIcon} title="Tags" color={accent} />
                                <div className="flex flex-wrap gap-1.5">
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

                    </aside>
                </div>
            </div>
        </PublicLayout>
    );
}
