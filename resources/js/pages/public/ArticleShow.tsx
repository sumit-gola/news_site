import { Head, Link, usePage } from '@inertiajs/react';
import { Clock, Eye, Calendar, User, Tag, Share2, Link2, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import CommentSection, { type CommentItem } from '@/components/comments/CommentSection';
import PublicLayout from '@/layouts/public-layout';
import type { Article, Category } from '@/types';

interface Props {
    article: Article;
    related: Article[];
    trending: Article[];
    comments: CommentItem[];
    commentsCount: number;
}

function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function CategoryBadge({ category }: { category: Category }) {
    return (
        <Link
            href={`/category/${category.slug}`}
            className="inline-block rounded px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-white transition hover:opacity-80"
            style={{ backgroundColor: category.color ?? '#6366f1' }}
        >
            {category.name}
        </Link>
    );
}

function RelatedCard({ article }: { article: Article }) {
    const cat = article.categories?.[0];
    return (
        <Link href={`/news/${article.slug}`} className="group block">
            <div className="overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                {article.featured_image_url ? (
                    <img src={article.featured_image_url} alt={article.title} className="h-36 w-full object-cover transition duration-300 group-hover:scale-105" />
                ) : (
                    <div className="flex h-36 items-center justify-center" style={{ backgroundColor: cat ? `${cat.color}18` : '#f3f4f6' }}>
                        <span className="text-3xl font-black text-gray-300">{article.title[0]}</span>
                    </div>
                )}
            </div>
            {cat && <div className="mt-2"><CategoryBadge category={cat} /></div>}
            <h4 className="mt-1.5 line-clamp-2 text-sm font-semibold leading-snug transition group-hover:text-red-600 dark:group-hover:text-red-400">
                {article.title}
            </h4>
            {article.published_at && (
                <p className="mt-1 text-xs text-gray-400">{timeAgo(article.published_at)}</p>
            )}
        </Link>
    );
}

