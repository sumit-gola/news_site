import { Head, Link, router } from '@inertiajs/react';
import { Clock, Eye, BookOpen, TrendingUp, Calendar, ChevronLeft, ChevronRight, Newspaper, BookMarked } from 'lucide-react';
import AdSlot from '@/components/ads/AdSlot';
import PublicLayout from '@/layouts/public-layout';
import type { Article, Paginated } from '@/types';

/* ─── Types ─────────────────────────────────────────── */
type AuthorData = {
    id: number; name: string; slug: string;
    bio?: string; joined?: string;
};
type AuthorCategory = {
    id: number; name: string; slug: string;
    color: string; icon: string | null; articles_count: number;
};
type Props = {
    author: AuthorData;
    stats: { total_articles: number; total_views: number };
    mostRead: Article[];
    authorCategories: AuthorCategory[];
    articles: Paginated<Article>;
    filters: { sort?: string };
};

/* ─── Helpers ───────────────────────────────────────── */
function fmt(date: string) {
    const d = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
    if (d === 0) return 'Today';
    if (d === 1) return 'Yesterday';
    if (d < 7) return `${d}d ago`;
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtViews(n: number) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return n.toLocaleString();
}

/* gradient seed from name */
const GRADIENTS = [
    ['#6366f1', '#8b5cf6'], ['#ec4899', '#f43f5e'], ['#0ea5e9', '#6366f1'],
    ['#10b981', '#0ea5e9'], ['#f59e0b', '#ef4444'], ['#8b5cf6', '#ec4899'],
];
function authorGradient(name: string) {
    const idx = name.charCodeAt(0) % GRADIENTS.length;
    return GRADIENTS[idx];
}

/* ─── Rich article row ───────────────────────────────── */
function ArticleRow({ article }: { article: Article }) {
    const cat = article.categories?.[0];
    const readTime = article.meta?.read_time;
    const isNew = article.published_at
        ? (Date.now() - new Date(article.published_at).getTime()) < 86400000 * 2
        : false;

    return (
        <Link href={`/news/${article.slug}`}
            className="group relative flex overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition hover:border-gray-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700">

            {/* accent strip */}
            <div className="absolute inset-y-0 left-0 w-0.5 rounded-l-xl bg-red-500 opacity-0 transition-opacity group-hover:opacity-100" />

            {/* thumbnail */}
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

            {/* content */}
            <div className="flex min-w-0 flex-1 flex-col justify-between gap-1 py-3 pl-3 pr-4">
                {/* badges */}
                <div className="flex flex-wrap items-center gap-1.5">
                    {cat && (
                        <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
                            style={{ backgroundColor: cat.color ?? '#ef4444' }}>
                            {cat.name}
                        </span>
                    )}
                    {isNew && (
                        <span className="inline-flex rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">New</span>
                    )}
                    {article.views > 5000 && (
                        <span className="inline-flex items-center gap-0.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            <TrendingUp className="size-2.5" /> Popular
                        </span>
                    )}
                </div>

                {/* title */}
                <h3 className="line-clamp-2 text-[14px] font-bold leading-snug text-gray-900 transition group-hover:text-red-600 dark:text-gray-100 dark:group-hover:text-red-400">
                    {article.title}
                </h3>

                {/* excerpt */}
                {article.excerpt && (
                    <p className="line-clamp-1 text-[11px] text-gray-500 dark:text-gray-400">{article.excerpt}</p>
                )}

                {/* meta */}
                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                    {article.published_at && (
                        <span className="flex items-center gap-0.5">
                            <Clock className="size-2.5" />{fmt(article.published_at)}
                        </span>
                    )}
                    {readTime && (
                        <>
                            <span className="text-gray-300 dark:text-gray-700">·</span>
                            <span className="flex items-center gap-0.5">
                                <BookOpen className="size-2.5" />{readTime} min read
                            </span>
                        </>
                    )}
                    <span className="ml-auto flex items-center gap-0.5 font-semibold">
                        <Eye className="size-2.5" />{fmtViews(article.views)}
                    </span>
                </div>
            </div>
        </Link>
    );
}

