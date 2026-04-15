import { Link, usePage } from '@inertiajs/react';
import { Newspaper, Home, List, Search, UserCircle } from 'lucide-react';
import { type ReactNode } from 'react';
import AdSlot from '@/components/ads/AdSlot';
import type { AdPage, Auth, Category } from '@/types';
import PublicHeader from '@/components/public/PublicHeader';

interface Props {
    children: ReactNode;
}

/** Derive the ad page type from the current URL path. */
function useAdPage(): AdPage {
    const { url } = usePage();
    if (url === '/' || url.startsWith('/?')) return 'home';
    if (url.startsWith('/news/') || url.startsWith('/article')) return 'article';
    if (url.startsWith('/category')) return 'category';
    if (url.startsWith('/search')) return 'search';
    if (url.startsWith('/tag')) return 'tag';
    if (url.startsWith('/news')) return 'news';
    if (url.startsWith('/page') || url.startsWith('/about') || url.startsWith('/contact') || url.startsWith('/privacy')) return 'page';
    return 'home';
}

export default function PublicLayout({ children }: Props) {
    const { auth, navCategories } = usePage<{ auth: Auth; navCategories: Category[] }>().props;
    const categories: Category[] = navCategories ?? [];
    const adPage = useAdPage();

    return (
        <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
            {/* ── Header ───────────────────────────────────────────────────── */}
            <PublicHeader navCategories={categories} />

            {/* ── Below Nav Ad ─────────────────────────────────────────────── */}
            <AdSlot position="below_nav" page={adPage} className="mx-auto max-w-7xl px-4 py-2" />

            {/* ── Sticky Top Ad ────────────────────────────────────────────── */}
            <div className="sticky top-0 z-40">
                <AdSlot position="sticky_top" page={adPage} className="mx-auto max-w-7xl" />
            </div>

            {/* ── Notification Bar Ad ──────────────────────────────────────── */}
            <AdSlot position="notification_bar" page={adPage} className="mx-auto max-w-7xl px-4" />

            {/* ── Left Sidebar Ads (fixed left) ─────────────────────────── */}
            <div className="fixed left-0 top-1/4 z-30 hidden w-40 space-y-4 xl:block">
                <AdSlot position="left_sidebar_top" page={adPage} />
                <AdSlot position="left_sidebar_bottom" page={adPage} />
            </div>

            {/* ── Page Content ─────────────────────────────────────────────── */}
            <main>{children}</main>

            {/* ── Footer ───────────────────────────────────────────────────── */}
            <footer className="mt-16 border-t border-gray-200 bg-gray-950 text-gray-400 dark:border-gray-800">
                <div className="mx-auto max-w-7xl px-4 py-10">
                    <div className="grid gap-8 md:grid-cols-3">
                        <div>
                            <div className="mb-3 flex items-center gap-2">
                                <div className="flex size-7 items-center justify-center rounded bg-red-600">
                                    <Newspaper className="size-3.5 text-white" />
                                </div>
                                <span className="font-black text-white">
                                    NEWS<span className="text-red-500">PORTAL</span>
                                </span>
                            </div>
                            <p className="text-sm leading-relaxed">
                                Your trusted source for the latest news, breaking stories, and in-depth reporting.
                            </p>
                        </div>

                        <div>
                            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-300">Categories</h4>
                            <ul className="space-y-1.5 text-sm">
                                {categories.slice(0, 5).map((cat) => (
                                    <li key={cat.id}>
                                        <Link href={`/category/${cat.slug}`} className="transition hover:text-white">
                                            {cat.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-300">Quick Links</h4>
                            <ul className="space-y-1.5 text-sm">
                                <li><Link href="/" className="transition hover:text-white">Home</Link></li>
                                <li><Link href="/news" className="transition hover:text-white">News</Link></li>
                                <li><Link href="/search" className="transition hover:text-white">Search</Link></li>
                                <li><Link href="/about-us" className="transition hover:text-white">About Us</Link></li>
                                <li><Link href="/contact-us" className="transition hover:text-white">Contact Us</Link></li>
                                <li><Link href="/privacy-policy" className="transition hover:text-white">Privacy Policy</Link></li>
                                {auth?.user ? (
                                    <li><Link href="/dashboard" className="transition hover:text-white">Dashboard</Link></li>
                                ) : (
                                    <li><Link href="/login" className="transition hover:text-white">Sign in</Link></li>
                                )}
                            </ul>
                        </div>
                    </div>

                    <div className="mt-8 border-t border-gray-800 pt-6 text-center text-xs text-gray-600">
                        © {new Date().getFullYear()} NewsPortal. All rights reserved.
                    </div>
                </div>
            </footer>

            {/* ── Floating / Overlay / Sticky-Bottom Ads ──────────────────── */}
            <AdSlot position="floating_bottom_right" page={adPage} />
            <AdSlot position="floating_bottom_left" page={adPage} />
            <AdSlot position="popup" page={adPage} />
            <AdSlot position="full_screen_overlay" page={adPage} />
            <div className="fixed inset-x-0 bottom-14 z-30 md:bottom-0">
                <AdSlot position="sticky_bottom" page={adPage} className="mx-auto max-w-7xl" />
            </div>

            <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur md:hidden dark:border-gray-800 dark:bg-gray-900/95">
                <div className="mx-auto grid max-w-md grid-cols-4">
                    <Link href="/" className="flex flex-col items-center gap-1 px-2 py-2 text-xs font-medium text-gray-600 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400">
                        <Home className="size-4" />
                        Home
                    </Link>
                    <Link href="/news" className="flex flex-col items-center gap-1 px-2 py-2 text-xs font-medium text-gray-600 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400">
                        <List className="size-4" />
                        News
                    </Link>
                    <Link href="/search" className="flex flex-col items-center gap-1 px-2 py-2 text-xs font-medium text-gray-600 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400">
                        <Search className="size-4" />
                        Search
                    </Link>
                    <Link href={auth?.user ? '/dashboard' : '/login'} className="flex flex-col items-center gap-1 px-2 py-2 text-xs font-medium text-gray-600 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400">
                        <UserCircle className="size-4" />
                        {auth?.user ? 'Account' : 'Login'}
                    </Link>
                </div>
            </nav>

            <div className="h-14 md:hidden" aria-hidden="true" />
        </div>
    );
}