function ShareButtons({ title, url }: { title: string; url: string }) {
    const [copied, setCopied] = useState(false);

    const copyLink = () => {
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const fbUrl   = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    const twUrl   = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;

    return (
        <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-400">
                <Share2 className="size-4" />
                Share
            </span>
            <a
                href={fbUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex size-8 items-center justify-center rounded-full bg-[#1877f2] text-white transition hover:opacity-80"
            >
                <svg className="size-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M22 12a10 10 0 1 0-11.563 9.875v-6.988H7.9V12h2.537V9.797c0-2.506 1.493-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.887h-2.33V21.875A10.005 10.005 0 0 0 22 12z" />
                </svg>
            </a>
            <a
                href={twUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex size-8 items-center justify-center rounded-full bg-[#1da1f2] text-white transition hover:opacity-80"
            >
                <svg className="size-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
            </a>
            <button
                onClick={copyLink}
                className="flex size-8 items-center justify-center rounded-full bg-gray-200 text-gray-700 transition hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                title="Copy link"
            >
                <Link2 className="size-4" />
            </button>
            {copied && <span className="text-xs text-green-600 dark:text-green-400">Copied!</span>}
        </div>
    );
}

export default function ArticleShow({ article, related, trending, comments, commentsCount }: Props) {
    const { navCategories } = usePage<{ navCategories: Category[] }>().props;
    const pageUrl   = typeof window !== 'undefined' ? window.location.href : '';
    const readTime  = article.meta?.read_time ?? Math.max(1, Math.ceil(article.content.split(' ').length / 200));
    const wordCount = article.meta?.word_count ?? article.content.split(' ').length;
    const primaryCategoryId = article.categories?.[0]?.id;
    const bookmarkKey = `bookmark:${article.id}`;
    const [bookmarked, setBookmarked] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        return localStorage.getItem(bookmarkKey) === '1';
    });

    const toggleBookmark = () => {
        const next = !bookmarked;
        setBookmarked(next);
        if (typeof window !== 'undefined') {
            localStorage.setItem(bookmarkKey, next ? '1' : '0');
        }
    };

    return (
        <PublicLayout>
            <Head title={article.meta?.meta_title ?? article.title}>
                {article.meta?.meta_description ? (
                    <meta name="description" content={article.meta.meta_description} />
                ) : undefined}
                {article.meta?.meta_keywords ? (
                    <meta name="keywords" content={article.meta.meta_keywords} />
                ) : undefined}
                {article.meta?.canonical_url ? (
                    <link rel="canonical" href={article.meta.canonical_url} />
                ) : undefined}
                {/* Open Graph */}
                <meta property="og:title" content={article.meta?.meta_title ?? article.title} />
                {article.meta?.meta_description ? (
                    <meta property="og:description" content={article.meta.meta_description} />
                ) : undefined}
                {(article.meta?.og_image ?? article.featured_image_url) ? (
                    <meta property="og:image" content={(article.meta?.og_image ?? article.featured_image_url) as string} />
                ) : undefined}
                <meta property="og:type" content="article" />
                {article.published_at ? (
                    <meta property="article:published_time" content={article.published_at} />
                ) : undefined}
            </Head>

            <div className="mx-auto max-w-7xl px-4 py-8">
                <div className="grid gap-10 lg:grid-cols-3">
                    {/* ── Main content ────────────────────────────────────── */}
                    <article className="lg:col-span-2">
                        {/* Breadcrumb */}
                        <div className="mb-4 flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                            <Link href="/" className="transition hover:text-red-600">Home</Link>
                            {article.categories?.[0] && (
                                <>
                                    <span>/</span>
                                    <Link href={`/category/${article.categories[0].slug}`} className="transition hover:text-red-600">
                                        {article.categories[0].name}
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Categories */}
                        {article.categories && article.categories.length > 0 && (
                            <div className="mb-3 flex flex-wrap gap-2">
                                {article.categories.map((cat) => (
                                    <CategoryBadge key={cat.id} category={cat} />
                                ))}
                            </div>
                        )}

                        {/* Featured Image — above heading */}
                        {article.featured_image_url && (
                            <div className="mb-5 overflow-hidden rounded-xl">
                                <img
                                    src={article.featured_image_url}
                                    alt={article.title}
                                    className="w-full object-cover"
                                />
                            </div>
                        )}

                        {/* Title */}
                        <h1 className="text-2xl font-black leading-tight text-gray-900 dark:text-white md:text-4xl md:leading-tight">
                            {article.title}
                        </h1>

                        {/* Excerpt */}
                        {article.excerpt && (
                            <p className="mt-3 text-lg text-gray-600 dark:text-gray-400">{article.excerpt}</p>
                        )}

                        {/* Meta */}
                        <div className="mt-4 flex flex-wrap items-center gap-4 border-b border-gray-200 pb-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                            {article.author && (
                                <span className="flex items-center gap-1.5">
                                    <User className="size-4" />
                                    <strong className="text-gray-700 dark:text-gray-300">{article.author.name}</strong>
                                </span>
                            )}
                            {article.published_at && (
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="size-4" />
                                    {new Date(article.published_at).toLocaleDateString('en-US', {
                                        month: 'long', day: 'numeric', year: 'numeric',
                                    })}
                                </span>
                            )}
                            <span className="flex items-center gap-1.5">
                                <Clock className="size-4" />
                                {readTime} min read · {wordCount.toLocaleString()} words
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Eye className="size-4" />
                                {article.views.toLocaleString()} views
                            </span>
                        </div>

                        {/* Share (top) */}
                        <div className="mt-4">
                            <ShareButtons title={article.title} url={pageUrl} />
                            <button
                                onClick={toggleBookmark}
                                className={`mt-3 rounded-full px-3 py-1.5 text-xs font-semibold transition ${bookmarked ? 'bg-red-600 text-white' : 'border border-gray-300 text-gray-600 hover:border-red-400 hover:text-red-600 dark:border-gray-700 dark:text-gray-300'}`}
                            >
                                {bookmarked ? 'Bookmarked' : 'Save Article'}
                            </button>
                        </div>

                        {/* Content */}
                        <div
                            className="article-content mt-6"
                            dangerouslySetInnerHTML={{ __html: article.content }}
                        />



                        {/* Tags */}
                        {article.tags && article.tags.length > 0 && (
                            <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-gray-200 pt-6 dark:border-gray-700">
                                <Tag className="size-4 text-gray-400" />
                                {article.tags.map((tag) => (
                                    <Link
                                        key={tag.id}
                                        href={`/tag/${tag.slug}`}
                                        className="rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 transition hover:border-red-400 hover:text-red-600 dark:border-gray-700 dark:text-gray-400 dark:hover:border-red-500 dark:hover:text-red-400"
                                    >
                                        {tag.name}
                                    </Link>
                                ))}
                            </div>
                        )}

                        {/* Share (bottom) */}
                        <div className="mt-6 border-t border-gray-200 pt-6 dark:border-gray-700">
                            <ShareButtons title={article.title} url={pageUrl} />
                        </div>

                        {/* Author Card */}
                        {article.author && (
                            <div className="mt-8 flex items-start gap-4 rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-800/50">
                                <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-red-100 text-xl font-bold text-red-600 dark:bg-red-900/30 dark:text-red-400">
                                    {article.author.name[0]}
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Written by</p>
                                    <p className="mt-0.5 font-bold text-gray-900 dark:text-white">{article.author.name}</p>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Staff Reporter</p>
                                    {article.author_slug && (
                                        <Link href={`/author/${article.author_slug}`} className="mt-2 inline-block text-xs font-semibold text-red-600 hover:underline dark:text-red-400">
                                            View Author Page
                                        </Link>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Back link */}
                        <Link href="/" className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 transition hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400">
                            <ArrowLeft className="size-4" />
                            Back to Home
                        </Link>

                        {/* Comments */}
                        <CommentSection
                            articleSlug={article.slug}
                            comments={comments}
                            commentsCount={commentsCount}
                        />
                    </article>

                    {/* ── Sidebar ──────────────────────────────────────────── */}
                    <aside className="space-y-8 lg:sticky lg:top-28 lg:self-start">

                        {/* Related articles */}
                        {related.length > 0 && (
                            <div>
                                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide">
                                    <div className="h-4 w-1 rounded-full bg-red-600" />
                                    Related Articles
                                </h3>
                                <div className="space-y-5">
                                    {related.map((a) => (
                                        <RelatedCard key={a.id} article={a} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {trending.length > 0 && (
                            <div>
                                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide">
                                    <div className="h-4 w-1 rounded-full bg-red-600" />
                                    Trending Now
                                </h3>
                                <div className="space-y-2 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                                    {trending.map((item, index) => (
                                        <Link key={item.id} href={`/news/${item.slug}`} className="group flex gap-3 rounded-md p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <span className="mt-0.5 text-xs font-black text-red-500">{index + 1}</span>
                                            <span className="line-clamp-2 text-sm font-medium group-hover:text-red-600 dark:group-hover:text-red-400">{item.title}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Categories nav */}
                        {navCategories.length > 0 && (
                            <div>
                                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide">
                                    <div className="h-4 w-1 rounded-full bg-red-600" />
                                    Browse Categories
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {navCategories.map((cat) => (
                                        <Link
                                            key={cat.id}
                                            href={`/category/${cat.slug}`}
                                            className="rounded-full px-3 py-1 text-sm font-medium text-white transition hover:opacity-80"
                                            style={{ backgroundColor: cat.color ?? '#6366f1' }}
                                        >
                                            {cat.name}
                                        </Link>
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
