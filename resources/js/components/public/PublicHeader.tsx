import { Link, router, usePage } from '@inertiajs/react';
import {
    ChevronDown,
    Clock,
    LayoutDashboard,
    LogIn,
    Menu,
    Monitor,
    Moon,
    Search,
    Sun,
    TrendingUp,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Separator } from '@/components/ui/separator';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppearance } from '@/hooks/use-appearance';
import { MegaMenu, SimpleCategoryList } from '@/components/public/MegaMenu';
import type { Auth, Category } from '@/types';

interface Props {
    navCategories: Category[];
}

// Max categories visible in desktop nav before "More" dropdown
const MAX_VISIBLE_CATEGORIES = 6;

/** Check if a category has grandchildren (children with their own children). */
function hasGrandchildren(cat: Category): boolean {
    return (cat.children ?? []).some((child) => child.children && child.children.length > 0);
}

/** Recursive mobile category item with accordion-style expand/collapse. */
function MobileCategoryItem({
    category,
    depth,
    onClose,
}: {
    category: Category;
    depth: number;
    onClose: () => void;
}) {
    const [open, setOpen] = useState(false);
    const hasChildren = category.children && category.children.length > 0;
    const pl = 5 + depth * 4; // px padding increases with depth

    return (
        <div>
            <div className="flex items-center">
                <Link
                    href={`/category/${category.slug}`}
                    className="flex flex-1 items-center gap-3 py-2.5 text-sm font-medium transition hover:bg-gray-50 dark:hover:bg-gray-800"
                    style={{ paddingLeft: `${pl * 4}px`, paddingRight: '20px' }}
                    onClick={onClose}
                >
                    <span
                        className={`inline-block rounded-full ${depth === 0 ? 'size-2' : 'size-1.5'}`}
                        style={{ backgroundColor: category.color }}
                    />
                    {category.name}
                </Link>
                {hasChildren && (
                    <button
                        onClick={() => setOpen((prev) => !prev)}
                        className="px-4 py-2.5 text-gray-400 transition hover:text-gray-600"
                    >
                        <ChevronDown className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`} />
                    </button>
                )}
            </div>
            {hasChildren && open && (
                <div className="bg-gray-50/50 dark:bg-gray-800/30">
                    {category.children!.map((child) => (
                        <MobileCategoryItem key={child.id} category={child} depth={depth + 1} onClose={onClose} />
                    ))}
                </div>
            )}
        </div>
    );
}

const NAV_TAB_CLS =
    'inline-flex h-9 items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ' +
    'text-gray-700 hover:bg-gray-100 hover:text-gray-900 ' +
    'dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100';

/**
 * Shared hover card content for a category.
 * Renders MegaMenu for deep trees, SimpleCategoryList for flat ones.
 */
function CategoryDropdownContent({ cat }: { cat: Category }) {
    if (hasGrandchildren(cat)) {
        return <MegaMenu category={cat} />;
    }
    return <SimpleCategoryList category={cat} />;
}

/** Category tab — shows CategoryDropdownContent in a HoverCard below the tab. */
function CategoryNavTab({ cat }: { cat: Category }) {
    const hasChildren = (cat.children ?? []).length > 0;

    if (!hasChildren) {
        return (
            <Link href={`/category/${cat.slug}`} className={NAV_TAB_CLS}>
                <span className="inline-block size-2 rounded-full" style={{ backgroundColor: cat.color }} />
                {cat.name}
            </Link>
        );
    }

    return (
        <HoverCard openDelay={100} closeDelay={150}>
            <HoverCardTrigger asChild>
                <Link href={`/category/${cat.slug}`} className={NAV_TAB_CLS}>
                    <span className="inline-block size-2 rounded-full" style={{ backgroundColor: cat.color }} />
                    {cat.name}
                    <ChevronDown className="size-3.5" />
                </Link>
            </HoverCardTrigger>
            <HoverCardContent align="start" sideOffset={0} className="w-auto p-0 shadow-xl">
                <CategoryDropdownContent cat={cat} />
            </HoverCardContent>
        </HoverCard>
    );
}

/** "More" overflow tab — same HoverCard pattern with a flat category list. */
function MoreNavTab({ categories }: { categories: Category[] }) {
    return (
        <HoverCard openDelay={100} closeDelay={150}>
            <HoverCardTrigger asChild>
                <button className={NAV_TAB_CLS}>
                    More
                    <ChevronDown className="size-3.5" />
                </button>
            </HoverCardTrigger>
            <HoverCardContent align="start" sideOffset={0} className="w-auto p-0 shadow-xl">
                <div className="grid w-[260px] gap-0.5 p-2">
                    {categories.map((cat) => (
                        <Link
                            key={cat.id}
                            href={`/category/${cat.slug}`}
                            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                            <span className="inline-block size-2 rounded-full" style={{ backgroundColor: cat.color }} />
                            {cat.name}
                        </Link>
                    ))}
                </div>
            </HoverCardContent>
        </HoverCard>
    );
}

export default function PublicHeader({ navCategories }: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const { appearance, resolvedAppearance, updateAppearance } = useAppearance();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const searchRef = useRef<HTMLInputElement>(null);

    const visibleCategories = navCategories.slice(0, MAX_VISIBLE_CATEGORIES);
    const overflowCategories = navCategories.slice(MAX_VISIBLE_CATEGORIES);

    // ── Keyboard shortcut: Ctrl/Cmd + K to open search ──────────
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setSearchOpen(true);
            }

            if (e.key === 'Escape' && searchOpen) {
                setSearchOpen(false);
            }
        };
        document.addEventListener('keydown', onKeyDown);

        return () => document.removeEventListener('keydown', onKeyDown);
    }, [searchOpen]);

    // Focus search input when overlay opens
    useEffect(() => {
        if (searchOpen) {
            setTimeout(() => searchRef.current?.focus(), 100);
        }
    }, [searchOpen]);

    const handleSearch = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();

            if (searchQuery.trim()) {
                router.get('/search', { q: searchQuery.trim() });
                setSearchOpen(false);
                setSearchQuery('');
            }
        },
        [searchQuery],
    );

    const themeIcon =
        appearance === 'system' ? (
            <Monitor className="size-4" />
        ) : resolvedAppearance === 'dark' ? (
            <Sun className="size-4" />
        ) : (
            <Moon className="size-4" />
        );

    return (
        <>
            {/* ═══════════════════ TOP BAR ═══════════════════════════════ */}
            <div className="border-b border-gray-200 bg-gray-950 text-xs text-gray-400 dark:border-gray-800">
                <div className="mx-auto flex h-8 max-w-7xl items-center justify-between px-4">
                    {/* Left: Date */}
                    <div className="flex items-center gap-3">
                        <Clock className="size-3 text-gray-500" />
                        <span className="hidden sm:inline">
                            {new Date().toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </span>
                        <span className="sm:hidden">
                            {new Date().toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                            })}
                        </span>
                    </div>

                    {/* Center: Trending badge */}
                    <div className="hidden items-center gap-2 lg:flex">
                        <Badge className="bg-red-600 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-red-700">
                            <TrendingUp className="mr-1 size-3" />
                            Trending
                        </Badge>
                        <span className="max-w-xs truncate text-gray-300">Stay updated with the latest news</span>
                    </div>

                    {/* Right: Auth link */}
                    <div className="flex items-center gap-4">
                        {auth?.user ? (
                            <Link
                                href="/dashboard"
                                className="flex items-center gap-1.5 text-gray-300 transition hover:text-white"
                            >
                                <LayoutDashboard className="size-3" />
                                <span className="hidden sm:inline">Dashboard</span>
                            </Link>
                        ) : (
                            <Link
                                href="/login"
                                className="flex items-center gap-1.5 text-gray-300 transition hover:text-white"
                            >
                                <LogIn className="size-3" />
                                <span className="hidden sm:inline">Sign in</span>
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* ═══════════════════ MAIN HEADER ══════════════════════════ */}
            <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/95">
                {/* ── Primary Row: Logo + Search + Actions ─────────────── */}
                <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4">
                    {/* Logo */}
                    <Link href="/" className="flex shrink-0 items-center">
                        <img src="/logo5.png" alt="logo" className="h-14 w-auto object-contain" />
                    </Link>

                    {/* Desktop Search Bar (center) */}
                    <div className="hidden max-w-md flex-1 md:block">
                        <button
                            onClick={() => setSearchOpen(true)}
                            className="flex h-9 w-full items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500 transition hover:border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:bg-gray-750"
                        >
                            <Search className="size-4" />
                            <span className="flex-1 text-left">Search articles, topics…</span>
                            <kbd className="hidden rounded border border-gray-300 bg-white px-1.5 py-0.5 font-mono text-[10px] text-gray-400 lg:inline-block dark:border-gray-600 dark:bg-gray-700">
                                ⌘K
                            </kbd>
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-1">
                        {/* Mobile Search */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSearchOpen(true)}>
                                    <Search className="size-5" />
                                    <span className="sr-only">Search</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Search</TooltipContent>
                        </Tooltip>

                        {/* Theme toggle dropdown */}
                        <DropdownMenu>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            {themeIcon}
                                            <span className="sr-only">Toggle theme</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                </TooltipTrigger>
                                <TooltipContent>Theme</TooltipContent>
                            </Tooltip>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel className="text-xs font-normal text-gray-500">Appearance</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => updateAppearance('light')}>
                                    <Sun className="mr-2 size-4" />
                                    Light
                                    {appearance === 'light' && <span className="ml-auto text-xs text-red-500">✓</span>}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateAppearance('dark')}>
                                    <Moon className="mr-2 size-4" />
                                    Dark
                                    {appearance === 'dark' && <span className="ml-auto text-xs text-red-500">✓</span>}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateAppearance('system')}>
                                    <Monitor className="mr-2 size-4" />
                                    System
                                    {appearance === 'system' && <span className="ml-auto text-xs text-red-500">✓</span>}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Mobile menu trigger */}
                        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)}>
                            <Menu className="size-5" />
                            <span className="sr-only">Open menu</span>
                        </Button>
                    </div>
                </div>

                {/* ── Navigation Row: Categories ─────────────────────── */}
                <div className="hidden border-t border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900 md:block">
                    <div className="mx-auto max-w-7xl px-4">
                        <nav className="flex items-center">
                            {/* Home */}
                            <Link href="/" className={NAV_TAB_CLS}>
                                Home
                            </Link>

                            {/* Latest News */}
                            <Link href="/news" className={NAV_TAB_CLS}>
                                Latest News
                            </Link>

                            <Separator orientation="vertical" className="mx-1 h-5" />

                            {/* Per-tab hover dropdowns */}
                            {visibleCategories.map((cat) => (
                                <CategoryNavTab key={cat.id} cat={cat} />
                            ))}

                            {/* Overflow "More" */}
                            {overflowCategories.length > 0 && (
                                <MoreNavTab categories={overflowCategories} />
                            )}
                        </nav>
                    </div>
                </div>
            </header>

            {/* ═══════════════════ SEARCH OVERLAY ═══════════════════════ */}
            {searchOpen && (
                <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" onClick={() => setSearchOpen(false)} />

                    {/* Search panel */}
                    <div className="fixed inset-x-0 top-0 z-[70] mx-auto max-w-2xl px-4 pt-[10vh] animate-in fade-in slide-in-from-top-4 duration-200">
                        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
                            <form onSubmit={handleSearch} className="flex items-center gap-3 px-4">
                                <Search className="size-5 shrink-0 text-gray-400" />
                                <input
                                    ref={searchRef}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search articles, topics, tags…"
                                    className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-gray-400 dark:text-gray-100"
                                />
                                <kbd className="hidden rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] text-gray-400 sm:inline-block dark:border-gray-600 dark:bg-gray-700">
                                    ESC
                                </kbd>
                                <Button type="button" variant="ghost" size="icon" onClick={() => setSearchOpen(false)} className="shrink-0">
                                    <X className="size-4" />
                                </Button>
                            </form>

                            {/* Quick category links */}
                            <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-800">
                                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Quick links</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {navCategories.slice(0, 8).map((cat) => (
                                        <Link
                                            key={cat.id}
                                            href={`/category/${cat.slug}`}
                                            onClick={() => setSearchOpen(false)}
                                            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600 transition hover:border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-600"
                                        >
                                            <span className="inline-block size-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
                                            {cat.name}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ═══════════════════ MOBILE SHEET ═════════════════════════ */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetContent side="left" className="w-80 overflow-y-auto p-0">
                    <SheetHeader className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
                        <SheetTitle>
                            <Link href="/" className="flex items-center" onClick={() => setMobileOpen(false)}>
                                <img src="/logo5.png" alt="logo" className="h-12 w-auto object-contain" />
                            </Link>
                        </SheetTitle>
                        <SheetDescription className="sr-only">Navigation menu</SheetDescription>
                    </SheetHeader>

                    {/* Mobile Search */}
                    <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();

                                if (searchQuery.trim()) {
                                    router.get('/search', { q: searchQuery.trim() });
                                    setMobileOpen(false);
                                    setSearchQuery('');
                                }
                            }}
                            className="flex items-center gap-2"
                        >
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search…"
                                    className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-gray-700 dark:bg-gray-800"
                                />
                            </div>
                            <Button type="submit" size="sm" className="bg-red-600 hover:bg-red-700">
                                Go
                            </Button>
                        </form>
                    </div>

                    {/* Mobile Nav Links */}
                    <nav className="flex flex-col py-2">
                        <Link
                            href="/"
                            className="flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition hover:bg-gray-50 dark:hover:bg-gray-800"
                            onClick={() => setMobileOpen(false)}
                        >
                            Home
                        </Link>
                        <Link
                            href="/news"
                            className="flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition hover:bg-gray-50 dark:hover:bg-gray-800"
                            onClick={() => setMobileOpen(false)}
                        >
                            Latest News
                        </Link>

                        <Separator className="my-2" />

                        <p className="px-5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Categories</p>

                        {navCategories.map((cat) => (
                            <MobileCategoryItem key={cat.id} category={cat} depth={0} onClose={() => setMobileOpen(false)} />
                        ))}

                        <Separator className="my-2" />

                        <p className="px-5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Pages</p>
                        <Link href="/about-us" className="px-5 py-2.5 text-sm font-medium transition hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => setMobileOpen(false)}>
                            About Us
                        </Link>
                        <Link href="/contact-us" className="px-5 py-2.5 text-sm font-medium transition hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => setMobileOpen(false)}>
                            Contact Us
                        </Link>
                        <Link href="/privacy-policy" className="px-5 py-2.5 text-sm font-medium transition hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => setMobileOpen(false)}>
                            Privacy Policy
                        </Link>
                    </nav>

                    {/* Mobile Footer: Auth */}
                    <div className="mt-auto border-t border-gray-100 px-5 py-4 dark:border-gray-800">
                        {auth?.user ? (
                            <Button asChild variant="outline" className="w-full justify-start gap-2">
                                <Link href="/dashboard">
                                    <LayoutDashboard className="size-4" />
                                    Go to Dashboard
                                </Link>
                            </Button>
                        ) : (
                            <Button asChild className="w-full justify-start gap-2 bg-red-600 hover:bg-red-700">
                                <Link href="/login">
                                    <LogIn className="size-4" />
                                    Sign in
                                </Link>
                            </Button>
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
