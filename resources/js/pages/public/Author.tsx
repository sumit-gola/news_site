import { Head, Link, router } from '@inertiajs/react';
import PublicLayout from '@/layouts/public-layout';
import type { Article, Paginated } from '@/types';

type AuthorData = {
    id: number;
    name: string;
    slug: string;
    bio?: string;
};

type Props = {
    author: AuthorData;
    articles: Paginated<Article>;
    filters: { sort?: string };
};

export default function AuthorPage({ author, articles, filters = {} }: Props) {
    const selectedSort = typeof filters?.sort === 'string' ? filters.sort : 'latest';

    const updateFilters = (next: { sort?: string }) => {
        const params: Record<string, string> = {};
        const merged = { ...filters, ...next };
        if (merged.sort) params.sort = merged.sort;
        router.get(`/author/${author.slug}`, params, { preserveState: true, preserveScroll: true, replace: true });
    };

    return (
        <PublicLayout>
            <Head title={`${author.name} — Author`}>
                <meta name="description" content={`Read articles written by ${author.name}.`} />
            </Head>

            <div className="mx-auto max-w-6xl px-4 py-8">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                    <div className="flex items-center gap-4">
                        <div className="flex size-16 items-center justify-center rounded-full bg-red-100 text-2xl font-black text-red-600 dark:bg-red-900/30 dark:text-red-400">
                            {author.name[0]}
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-red-600">Author</p>
                            <h1 className="text-2xl font-black">{author.name}</h1>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{author.bio ?? 'Contributing journalist at NewsPortal.'}</p>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="sort" className="mr-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Sort</label>
                        <select
                            id="sort"
                            value={selectedSort}
                            onChange={(e) => updateFilters({ sort: e.target.value })}
                            className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-800"
                        >
                            <option value="latest">Latest</option>
                            <option value="popular">Most viewed</option>
                            <option value="oldest">Oldest</option>
                        </select>
                    </div>
                </div>

                {articles.data.length === 0 ? (
                    <div className="rounded-xl border border-dashed p-10 text-center text-sm text-gray-500">No published articles by this author yet.</div>
                ) : (
                    <div className="space-y-4">
                        {articles.data.map((article) => (
                            <article key={article.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                                <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                                    <Link href={`/news/${article.slug}`} className="overflow-hidden rounded-lg">
                                        {article.featured_image_url ? (
                                            <img src={article.featured_image_url} alt={article.title} className="h-36 w-full object-cover" />
                                        ) : (
                                            <div className="flex h-36 items-center justify-center bg-gray-100 text-4xl font-black text-gray-300 dark:bg-gray-800 dark:text-gray-600">{article.title[0]}</div>
                                        )}
                                    </Link>
                                    <div>
                                        <h3 className="text-xl font-bold leading-snug">
                                            <Link href={`/news/${article.slug}`} className="hover:text-red-600">{article.title}</Link>
                                        </h3>
                                        {article.excerpt && <p className="mt-2 line-clamp-3 text-sm text-gray-600 dark:text-gray-300">{article.excerpt}</p>}
                                        <p className="mt-3 text-xs text-gray-500">{new Date(article.updated_at).toLocaleDateString()} · {article.views.toLocaleString()} views</p>
                                    </div>
                                </div>
                            </article>
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