/* ─── Most Read sidebar ──────────────────────────────── */
function MostReadSidebar({ articles }: { articles: Article[] }) {
    if (!articles.length) return null;
    return (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                <TrendingUp className="size-4 text-red-600" />
                <h2 className="text-sm font-black uppercase tracking-wider">Most Read</h2>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {articles.map((a, i) => {
                    const cat = a.categories?.[0];
                    return (
                        <Link key={a.id} href={`/news/${a.slug}`}
                            className="group flex items-start gap-3 p-4 transition hover:bg-gray-50 dark:hover:bg-gray-800/60">
                            <span className="mt-0.5 w-7 shrink-0 text-xl font-black text-gray-200 dark:text-gray-700">
                                {String(i + 1).padStart(2, '0')}
                            </span>
                            <div className="min-w-0 flex-1">
                                {cat && (
                                    <span className="inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold text-white"
                                        style={{ backgroundColor: cat.color ?? '#ef4444' }}>
                                        {cat.name}
                                    </span>
                                )}
                                <p className="mt-1 line-clamp-2 text-sm font-semibold leading-snug transition group-hover:text-red-600 dark:group-hover:text-red-400">
                                    {a.title}
                                </p>
                                <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-400">
                                    {a.published_at && (
                                        <span className="flex items-center gap-0.5">
                                            <Clock className="size-2.5" />{fmt(a.published_at)}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-0.5">
                                        <Eye className="size-2.5" />{fmtViews(a.views)}
                                    </span>
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
                    <span key={i} className="flex size-8 items-center justify-center text-sm text-gray-400">
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

/* ─── Main page ──────────────────────────────────────── */
export default function AuthorPage({ author, stats, mostRead, authorCategories, articles, filters = {} }: Props) {
    const selectedSort = typeof filters?.sort === 'string' ? filters.sort : 'latest';
    const [g1, g2] = authorGradient(author.name);
    const initials = author.name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();

    const updateSort = (sort: string) => {
        const params: Record<string, string> = {};
        if (sort !== 'latest') params.sort = sort;
        router.get(`/author/${author.slug}`, params, { preserveScroll: true });
    };

    return (
        <PublicLayout>
            <Head title={`${author.name} — Author`}>
                <meta name="description" content={`Read articles by ${author.name}. ${stats.total_articles} published articles.`} />
            </Head>

            {/* ── Author hero banner ────────────────────────────── */}
            <div className="border-b border-gray-100 bg-gradient-to-br from-gray-50 to-white dark:border-gray-800 dark:from-gray-950 dark:to-gray-900">
                <div className="mx-auto max-w-7xl px-4 py-8">

                    {/* breadcrumb */}
                    <div className="mb-4 flex items-center gap-1 text-[11px] text-gray-400">
                        <Link href="/" className="transition hover:text-red-600">Home</Link>
                        <span>/</span>
                        <span className="font-medium text-gray-600 dark:text-gray-300">Author</span>
                        <span>/</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">{author.name}</span>
                    </div>

                    <div className="flex flex-wrap items-start gap-6">
                        {/* avatar */}
                        <div className="relative shrink-0">
                            <div className="flex size-24 items-center justify-center rounded-2xl text-3xl font-black text-white shadow-lg"
                                style={{ background: `linear-gradient(135deg, ${g1}, ${g2})` }}>
                                {initials}
                            </div>
                            {/* online dot */}
                            <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full border-2 border-white bg-emerald-500 dark:border-gray-900" />
                        </div>

                        {/* info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-widest text-red-600 dark:bg-red-900/20">
                                    Author
                                </span>
                                {author.joined && (
                                    <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                        <Calendar className="size-3" /> Since {author.joined}
                                    </span>
                                )}
                            </div>
                            <h1 className="mt-1.5 text-3xl font-black tracking-tight">{author.name}</h1>
                            <p className="mt-1 max-w-xl text-sm text-gray-600 dark:text-gray-400">
                                {author.bio ?? 'Staff journalist covering breaking stories and in-depth reporting.'}
                            </p>

                            {/* category tags */}
                            {authorCategories.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                    {authorCategories.map((cat) => (
                                        <Link key={cat.id} href={`/category/${cat.slug}`}
                                            className="flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition hover:text-white"
                                            style={{ borderColor: cat.color ?? '#ef4444', color: cat.color ?? '#ef4444' }}
                                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = cat.color ?? '#ef4444')}
                                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                                            {cat.icon && <span>{cat.icon}</span>}
                                            {cat.name}
                                            <span className="rounded-full bg-white/20 px-1 font-bold">{cat.articles_count}</span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* stats strip */}
                        <div className="flex shrink-0 flex-wrap gap-px overflow-hidden rounded-2xl border border-gray-200 bg-gray-200 shadow-sm dark:border-gray-700 dark:bg-gray-700">
                            {[
                                { icon: Newspaper, label: 'Articles', value: stats.total_articles.toLocaleString() },
                                { icon: Eye,       label: 'Total Views', value: fmtViews(stats.total_views) },
                            ].map(({ icon: Icon, label, value }) => (
                                <div key={label} className="flex flex-col items-center gap-0.5 bg-white px-6 py-4 dark:bg-gray-900">
                                    <Icon className="size-4 text-red-500" />
                                    <span className="text-xl font-black">{value}</span>
                                    <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Body ─────────────────────────────────────────── */}
            <div className="mx-auto max-w-7xl px-4 py-5">
                <div className="flex gap-5 lg:items-start">

                    {/* ══ MAIN — article list ══════════════════════════ */}
                    <div className="min-w-0 flex-1">

                        {/* filter + count bar */}
                        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2.5 dark:border-gray-800 dark:bg-gray-900">
                            <div className="flex items-center gap-1">
                                {(['latest', 'popular', 'oldest'] as const).map((val) => (
                                    <button key={val}
                                        onClick={() => updateSort(val)}
                                        className={`rounded-full px-3 py-1 text-[11px] font-semibold capitalize transition ${
                                            selectedSort === val
                                                ? 'bg-red-600 text-white shadow-sm'
                                                : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                                        }`}>
                                        {val}
                                    </button>
                                ))}
                            </div>
                            <span className="text-[11px] text-gray-400">
                                {articles.from ?? 0}–{articles.to ?? 0} of {articles.total} articles
                            </span>
                        </div>

                        {/* articles */}
                        {articles.data.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center dark:border-gray-700">
                                <BookMarked className="mx-auto mb-3 size-10 text-gray-300" />
                                <p className="font-semibold text-gray-500">No published articles yet.</p>
                                <Link href="/" className="mt-2 inline-block text-sm text-red-600 hover:underline">Browse other news →</Link>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2.5">
                                {articles.data.map((article) => (
                                    <ArticleRow key={article.id} article={article} />
                                ))}
                            </div>
                        )}

                        <Pagination data={articles} />
                    </div>

                    {/* ══ SIDEBAR ════════════════════════════════════════ */}
                    <aside className="hidden w-72 shrink-0 space-y-5 lg:block">
                        <AdSlot position="right_sidebar_top" page="home" />

                        {/* Most Read */}
                        <MostReadSidebar articles={mostRead} />

                        <AdSlot position="sidebar" page="home" />

                        {/* Categories this author writes in */}
                        {authorCategories.length > 0 && (
                            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                                <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                                    <BookOpen className="size-4 text-red-600" />
                                    <h2 className="text-sm font-black uppercase tracking-wider">Covers Topics</h2>
                                </div>
                                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {authorCategories.map((cat) => (
                                        <Link key={cat.id} href={`/category/${cat.slug}`}
                                            className="flex items-center gap-3 px-4 py-3 transition hover:bg-gray-50 dark:hover:bg-gray-800/60">
                                            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-black text-white"
                                                style={{ backgroundColor: cat.color ?? '#6366f1' }}>
                                                {cat.icon ?? cat.name[0]}
                                            </span>
                                            <span className="flex-1 text-sm font-semibold">{cat.name}</span>
                                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500 dark:bg-gray-800">
                                                {cat.articles_count}
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                        <AdSlot position="right_sidebar_bottom" page="home" />

                    </aside>
                </div>
            </div>
        </PublicLayout>
    );
}
