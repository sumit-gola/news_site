import { Link, router, usePage } from '@inertiajs/react';
import { Search, Menu, X, Newspaper, LogIn, LayoutDashboard, Moon, Sun, Home, List, UserCircle } from 'lucide-react';
import { useState, useRef, type ReactNode } from 'react';
import { useAppearance } from '@/hooks/use-appearance';
import type { Auth, Category } from '@/types';

interface Props {
    children: ReactNode;
    navCategories: Category[];
}

export default function PublicLayout({ children, navCategories }: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const searchRef = useRef<HTMLInputElement>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.get('/search', { q: searchQuery.trim() });
            setSearchOpen(false);
            setSearchQuery('');
        }
    };

    const toggleSearch = () => {
        setSearchOpen((v) => !v);
        setTimeout(() => searchRef.current?.focus(), 100);
    };

    return (
        <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
            {/* ── Top Bar ──────────────────────────────────────────────────── */}
            <div className="border-b border-gray-200 bg-gray-950 py-2 text-xs text-gray-400 dark:border-gray-800">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4">
                    <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    <div className="flex items-center gap-4">
                        {auth?.user ? (
                            <Link href="/dashboard" className="flex items-center gap-1 text-gray-300 transition hover:text-white">
                                <LayoutDashboard className="size-3" />
                                Dashboard
                            </Link>
                        ) : (
                            <Link href="/login" className="flex items-center gap-1 text-gray-300 transition hover:text-white">
                                <LogIn className="size-3" />
                                Sign in
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Header ───────────────────────────────────────────────────── */}
            <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="flex size-8 items-center justify-center rounded bg-red-600">
                            <Newspaper className="size-4 text-white" />
                        </div>
                        <span className="text-xl font-black tracking-tight">
                            NEWS<span className="text-red-600">PORTAL</span>
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden items-center gap-1 md:flex">
                        <Link
                            href="/"
                            className="rounded px-3 py-1.5 text-sm font-medium transition hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            Home
                        </Link>
                        <Link
                            href="/news"
                            className="rounded px-3 py-1.5 text-sm font-medium transition hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            News
                        </Link>
                        {navCategories.slice(0, 6).map((cat) => (
                            <Link
                                key={cat.id}
                                href={`/category/${cat.slug}`}
                                className="rounded px-3 py-1.5 text-sm font-medium transition hover:bg-gray-100 dark:hover:bg-gray-800"
                                style={{ color: cat.color ?? undefined }}
                            >
                                {cat.name}
                            </Link>
                        ))}
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => updateAppearance(resolvedAppearance === 'dark' ? 'light' : 'dark')}
                            className="rounded-full p-2 transition hover:bg-gray-100 dark:hover:bg-gray-800"
                            aria-label="Toggle theme"
                            title="Toggle dark mode"
                        >
                            {resolvedAppearance === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
                        </button>

                        {/* Search toggle */}
                        <button
                            onClick={toggleSearch}
                            className="rounded-full p-2 transition hover:bg-gray-100 dark:hover:bg-gray-800"
                            aria-label="Search"
                        >
                            {searchOpen ? <X className="size-5" /> : <Search className="size-5" />}
                        </button>

                        {/* Mobile menu */}
                        <button
                            onClick={() => setMenuOpen((v) => !v)}
                            className="rounded-full p-2 transition hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden"
                            aria-label="Menu"
                        >
                            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                        </button>
                    </div>
                </div>

                {/* Search Bar (collapsible) */}
                {searchOpen && (
                    <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
                        <form onSubmit={handleSearch} className="mx-auto flex max-w-2xl gap-2">
                            <input
                                ref={searchRef}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search articles, topics, tags…"
                                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-gray-700 dark:bg-gray-800"
                            />
                            <button
                                type="submit"
                                className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                            >
                                <Search className="size-4" />
                                Search
                            </button>
                        </form>
                    </div>
                )}

                {/* Mobile Menu */}
                {menuOpen && (
                    <div className="border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900 md:hidden">
                        <nav className="flex flex-col gap-1">
                            <Link href="/" className="rounded px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => setMenuOpen(false)}>
                                Home
                            </Link>
                            <Link href="/news" className="rounded px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => setMenuOpen(false)}>
                                News
                            </Link>
                            {navCategories.map((cat) => (
                                <Link
                                    key={cat.id}
                                    href={`/category/${cat.slug}`}
                                    className="rounded px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800"
                                    style={{ color: cat.color ?? undefined }}
                                    onClick={() => setMenuOpen(false)}
                                >
                                    {cat.name}
                                </Link>
                            ))}
                        </nav>
                    </div>
                )}
            </header>

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
                                {navCategories.slice(0, 5).map((cat) => (
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
                    <button onClick={toggleSearch} className="flex flex-col items-center gap-1 px-2 py-2 text-xs font-medium text-gray-600 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400">
                        <Search className="size-4" />
                        Search
                    </button>
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
