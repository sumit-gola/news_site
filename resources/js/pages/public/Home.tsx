import { Head, Link } from '@inertiajs/react';
import { Clock, Eye, ChevronLeft, ChevronRight, Flame, TrendingUp, Radio } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import PublicLayout from '@/layouts/public-layout';
import type { Article, Category } from '@/types';

interface CategoryGroup extends Category {
    articles: Article[];
}

interface Props {
    featured: Article[];
    trending: Article[];
    categoryGroups: CategoryGroup[];
    navCategories: Category[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7)  return `${days}d ago`;
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function CategoryBadge({ category, small }: { category: Category; small?: boolean }) {
    return (
        <span
            className={`inline-block rounded font-semibold text-white ${small ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'}`}
            style={{ backgroundColor: category.color ?? '#dc2626' }}
        >
            {category.name}
        </span>
    );
}

// ── Breaking News Ticker ──────────────────────────────────────────────────────

function BreakingTicker({ articles }: { articles: Article[] }) {
    if (!articles.length) return null;
    // duplicate for seamless loop
    const items = [...articles, ...articles];
    return (
        <div className="flex items-center gap-0 overflow-hidden border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
            <div className="flex shrink-0 items-center gap-2 bg-red-600 px-4 py-2 text-xs font-black uppercase tracking-widest text-white">
                <Radio className="size-3 animate-pulse" />
                Breaking
            </div>
            <div className="relative flex-1 overflow-hidden py-2">
                <div className="ticker-track flex gap-8 whitespace-nowrap">
                    {items.map((a, i) => (
                        <Link
                            key={`${a.id}-${i}`}
                            href={`/news/${a.slug}`}
                            className="shrink-0 text-xs font-medium text-gray-700 transition hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400"
                        >
                            <span className="mr-2 text-red-500">•</span>
                            {a.title}
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ── Hero Slider ───────────────────────────────────────────────────────────────

function HeroSlider({ articles }: { articles: Article[] }) {
    const [current, setCurrent] = useState(0);
    const [animating, setAnimating] = useState(false);

    const goTo = useCallback((idx: number) => {
        if (animating) return;
        setAnimating(true);
        setCurrent(idx);
        setTimeout(() => setAnimating(false), 500);
    }, [animating]);

    const prev = useCallback(() => goTo(current === 0 ? articles.length - 1 : current - 1), [current, articles.length, goTo]);
    const next = useCallback(() => goTo((current + 1) % articles.length), [current, articles.length, goTo]);

    useEffect(() => {
        const t = setInterval(next, 7000);
        return () => clearInterval(t);
    }, [next]);

    if (!articles.length) return null;
    const hero = articles[current];
    const cat  = hero.categories?.[0];

    return (
        <div className="relative h-[420px] overflow-hidden rounded-2xl bg-gray-900 md:h-[500px]">
            {/* Slides */}
            {articles.map((a, i) => (
                <div
                    key={a.id}
                    className={`absolute inset-0 transition-opacity duration-700 ${i === current ? 'opacity-100' : 'opacity-0'}`}
                >
                    {a.featured_image_url ? (
                        <img src={a.featured_image_url} alt={a.title} className="size-full object-cover" />
                    ) : (
                        <div
                            className="size-full"
                            style={{ background: `linear-gradient(135deg, ${a.categories?.[0]?.color ?? '#dc2626'}44, #111827)` }}
                        />
                    )}
                </div>
            ))}

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />

            {/* Badge */}
            <div className="absolute left-6 top-6">
                <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-black uppercase tracking-widest text-white shadow">
                    Featured
                </span>
            </div>

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                {cat && <CategoryBadge category={cat} />}
                <Link href={`/news/${hero.slug}`}>
                    <h1 className="mt-3 line-clamp-3 text-2xl font-black leading-tight text-white transition hover:text-red-300 md:text-[2rem] md:leading-snug">
                        {hero.title}
                    </h1>
                </Link>
                {hero.excerpt && (
                    <p className="mt-2 line-clamp-2 max-w-2xl text-sm text-gray-300 md:text-base">{hero.excerpt}</p>
                )}
                <div className="mt-4 flex items-center gap-4 text-sm text-gray-400">
                    {hero.author && (
                        <span className="flex items-center gap-1.5">
                            <span className="flex size-6 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white">
                                {hero.author.name[0]}
                            </span>
                            {hero.author.name}
                        </span>
                    )}
                    {hero.published_at && (
                        <>
                            <span>·</span>
                            <span className="flex items-center gap-1"><Clock className="size-3" />{timeAgo(hero.published_at)}</span>
                        </>
                    )}
                    <span className="flex items-center gap-1"><Eye className="size-3" />{hero.views.toLocaleString()}</span>
                </div>
            </div>

            {/* Arrows */}
            {articles.length > 1 && (
                <>
                    <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2.5 text-white backdrop-blur-sm transition hover:bg-red-600">
                        <ChevronLeft className="size-5" />
                    </button>
                    <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2.5 text-white backdrop-blur-sm transition hover:bg-red-600">
                        <ChevronRight className="size-5" />
                    </button>
                    {/* Dot indicators */}
                    <div className="absolute bottom-5 right-7 flex gap-1.5">
                        {articles.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => goTo(i)}
                                className={`h-1.5 rounded-full transition-all ${i === current ? 'w-6 bg-red-500' : 'w-1.5 bg-white/50 hover:bg-white/80'}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

// ── Section Header ────────────────────────────────────────────────────────────

function SectionHeader({ title, color, href }: { title: string; color?: string | null; href?: string }) {
    return (
        <div className="mb-5 flex items-center justify-between border-b-2 pb-3" style={{ borderColor: color ?? '#dc2626' }}>
            <div className="flex items-center gap-2.5">
                <div className="h-6 w-1.5 rounded-full" style={{ backgroundColor: color ?? '#dc2626' }} />
                <h2 className="text-base font-black uppercase tracking-wider">{title}</h2>
            </div>
            {href && (
                <Link href={href} className="text-xs font-semibold uppercase tracking-wide text-red-600 transition hover:text-red-700 dark:text-red-400">
                    View All →
                </Link>
            )}
        </div>
    );
}

// ── Latest News Sidebar ───────────────────────────────────────────────────────

function LatestSidebar({ articles }: { articles: Article[] }) {
    return (
        <aside className="flex flex-col gap-0 rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                <TrendingUp className="size-4 text-red-600" />
                <h2 className="text-sm font-black uppercase tracking-wider">Latest News</h2>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {articles.map((a, i) => {
                    const cat = a.categories?.[0];
                    return (
                        <Link key={a.id} href={`/news/${a.slug}`} className="group flex items-start gap-3 p-4 transition hover:bg-gray-50 dark:hover:bg-gray-800/60">
                            <span className="mt-0.5 shrink-0 text-xl font-black text-gray-200 dark:text-gray-700">{String(i + 1).padStart(2, '0')}</span>
                            <div className="flex-1 min-w-0">
                                {cat && <CategoryBadge category={cat} small />}
                                <p className="mt-1 line-clamp-2 text-sm font-semibold leading-snug transition group-hover:text-red-600 dark:group-hover:text-red-400">
                                    {a.title}
                                </p>
                                {a.published_at && (
                                    <p className="mt-1 text-xs text-gray-400">{timeAgo(a.published_at)}</p>
                                )}
                            </div>
                        </Link>
                    );
                })}
            </div>
        </aside>
    );
}

// ── Trending Bar ──────────────────────────────────────────────────────────────

function TrendingBar({ articles }: { articles: Article[] }) {
    if (!articles.length) return null;
    return (
        <div className="flex items-stretch overflow-hidden rounded-xl border border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50 dark:border-orange-900/30 dark:from-orange-950/30 dark:to-amber-950/20">
            <div className="flex shrink-0 flex-col items-center justify-center gap-1 bg-orange-500 px-4 py-3 text-white">
                <Flame className="size-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Hot</span>
            </div>
            <div className="flex items-center gap-6 overflow-x-auto px-4 py-3 [&::-webkit-scrollbar]:hidden">
                {articles.map((a, i) => (
                    <Link
                        key={a.id}
                        href={`/news/${a.slug}`}
                        className="group flex shrink-0 items-center gap-2 text-sm transition"
                    >
                        <span className="text-base font-black text-orange-300 dark:text-orange-500">{i + 1}</span>
                        <span className="max-w-52 truncate font-medium text-gray-700 group-hover:text-red-600 dark:text-gray-300 dark:group-hover:text-red-400">
                            {a.title}
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    );
}

// ── Card Variants ─────────────────────────────────────────────────────────────

function MiniCard({ article, color }: { article: Article; color?: string | null }) {
    const cat = article.categories?.[0];
    return (
        <Link href={`/news/${article.slug}`} className="group flex gap-3 rounded-lg p-2 transition hover:bg-gray-50 dark:hover:bg-gray-800/60">
            <div className="size-20 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                {article.featured_image_url ? (
                    <img src={article.featured_image_url} alt={article.title} className="size-full object-cover transition group-hover:scale-105" />
                ) : (
                    <div className="flex size-full items-center justify-center" style={{ backgroundColor: `${color ?? '#dc2626'}18` }}>
                        <span className="text-lg font-black" style={{ color: `${color ?? '#dc2626'}50` }}>{article.title[0]}</span>
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                {cat && <CategoryBadge category={cat} small />}
                <h4 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug transition group-hover:text-red-600 dark:group-hover:text-red-400">
                    {article.title}
                </h4>
                {article.published_at && (
                    <p className="mt-1 text-xs text-gray-400">{timeAgo(article.published_at)}</p>
                )}
            </div>
        </Link>
    );
}

// ── Category Section ──────────────────────────────────────────────────────────

function CategorySection({ group }: { group: CategoryGroup }) {
    if (!group.articles.length) return null;
    const [main, ...rest] = group.articles;

    return (
        <section>
            <SectionHeader title={group.name} color={group.color} href={`/category/${group.slug}`} />

            <div className="grid gap-4 lg:grid-cols-5">
                {/* Main featured */}
                <div className="lg:col-span-2">
                    <Link href={`/news/${main.slug}`} className="group block h-full overflow-hidden rounded-xl bg-white shadow-sm transition hover:shadow-md dark:bg-gray-900">
                        <div className="relative overflow-hidden">
                            {main.featured_image_url ? (
                                <img src={main.featured_image_url} alt={main.title} className="h-64 w-full object-cover transition duration-500 group-hover:scale-105" />
                            ) : (
                                <div className="flex h-64 items-center justify-center" style={{ backgroundColor: `${group.color ?? '#dc2626'}15` }}>
                                    <span className="text-7xl font-black" style={{ color: `${group.color ?? '#dc2626'}30` }}>{main.title[0]}</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-4">
                                <h3 className="line-clamp-3 text-base font-bold leading-snug text-white transition group-hover:text-red-300">
                                    {main.title}
                                </h3>
                                <div className="mt-2 flex items-center gap-2 text-xs text-gray-300">
                                    {main.author && <span>{main.author.name}</span>}
                                    {main.published_at && (
                                        <>
                                            <span>·</span>
                                            <span>{timeAgo(main.published_at)}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Side list */}
                <div className="lg:col-span-3">
                    <div className="space-y-1">
                        {rest.map((a) => <MiniCard key={a.id} article={a} color={group.color} />)}
                    </div>
                </div>
            </div>
        </section>
    );
}

// ── Most Read Panel ───────────────────────────────────────────────────────────

function MostRead({ articles }: { articles: Article[] }) {
    if (!articles.length) return null;
    return (
        <aside className="rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                <Flame className="size-4 text-orange-500" />
                <h2 className="text-sm font-black uppercase tracking-wider">Most Read</h2>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {articles.slice(0, 5).map((a, i) => (
                    <Link key={a.id} href={`/news/${a.slug}`} className="group flex items-start gap-3 p-4 transition hover:bg-gray-50 dark:hover:bg-gray-800/60">
                        <span
                            className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded text-xs font-black text-white"
                            style={{ backgroundColor: i === 0 ? '#dc2626' : i === 1 ? '#ea580c' : '#6b7280' }}
                        >
                            {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                            <p className="line-clamp-2 text-sm font-semibold leading-snug transition group-hover:text-red-600 dark:group-hover:text-red-400">
                                {a.title}
                            </p>
                            <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                                <Eye className="size-3" /> {a.views.toLocaleString()}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </aside>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Home({ featured, trending, categoryGroups, navCategories }: Props) {
    return (
        <PublicLayout navCategories={navCategories}>
            <Head title="Home — NewsPortal" />

            {/* Breaking news ticker */}
            {trending.length > 0 && <BreakingTicker articles={trending.slice(0, 6)} />}

            <div className="mx-auto max-w-7xl px-4 py-6">

                {/* Hero + Latest sidebar */}
                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <HeroSlider articles={featured.slice(0, 5)} />
                    </div>
                    <div>
                        <LatestSidebar articles={featured.slice(0, 6)} />
                    </div>
                </div>

                {/* Trending / Hot bar */}
                {trending.length > 0 && (
                    <div className="mt-6">
                        <TrendingBar articles={trending} />
                    </div>
                )}

                {/* Category sections + Most Read sidebar */}
                {categoryGroups.length > 0 && (
                    <div className="mt-10 grid gap-10 lg:grid-cols-3">
                        {/* Main content */}
                        <div className="space-y-12 lg:col-span-2">
                            {categoryGroups.map((group) => (
                                <CategorySection key={group.id} group={group} />
                            ))}
                        </div>

                        {/* Right sidebar */}
                        <div className="space-y-8">
                            <MostRead articles={trending} />

                            {/* Ad / promo placeholder */}
                            <div className="flex h-60 items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 text-center dark:border-gray-700 dark:bg-gray-900/50">
                                <div className="text-gray-400">
                                    <p className="text-xs font-medium uppercase tracking-widest">Advertisement</p>
                                    <p className="mt-1 text-sm">300 × 250</p>
                                </div>
                            </div>

                            {/* Category browser */}
                            {navCategories.length > 0 && (
                                <div className="rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                                    <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                                        <h2 className="text-sm font-black uppercase tracking-wider">Browse Topics</h2>
                                    </div>
                                    <div className="flex flex-wrap gap-2 p-4">
                                        {navCategories.map((cat) => (
                                            <Link
                                                key={cat.id}
                                                href={`/category/${cat.slug}`}
                                                className="rounded-full px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-80"
                                                style={{ backgroundColor: cat.color ?? '#6366f1' }}
                                            >
                                                {cat.icon && <span className="mr-1">{cat.icon}</span>}
                                                {cat.name}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {!featured.length && !categoryGroups.length && (
                    <div className="mt-24 text-center text-gray-400">
                        <Flame className="mx-auto mb-4 size-14 opacity-20" />
                        <p className="text-xl font-bold">No published articles yet.</p>
                        <p className="mt-2 text-sm">Check back soon for the latest news.</p>
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}
