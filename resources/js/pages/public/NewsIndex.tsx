import { Head, Link, router } from '@inertiajs/react';
import { Search, LayoutGrid, Rows3, Filter } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import PublicLayout from '@/layouts/public-layout';
import type { Article, Category, Paginated, Tag } from '@/types';

type Filters = {
    q?: string;
    category?: string;
    tag?: string;
    author?: string;
    sort?: string;
    from_date?: string;
    to_date?: string;
};

type AuthorOption = { id: number; name: string; slug: string };

type Props = {
    articles: Paginated<Article>;
    filters: Filters;
    categories: Category[];
    tags: Tag[];
    authors: AuthorOption[];
    navCategories: Category[];
};

function ArticleCard({ article, listMode }: { article: Article; listMode: boolean }) {
    const primaryCategory = article.categories?.[0];

    return (
        <article className={`rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 ${listMode ? 'flex gap-4' : ''}`}>
            <Link href={`/news/${article.slug}`} className={`block overflow-hidden rounded-lg ${listMode ? 'w-40 shrink-0' : ''}`}>
                {article.featured_image_url ? (
                    <img src={article.featured_image_url} alt={article.title} className={`${listMode ? 'h-28' : 'h-52'} w-full object-cover transition hover:scale-[1.02]`} />
                ) : (
                    <div className={`flex ${listMode ? 'h-28' : 'h-52'} w-full items-center justify-center bg-gray-100 text-4xl font-black text-gray-300 dark:bg-gray-800 dark:text-gray-600`}>
                        {article.title[0]}
                    </div>
                )}
            </Link>

            <div className="min-w-0 flex-1">
                <div className="mt-1 flex items-center gap-2">
                    {primaryCategory && (
                        <Link
                            href={`/news?category=${primaryCategory.slug}`}
                            className="rounded px-2 py-0.5 text-xs font-semibold text-white"
                            style={{ backgroundColor: primaryCategory.color ?? '#dc2626' }}
                        >
                            {primaryCategory.name}
                        </Link>
                    )}
                    <span className="text-xs text-gray-500">{new Date(article.updated_at).toLocaleDateString()}</span>
                </div>

                <Link href={`/news/${article.slug}`}>
                    <h3 className={`mt-2 ${listMode ? 'line-clamp-2 text-base' : 'line-clamp-2 text-lg'} font-bold leading-snug hover:text-red-600 dark:hover:text-red-400`}>
                        {article.title}
                    </h3>
                </Link>

                {article.excerpt && (
                    <p className={`mt-2 ${listMode ? 'line-clamp-2' : 'line-clamp-2'} text-sm text-gray-600 dark:text-gray-300`}>
                        {article.excerpt}
                    </p>
                )}

                <div className="text-muted-foreground mt-3 flex items-center justify-between text-xs">
                    {article.author_slug ? (
                        <Link href={`/author/${article.author_slug}`} className="hover:text-red-600">{article.author?.name ?? 'Staff'}</Link>
                    ) : (
                        <span>{article.author?.name ?? 'Staff'}</span>
                    )}
                    <span>{article.views.toLocaleString()} views</span>
                </div>
            </div>
        </article>
    );
}

function SkeletonCard({ listMode }: { listMode: boolean }) {
    return (
        <div className={`animate-pulse rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 ${listMode ? 'flex gap-4' : ''}`}>
            <div className={`${listMode ? 'h-28 w-40' : 'h-52 w-full'} rounded-lg bg-gray-200 dark:bg-gray-700`} />
            <div className="mt-3 flex-1 space-y-2">
                <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-4 w-5/6 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
        </div>
    );
}

