import { Head, Link, router } from '@inertiajs/react';
import { Search } from 'lucide-react';
import PublicLayout from '@/layouts/public-layout';
import type { Article, Category, Paginated, Tag } from '@/types';

type Filters = {
    q?: string;
    category?: string;
    tag?: string;
};

type Props = {
    articles: Paginated<Article>;
    filters: Filters;
    categories: Category[];
    tags: Tag[];
    navCategories: Category[];
};

function ArticleCard({ article }: { article: Article }) {
    const primaryCategory = article.categories?.[0];

    return (
        <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <Link href={`/news/${article.slug}`} className="block overflow-hidden rounded-lg">
                {article.featured_image_url ? (
                    <img src={article.featured_image_url} alt={article.title} className="h-52 w-full object-cover transition hover:scale-[1.02]" />
                ) : (
                    <div className="flex h-52 w-full items-center justify-center bg-gray-100 text-4xl font-black text-gray-300 dark:bg-gray-800 dark:text-gray-600">
                        {article.title[0]}
                    </div>
                )}
            </Link>

            <div className="mt-4 flex items-center gap-2">
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
                <h3 className="mt-2 line-clamp-2 text-lg font-bold leading-snug hover:text-red-600 dark:hover:text-red-400">{article.title}</h3>
            </Link>

            {article.excerpt && (
                <p className="mt-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">{article.excerpt}</p>
            )}

            <div className="text-muted-foreground mt-3 flex items-center justify-between text-xs">
                <span>{article.author?.name ?? 'Staff'}</span>
                <span>{article.views.toLocaleString()} views</span>
            </div>
        </article>
    );
}

export default function NewsIndex({ articles, filters, categories, tags, navCategories }: Props) {
    const updateFilters = (next: Partial<Filters>) => {
        router.get('/news', { ...filters, ...next }, { preserveState: true, preserveScroll: true, replace: true });
    };

    return (
        <PublicLayout navCategories={navCategories}>
            <Head title="Latest News" />

            <div className="mx-auto max-w-7xl px-4 py-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-black tracking-tight">Latest News</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Explore stories by topic, category, and trending tags.</p>
                </div>

                <div className="mb-6 grid gap-3 rounded-xl border border-gray-200 bg-white p-4 md:grid-cols-4 dark:border-gray-800 dark:bg-gray-900">
                    <div className="md:col-span-2">
                        <label htmlFor="q" className="text-xs font-semibold uppercase tracking-wide text-gray-500">Search</label>
                        <div className="relative mt-1">
                            <Search className="absolute left-2.5 top-2.5 size-4 text-gray-400" />
                            <input
                                id="q"
                                defaultValue={filters.q ?? ''}
                                className="h-9 w-full rounded-md border border-gray-300 bg-white pl-8 pr-3 text-sm dark:border-gray-700 dark:bg-gray-800"
                                placeholder="Headline, keyword, tag..."
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        updateFilters({ q: (e.target as HTMLInputElement).value || undefined });
                                    }
                                }}
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
                </div>

                <div className="mb-5 flex flex-wrap gap-2">
                    {tags.slice(0, 12).map((tag) => (
                        <button
                            key={tag.id}
                            onClick={() => updateFilters({ tag: tag.slug })}
                            className="rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 hover:border-red-500 hover:text-red-600 dark:border-gray-700 dark:text-gray-300"
                        >
                            #{tag.name}
                        </button>
                    ))}
                </div>

                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {articles.data.map((article) => (
                        <ArticleCard key={article.id} article={article} />
                    ))}
                </div>

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
