import { Head, Link } from '@inertiajs/react';
import { Clock, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import PublicLayout from '@/layouts/public-layout';
import type { Article, Category, Paginated } from '@/types';

interface Props {
    category: Category & { parent?: Category | null; children?: Category[] };
    articles: Paginated<Article>;
    navCategories: Category[];
}

function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime();
    const d = Math.floor(diff / 86400000);
    if (d === 0) return 'Today';
    if (d === 1) return 'Yesterday';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function ArticleCard({ article }: { article: Article }) {
    const cat = article.categories?.[0];
    return (
        <Link href={`/news/${article.slug}`} className="group block overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
            {article.featured_image_url ? (
                <img
                    src={article.featured_image_url}
                    alt={article.title}
                    className="h-48 w-full object-cover transition duration-300 group-hover:scale-105"
                />
            ) : (
                <div
                    className="flex h-48 items-center justify-center"
                    style={{ backgroundColor: cat ? `${cat.color}15` : '#f9fafb' }}
                >
                    <span className="text-4xl font-black" style={{ color: cat ? `${cat.color}60` : '#d1d5db' }}>
                        {article.title[0]}
                    </span>
                </div>
            )}
            <div className="p-4">
                {cat && (
                    <span
                        className="inline-block rounded px-2 py-0.5 text-xs font-semibold text-white"
                        style={{ backgroundColor: cat.color ?? '#6366f1' }}
                    >
                        {cat.name}
                    </span>
                )}
                <h3 className="mt-2 line-clamp-2 font-bold leading-snug transition group-hover:text-red-600 dark:group-hover:text-red-400">
                    {article.title}
                </h3>
                {article.excerpt && (
                    <p className="mt-1.5 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">{article.excerpt}</p>
                )}
                <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
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

function Pagination({ data }: { data: Paginated<Article> }) {
    if (data.last_page <= 1) return null;

    return (
        <div className="mt-10 flex items-center justify-center gap-2">
            {data.links.map((link, i) => {
                const isFirst = i === 0;
                const isLast  = i === data.links.length - 1;

                if (!link.url) {
                    return (
                        <span key={i} className="flex size-9 items-center justify-center rounded-lg text-sm text-gray-400">
                            {isFirst ? <ChevronLeft className="size-4" /> : isLast ? <ChevronRight className="size-4" /> : '...'}
                        </span>
                    );
                }

                return (
                    <Link
                        key={i}
                        href={link.url}
                        className={`flex size-9 items-center justify-center rounded-lg text-sm font-medium transition ${
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

export default function CategoryPage({ category, articles, navCategories }: Props) {
    return (
        <PublicLayout navCategories={navCategories}>
            <Head>
                <title>{category.name} — NewsPortal</title>
                {category.description && <meta name="description" content={category.description} />}
            </Head>

            {/* Category Hero */}
            <div
                className="border-b py-10"
                style={{
                    background: `linear-gradient(135deg, ${category.color ?? '#6366f1'}18 0%, transparent 60%)`,
                    borderColor: `${category.color ?? '#6366f1'}30`,
                }}
            >
                <div className="mx-auto max-w-7xl px-4">
                    {/* Breadcrumb */}
                    <div className="mb-3 flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                        <Link href="/" className="transition hover:text-red-600">Home</Link>
                        {category.parent && (
                            <>
                                <span>/</span>
                                <Link href={`/category/${category.parent.slug}`} className="transition hover:text-red-600">
                                    {category.parent.name}
                                </Link>
                            </>
                        )}
                        <span>/</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">{category.name}</span>
                    </div>

                    <div className="flex items-start gap-4">
                        <div
                            className="flex size-14 shrink-0 items-center justify-center rounded-xl text-2xl text-white"
                            style={{ backgroundColor: category.color ?? '#6366f1' }}
                        >
                            {category.icon ? (
                                <span>{category.icon}</span>
                            ) : (
                                <span className="font-black">{category.name[0]}</span>
                            )}
                        </div>
                        <div>
                            <h1 className="text-3xl font-black">{category.name}</h1>
                            {category.description && (
                                <p className="mt-1 max-w-2xl text-gray-600 dark:text-gray-400">{category.description}</p>
                            )}
                            <p className="mt-2 text-sm text-gray-400">
                                {articles.total.toLocaleString()} article{articles.total !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>

                    {/* Sub-categories */}
                    {category.children && category.children.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {category.children.map((child) => (
                                <Link
                                    key={child.id}
                                    href={`/category/${child.slug}`}
                                    className="rounded-full border px-3 py-1 text-sm font-medium transition hover:text-white"
                                    style={{
                                        borderColor: category.color ?? '#6366f1',
                                        color: category.color ?? '#6366f1',
                                    }}
                                    onMouseEnter={(e) => {
                                        (e.currentTarget as HTMLAnchorElement).style.backgroundColor = category.color ?? '#6366f1';
                                    }}
                                    onMouseLeave={(e) => {
                                        (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'transparent';
                                    }}
                                >
                                    {child.name}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Articles Grid */}
            <div className="mx-auto max-w-7xl px-4 py-8">
                {articles.data.length > 0 ? (
                    <>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {articles.data.map((article) => (
                                <ArticleCard key={article.id} article={article} />
                            ))}
                        </div>
                        <Pagination data={articles} />
                    </>
                ) : (
                    <div className="py-20 text-center text-gray-400">
                        <div
                            className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full text-2xl"
                            style={{ backgroundColor: `${category.color ?? '#6366f1'}18`, color: category.color ?? '#6366f1' }}
                        >
                            {category.icon ?? category.name[0]}
                        </div>
                        <p className="font-medium">No articles in this category yet.</p>
                        <Link href="/" className="mt-2 inline-block text-sm text-red-600 hover:underline">
                            Browse other news →
                        </Link>
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}