export default function NewsIndex({ articles, filters, categories, tags, authors, navCategories }: Props) {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [filterOpen, setFilterOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [localSearch, setLocalSearch] = useState(filters.q ?? '');

    const updateFilters = (next: Partial<Filters>) => {
        setIsLoading(true);
        router.get('/news', { ...filters, ...next }, { preserveState: true, preserveScroll: true, replace: true });
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (localSearch !== (filters.q ?? '')) {
                updateFilters({ q: localSearch || undefined });
            }
        }, 350);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [localSearch]);

    useEffect(() => {
        setIsLoading(false);
    }, [articles.current_page, articles.total]);

    useEffect(() => {
        setLocalSearch(filters.q ?? '');
    }, [filters.q]);

    const listMode = viewMode === 'list';

    const visibleTags = useMemo(() => tags.slice(0, 12), [tags]);

    return (
        <PublicLayout navCategories={navCategories}>
            <Head title="Latest News" />

            <div className="mx-auto max-w-7xl px-4 py-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-black tracking-tight">Latest News</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Explore stories by topic, category, and trending tags.</p>
                </div>

                <div className="mb-4 flex items-center justify-between gap-3">
                    <button
                        onClick={() => setFilterOpen((v) => !v)}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:border-red-400 hover:text-red-600 dark:border-gray-700"
                    >
                        <Filter className="size-4" />
                        Filters
                    </button>

                    <div className="inline-flex items-center gap-1 rounded-lg border border-gray-300 p-1 dark:border-gray-700">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`rounded-md px-2 py-1 text-xs font-semibold ${viewMode === 'grid' ? 'bg-red-600 text-white' : 'text-gray-600 dark:text-gray-300'}`}
                        >
                            <LayoutGrid className="size-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`rounded-md px-2 py-1 text-xs font-semibold ${viewMode === 'list' ? 'bg-red-600 text-white' : 'text-gray-600 dark:text-gray-300'}`}
                        >
                            <Rows3 className="size-4" />
                        </button>
                    </div>
                </div>

                <div className={`mb-6 grid gap-3 rounded-xl border border-gray-200 bg-white p-4 md:grid-cols-7 dark:border-gray-800 dark:bg-gray-900 ${filterOpen ? '' : 'hidden md:grid'}`}>
                    <div className="md:col-span-2">
                        <label htmlFor="q" className="text-xs font-semibold uppercase tracking-wide text-gray-500">Search</label>
                        <div className="relative mt-1">
                            <Search className="absolute left-2.5 top-2.5 size-4 text-gray-400" />
                            <input
                                id="q"
                                value={localSearch}
                                className="h-9 w-full rounded-md border border-gray-300 bg-white pl-8 pr-3 text-sm dark:border-gray-700 dark:bg-gray-800"
                                placeholder="Headline, keyword, tag..."
                                onChange={(e) => setLocalSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="category" className="text-xs font-semibold uppercase tracking-wide text-gray-500">Category</label>
                        <select
                            id="category"
                            value={filters.category ?? ''}
                            onChange={(e) => updateFilters({ category: e.target.value || undefined })}
                            className="mt-1 h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-800"
                        >
                            <option value="">All categories</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.slug}>{category.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="tag" className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tag</label>
                        <select
                            id="tag"
                            value={filters.tag ?? ''}
                            onChange={(e) => updateFilters({ tag: e.target.value || undefined })}
                            className="mt-1 h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-800"
                        >
                            <option value="">All tags</option>
                            {tags.map((tag) => (
                                <option key={tag.id} value={tag.slug}>{tag.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="author" className="text-xs font-semibold uppercase tracking-wide text-gray-500">Author</label>
                        <select
                            id="author"
                            value={filters.author ?? ''}
                            onChange={(e) => updateFilters({ author: e.target.value || undefined })}
                            className="mt-1 h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-800"
                        >
                            <option value="">All authors</option>
                            {authors.map((author) => (
                                <option key={author.id} value={String(author.id)}>{author.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="sort" className="text-xs font-semibold uppercase tracking-wide text-gray-500">Sort</label>
                        <select
                            id="sort"
                            value={filters.sort ?? 'latest'}
                            onChange={(e) => updateFilters({ sort: e.target.value || undefined })}
                            className="mt-1 h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-800"
                        >
                            <option value="latest">Latest</option>
                            <option value="popular">Most viewed</option>
                            <option value="oldest">Oldest</option>
                            <option value="title">A-Z</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="from_date" className="text-xs font-semibold uppercase tracking-wide text-gray-500">From</label>
                        <input
                            id="from_date"
                            type="date"
                            value={filters.from_date ?? ''}
                            onChange={(e) => updateFilters({ from_date: e.target.value || undefined })}
                            className="mt-1 h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-800"
                        />
                    </div>

                    <div>
                        <label htmlFor="to_date" className="text-xs font-semibold uppercase tracking-wide text-gray-500">To</label>
                        <input
                            id="to_date"
                            type="date"
                            value={filters.to_date ?? ''}
                            onChange={(e) => updateFilters({ to_date: e.target.value || undefined })}
                            className="mt-1 h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-800"
                        />
                    </div>
                </div>

                <div className="mb-5 flex flex-wrap gap-2">
                    {visibleTags.map((tag) => (
                        <button
                            key={tag.id}
                            onClick={() => updateFilters({ tag: tag.slug })}
                            className="rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 hover:border-red-500 hover:text-red-600 dark:border-gray-700 dark:text-gray-300"
                        >
                            #{tag.name}
                        </button>
                    ))}
                </div>

                {isLoading ? (
                    <div className={`${listMode ? 'space-y-4' : 'grid gap-5 md:grid-cols-2 lg:grid-cols-3'}`}>
                        {Array.from({ length: listMode ? 5 : 6 }).map((_, idx) => (
                            <SkeletonCard key={idx} listMode={listMode} />
                        ))}
                    </div>
                ) : (
                    <div className={`${listMode ? 'space-y-4' : 'grid gap-5 md:grid-cols-2 lg:grid-cols-3'}`}>
                        {articles.data.map((article) => (
                            <ArticleCard key={article.id} article={article} listMode={listMode} />
                        ))}
                    </div>
                )}

                <div className="mt-8 flex flex-wrap gap-2">
                    {articles.links.map((link, idx) => (
                        <Link
                            key={`${link.label}-${idx}`}
                            href={link.url ?? '#'}
                            className={`rounded-md px-3 py-1.5 text-sm ${link.active ? 'bg-red-600 text-white' : 'border border-gray-300 dark:border-gray-700'} ${!link.url ? 'pointer-events-none opacity-50' : ''}`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            </div>
        </PublicLayout>
    );
}
