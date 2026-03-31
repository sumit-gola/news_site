import { Head, Link, router } from '@inertiajs/react';
import React from 'react';
import PublicLayout from '@/layouts/public-layout';
import type { Article, Paginated, Tag } from '@/types';

type Props = {
    tag: Tag;
    articles: Paginated<Article>;
    filters: { sort?: string };
};

export default function TagPage({ tag, articles, filters = {} }: Props) {
    const selectedSort = typeof filters?.sort === 'string' ? filters.sort : 'latest';

    const updateFilters = (next: { sort?: string }) => {
        const merged = { ...filters, ...next } as Record<string, unknown>;
        const params = Object.fromEntries(
            Object.entries(merged).filter(([, v]) => typeof v === 'string' && v),
        ) as Record<string, string>;

        router.get(`/tag/${tag.slug}`, params, { preserveState: true, preserveScroll: true, replace: true });
    };

    return (
        <PublicLayout>
            <Head title={`${tag.name} — Tag`}>
                <meta name="description" content={`Read latest stories tagged with ${tag.name}.`} />
            </Head>

            <div className="mx-auto max-w-6xl px-4 py-8">

                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-red-600">Tag Archive</p>
                        <h1 className="text-3xl font-black tracking-tight">#{tag.name}</h1>
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
                    <div className="rounded-xl border border-dashed p-10 text-center text-sm text-gray-500">No articles under this tag yet.</div>
                ) : (
                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                        {articles.data.map((article, index) => (
                            <React.Fragment key={article.id}>
                            <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                                <Link href={`/news/${article.slug}`} className="block overflow-hidden rounded-lg">
                                    {article.featured_image_url ? (
                                        <img src={article.featured_image_url} alt={article.title} className="h-44 w-full object-cover" />
                                    ) : (
                                        <div className="flex h-44 w-full items-center justify-center bg-gray-100 text-4xl font-black text-gray-300 dark:bg-gray-800 dark:text-gray-600">
                                            {article.title[0]}
                                        </div>
                                    )}
                                </Link>
                                <h3 className="mt-3 line-clamp-2 text-lg font-bold leading-snug">
                                    <Link href={`/news/${article.slug}`} className="hover:text-red-600">{article.title}</Link>
                                </h3>
                                {article.excerpt && <p className="mt-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">{article.excerpt}</p>}
                                <div className="mt-3 text-xs text-gray-500">{article.author?.name ?? 'Staff'} · {new Date(article.updated_at).toLocaleDateString()}</div>
                            </article>
                            </React.Fragment>
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
