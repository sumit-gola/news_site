import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Calendar, Eye, Facebook, Link2, Share2, Twitter } from 'lucide-react';
import { useState } from 'react';

import PublicLayout from '@/layouts/public-layout';
import type { Category, Page } from '@/types';

interface Props {
    page: Page;
    related: Page[];
}

function ShareButtons({ title, url }: { title: string; url: string }) {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
    };
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    const twUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
    return (
        <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-400">
                <Share2 className="size-4" /> Share
            </span>
            <a href={fbUrl} target="_blank" rel="noopener noreferrer" className="flex size-8 items-center justify-center rounded-full bg-[#1877f2] text-white transition hover:opacity-80">
                <Facebook className="size-4" />
            </a>
            <a href={twUrl} target="_blank" rel="noopener noreferrer" className="flex size-8 items-center justify-center rounded-full bg-[#1da1f2] text-white transition hover:opacity-80">
                <Twitter className="size-4" />
            </a>
            <button onClick={copy} className="flex size-8 items-center justify-center rounded-full bg-gray-200 text-gray-700 transition hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300" title="Copy link">
                <Link2 className="size-4" />
            </button>
            {copied && <span className="text-xs text-green-600 dark:text-green-400">Copied!</span>}
        </div>
    );
}

function RelatedCard({ page }: { page: Page }) {
    return (
        <Link href={`/page/${page.slug}`} className="group flex gap-3">
            {page.featured_image_url ? (
                <img src={page.featured_image_url} alt={page.title} className="h-16 w-24 shrink-0 rounded-lg object-cover" />
            ) : (
                <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                    <span className="text-xl font-black text-gray-300">{page.title[0]}</span>
                </div>
            )}
            <div className="min-w-0">
                <h4 className="line-clamp-2 text-sm font-semibold leading-snug group-hover:text-red-600 dark:group-hover:text-red-400">
                    {page.title}
                </h4>
                {page.published_at && (
                    <p className="mt-1 text-xs text-gray-400">
                        {new Date(page.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                )}
            </div>
        </Link>
    );
}

export default function PageShow({ page, related }: Props) {
    const { navCategories } = usePage<{ navCategories: Category[] }>().props;
    const pageUrl = typeof window !== 'undefined' ? window.location.href : '';

    const seo = page.seo_meta;
    const metaTitle       = seo?.meta_title || page.title;
    const metaDescription = seo?.meta_description || page.excerpt || '';
    const metaOgImage     = seo?.og_image || page.featured_image_url || '';
    const canonical       = seo?.canonical_url || pageUrl;

    return (
        <PublicLayout>
            <Head title={metaTitle}>
                {metaDescription && <meta name="description" content={metaDescription} />}
                {seo?.meta_keywords && <meta name="keywords" content={seo.meta_keywords} />}
                {page.noindex && <meta name="robots" content="noindex,nofollow" />}
                {canonical && <link rel="canonical" href={canonical} />}
                {/* Open Graph */}
                <meta property="og:title" content={metaTitle} />
                <meta property="og:type" content="website" />
                {metaDescription && <meta property="og:description" content={metaDescription} />}
                {metaOgImage && <meta property="og:image" content={metaOgImage} />}
                {page.published_at && <meta property="article:published_time" content={page.published_at} />}
            </Head>

            {/* Hero image */}
            {page.featured_image_url && (
                <div className="h-64 w-full overflow-hidden bg-gray-200 dark:bg-gray-800 md:h-80">
                    <img src={page.featured_image_url} alt={page.title} className="size-full object-cover" />
                </div>
            )}

            <div className="mx-auto max-w-7xl px-4 py-8">

                <div className={`grid gap-10 ${related.length > 0 || navCategories.length > 0 ? 'lg:grid-cols-3' : ''}`}>

                    {/* ── Main content ── */}
                    <article className={related.length > 0 || navCategories.length > 0 ? 'lg:col-span-2' : 'mx-auto max-w-3xl'}>

                        {/* Breadcrumb */}
                        <div className="mb-4 flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                            <Link href="/" className="transition hover:text-red-600">Home</Link>
                            {page.category && (
                                <>
                                    <span>/</span>
                                    <Link href={`/category/${page.category.slug}`} className="transition hover:text-red-600">
                                        {page.category.name}
                                    </Link>
                                </>
                            )}
                            <span>/</span>
                            <span className="text-gray-700 dark:text-gray-300">{page.title}</span>
                        </div>

                        {/* Category badge */}
                        {page.category && (
                            <div className="mb-3">
                                <Link
                                    href={`/category/${page.category.slug}`}
                                    className="inline-block rounded px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-white transition hover:opacity-80"
                                    style={{ backgroundColor: page.category.color ?? '#6366f1' }}
                                >
                                    {page.category.name}
                                </Link>
                            </div>
                        )}

                        {/* Title */}
                        <h1 className="text-2xl font-black leading-tight text-gray-900 dark:text-white md:text-4xl">
                            {page.title}
                        </h1>

                        {/* Excerpt */}
                        {page.excerpt && (
                            <p className="mt-3 text-lg text-gray-600 dark:text-gray-400">{page.excerpt}</p>
                        )}

                        {/* Meta row */}
                        <div className="mt-4 flex flex-wrap items-center gap-4 border-b border-gray-200 pb-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                            {page.author && (
                                <span className="font-medium text-gray-700 dark:text-gray-300">{page.author.name}</span>
                            )}
                            {page.published_at && (
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="size-4" />
                                    {new Date(page.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                </span>
                            )}
                            <span className="flex items-center gap-1.5">
                                <Eye className="size-4" /> {page.views.toLocaleString()} views
                            </span>
                        </div>

                        {/* Share */}
                        <div className="mt-4">
                            <ShareButtons title={page.title} url={pageUrl} />
                        </div>

                        {/* Page content */}
                        <div
                            className="article-content prose prose-gray dark:prose-invert mt-6 max-w-none"
                            dangerouslySetInnerHTML={{ __html: page.content ?? '' }}
                        />

                        {/* Share (bottom) */}
                        <div className="mt-8 border-t border-gray-200 pt-6 dark:border-gray-700">
                            <ShareButtons title={page.title} url={pageUrl} />
                        </div>

                        {/* Back link */}
                        <Link href="/" className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 transition hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400">
                            <ArrowLeft className="size-4" /> Back to Home
                        </Link>

                    </article>

                    {/* ── Sidebar ── */}
                    {(related.length > 0 || navCategories.length > 0) && (
                        <aside className="space-y-8 lg:sticky lg:top-28 lg:self-start">
                            {/* Related pages */}
                            {related.length > 0 && (
                                <div>
                                    <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide">
                                        <div className="h-4 w-1 rounded-full bg-red-600" />
                                        Related Pages
                                    </h3>
                                    <div className="space-y-4">
                                        {related.map((p) => (
                                            <RelatedCard key={p.id} page={p} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Browse categories */}
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
                    )}
                </div>
            </div>
        </PublicLayout>
    );
}
