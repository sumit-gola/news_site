import { Head, Link, router } from '@inertiajs/react';
import { Search, Clock, Eye, X } from 'lucide-react';
import { useState } from 'react';
import PublicLayout from '@/layouts/public-layout';
import type { Article, Category, Paginated } from '@/types';

interface Props {
    results: Paginated<Article> | null;
    query: string;
    filters: { category?: string; sort?: string };
    categories: Category[];
    navCategories: Category[];
}

function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime();
    const d = Math.floor(diff / 86400000);
    if (d === 0) return 'Today';
    if (d === 1) return 'Yesterday';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function highlightText(text: string, keyword: string): string {
    if (!keyword.trim()) return text;
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'ig');
    return text.replace(regex, '<mark class="bg-yellow-200 text-gray-900 px-0.5 rounded">$1</mark>');
}

function ResultItem({ article, query }: { article: Article; query: string }) {
    const cat = article.categories?.[0];
    return (
        <Link
            href={`/news/${article.slug}`}
            className="group flex gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
        >
            <div className="size-24 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                {article.featured_image_url ? (
                    <img src={article.featured_image_url} alt={article.title} className="size-full object-cover transition group-hover:scale-105" />
                ) : (
                    <div
                        className="flex size-full items-center justify-center text-xl font-black"
                        style={{ backgroundColor: cat ? `${cat.color}18` : '#f3f4f6', color: cat ? `${cat.color}80` : '#d1d5db' }}
                    >
                        {article.title[0]}
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                {cat && (
                    <span
                        className="inline-block rounded px-2 py-0.5 text-xs font-semibold text-white"
                        style={{ backgroundColor: cat.color ?? '#6366f1' }}
                    >
                        {cat.name}
                    </span>
                )}
                <h3
                    className="mt-1 font-bold leading-snug transition group-hover:text-red-600 dark:group-hover:text-red-400"
                    dangerouslySetInnerHTML={{ __html: highlightText(article.title, query) }}
                />
                {article.excerpt && (
                    <p
                        className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400"
                        dangerouslySetInnerHTML={{ __html: highlightText(article.excerpt, query) }}
                    />
                )}
                <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                    {article.author && <span>{article.author.name}</span>}
                    {article.published_at && (
                        <>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                                <Clock className="size-3" />
                                {timeAgo(article.published_at)}
                            </span>
                        </>
                    )}
                    <span className="flex items-center gap-1">
                        <Eye className="size-3" />
                        {article.views.toLocaleString()}
                    </span>
                </div>
            </div>
        </Link>
    );
}

function Pagination({ data, query }: { data: Paginated<Article>; query: string }) {
    if (data.last_page <= 1) return null;

    return (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {data.links.map((link, i) => {
                if (!link.url) {
                    return (
                        <span key={i} className="px-3 py-2 text-sm text-gray-400" dangerouslySetInnerHTML={{ __html: link.label }} />
                    );
                }
                return (
                    <Link
                        key={i}
                        href={link.url}
                        className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                            link.active
                                ? 'bg-red-600 text-white'
                                : 'border border-gray-200 text-gray-600 hover:border-red-400 hover:text-red-600 dark:border-gray-700 dark:text-gray-400'
                        }`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                );
            })}
        </div>
    );
}

export default function SearchPage({ results, query: initialQuery, filters, categories, navCategories }: Props) {
    const [q, setQ] = useState(initialQuery);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (q.trim()) {
            router.get('/search', { q: q.trim(), ...filters });
        }
    };

    const clearSearch = () => {
        setQ('');
        router.get('/search');
    };

    const updateFilters = (next: { category?: string; sort?: string }) => {
        router.get('/search', { q: initialQuery || undefined, ...filters, ...next }, { preserveState: true, preserveScroll: true, replace: true });
    };

    return (
        <PublicLayout navCategories={navCategories}>
            <Head title={initialQuery ? `"${initialQuery}" — Search` : 'Search — NewsPortal'} />

            <div className="mx-auto max-w-4xl px-4 py-10">
                {/* Big search bar */}
                <form onSubmit={handleSearch} className="relative">
                    <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search articles, topics, tags…"
                        autoFocus
                        className="w-full rounded-2xl border-2 border-gray-200 bg-white py-4 pl-12 pr-12 text-lg outline-none focus:border-red-500 dark:border-gray-700 dark:bg-gray-900"
                    />
                    {q && (
                        <button
                            type="button"
                            onClick={clearSearch}
                            className="absolute right-14 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 transition hover:text-gray-600"
                        >
                            <X className="size-4" />
                        </button>
                    )}
                    <button
                        type="submit"
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
                    >
                        Search
                    </button>
                </form>

                {/* Results summary */}
                {initialQuery && results && (
                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                        {results.total > 0 ? (
                            <>Found <strong className="text-gray-900 dark:text-white">{results.total}</strong> result{results.total !== 1 ? 's' : ''} for <strong className="text-gray-900 dark:text-white">"{initialQuery}"</strong></>
                        ) : (
                            <>No results for <strong className="text-gray-900 dark:text-white">"{initialQuery}"</strong></>
                        )}
                    </p>
                )}

                {initialQuery && (
                    <div className="mt-4 grid gap-3 rounded-xl border border-gray-200 bg-white p-4 md:grid-cols-2 dark:border-gray-800 dark:bg-gray-900">
                        <div>
                            <label htmlFor="category" className="text-xs font-semibold uppercase tracking-wide text-gray-500">Category</label>
                            <select
                                id="category"
                                value={filters.category ?? ''}
                                onChange={(e) => updateFilters({ category: e.target.value || undefined })}
                                className="mt-1 h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-800"
                            >
                                <option value="">All categories</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.slug}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="sort" className="text-xs font-semibold uppercase tracking-wide text-gray-500">Sort</label>
                            <select
                                id="sort"
                                value={filters.sort ?? 'latest'}
                                onChange={(e) => updateFilters({ sort: e.target.value })}
                                className="mt-1 h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-800"
                            >
                                <option value="latest">Latest</option>
                                <option value="popular">Most viewed</option>
                                <option value="oldest">Oldest</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* Results list */}
                <div className="mt-6 space-y-4">
                    {results?.data.map((article) => (
                        <ResultItem key={article.id} article={article} query={initialQuery} />
                    ))}
                </div>

                {results && <Pagination data={results} query={initialQuery} />}

                {/* Empty / initial state */}
                {!initialQuery && (
                    <div className="mt-16 text-center text-gray-400">
                        <Search className="mx-auto mb-3 size-12 opacity-20" />
                        <p className="font-medium">Enter a keyword to search news articles.</p>
                        <p className="mt-1 text-sm">Try: politics, sports, technology…</p>
                    </div>
                )}

                {initialQuery && results?.data.length === 0 && (
                    <div className="mt-16 text-center text-gray-400">
                        <Search className="mx-auto mb-3 size-12 opacity-20" />
                        <p className="font-medium">No articles match your search.</p>
                        <p className="mt-1 text-sm">Try different keywords or browse categories below.</p>
                        <div className="mt-4 flex flex-wrap justify-center gap-2">
                            {navCategories.map((cat) => (
                                <Link
                                    key={cat.id}
                                    href={`/category/${cat.slug}`}
                                    className="rounded-full px-3 py-1 text-sm font-medium text-white"
                                    style={{ backgroundColor: cat.color ?? '#6366f1' }}
                                >
                                    {cat.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}
