import { Link, router, usePage } from '@inertiajs/react';
import {
    ChevronDown,
    ChevronRight,
    Clock,
    LayoutDashboard,
    LogIn,
    Menu,
    Monitor,
    Moon,
    Newspaper,
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
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
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
import type { Auth, Category } from '@/types';

interface Props {
    navCategories: Category[];
}

// Max categories visible in desktop nav before "More" dropdown
const MAX_VISIBLE_CATEGORIES = 6;

export default function PublicHeader({ navCategories }: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const { appearance, resolvedAppearance, updateAppearance } = useAppearance();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [mobileExpandedCats, setMobileExpandedCats] = useState<number[]>([]);
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

    const toggleMobileCat = (id: number) => {
        setMobileExpandedCats((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
    };

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
                    <Link href="/" className="flex shrink-0 items-center gap-2.5">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-red-600 shadow-sm">
                            <Newspaper className="size-5 text-white" />
                        </div>
                        <div className="flex flex-col leading-none">
                            <span className="text-xl font-black tracking-tight">
                                NEWS<span className="text-red-600">PORTAL</span>
                            </span>
                        </div>
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
                        <NavigationMenu className="mx-0 max-w-none justify-start">
                            <NavigationMenuList className="gap-0">
                                {/* Home */}
                                <NavigationMenuItem>
                                    <Link href="/" className={navigationMenuTriggerStyle()}>
                                        Home
                                    </Link>
                                </NavigationMenuItem>

                                {/* Latest News */}
                                <NavigationMenuItem>
                                    <Link href="/news" className={navigationMenuTriggerStyle()}>
                                        Latest News
                                    </Link>
                                </NavigationMenuItem>

                                <Separator orientation="vertical" className="mx-1 h-5" />

                                {/* Category items with subcategory dropdowns */}
                                {visibleCategories.map((cat) =>
                                    cat.children && cat.children.length > 0 ? (
                                        <NavigationMenuItem key={cat.id}>
                                            <NavigationMenuTrigger className="text-sm">
                                                <span className="mr-1.5 inline-block size-2 rounded-full" style={{ backgroundColor: cat.color }} />
                                                {cat.name}
                                            </NavigationMenuTrigger>
                                            <NavigationMenuContent>
                                                <div className="grid w-[340px] gap-1 p-2">
                                                    {/* Parent category link */}
                                                    <NavigationMenuLink asChild>
                                                        <Link
                                                            href={`/category/${cat.slug}`}
                                                            className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-semibold transition hover:bg-accent"
                                                        >
                                                            <span className="inline-block size-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                                                            All {cat.name}
                                                            <ChevronRight className="ml-auto size-3.5 text-muted-foreground" />
                                                        </Link>
                                                    </NavigationMenuLink>
                                                    <Separator />
                                                    {cat.children.map((child) => (
                                                        <NavigationMenuLink key={child.id} asChild>
                                                            <Link
                                                                href={`/category/${child.slug}`}
                                                                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition hover:bg-accent"
                                                            >
                                                                <span
                                                                    className="inline-block size-1.5 rounded-full"
                                                                    style={{ backgroundColor: child.color }}
                                                                />
                                                                {child.name}
                                                            </Link>
                                                        </NavigationMenuLink>
                                                    ))}
                                                </div>
                                            </NavigationMenuContent>
                                        </NavigationMenuItem>
                                    ) : (
                                        <NavigationMenuItem key={cat.id}>
                                            <Link href={`/category/${cat.slug}`} className={navigationMenuTriggerStyle()}>
                                                <span
                                                    className="mr-1.5 inline-block size-2 rounded-full"
                                                    style={{ backgroundColor: cat.color }}
                                                />
                                                {cat.name}
                                            </Link>
                                        </NavigationMenuItem>
                                    ),
                                )}

                                {/* "More" dropdown for overflow categories */}
                                {overflowCategories.length > 0 && (
                                    <NavigationMenuItem>
                                        <NavigationMenuTrigger className="text-sm">More</NavigationMenuTrigger>
                                        <NavigationMenuContent>
                                            <div className="grid w-[280px] gap-1 p-2">
                                                {overflowCategories.map((cat) => (
                                                    <NavigationMenuLink key={cat.id} asChild>
                                                        <Link
                                                            href={`/category/${cat.slug}`}
                                                            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition hover:bg-accent"
                                                        >
                                                            <span
                                                                className="inline-block size-2 rounded-full"
                                                                style={{ backgroundColor: cat.color }}
                                                            />
                                                            {cat.name}
                                                        </Link>
                                                    </NavigationMenuLink>
                                                ))}
                                            </div>
                                        </NavigationMenuContent>
                                    </NavigationMenuItem>
                                )}
                            </NavigationMenuList>
                        </NavigationMenu>
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
                            <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                                <div className="flex size-8 items-center justify-center rounded-lg bg-red-600">
                                    <Newspaper className="size-4 text-white" />
                                </div>
                                <span className="text-lg font-black tracking-tight">
                                    NEWS<span className="text-red-600">PORTAL</span>
                                </span>
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
                            <div key={cat.id}>
                                <div className="flex items-center">
                                    <Link
                                        href={`/category/${cat.slug}`}
                                        className="flex flex-1 items-center gap-3 px-5 py-2.5 text-sm font-medium transition hover:bg-gray-50 dark:hover:bg-gray-800"
                                        onClick={() => setMobileOpen(false)}
                                    >
                                        <span className="inline-block size-2 rounded-full" style={{ backgroundColor: cat.color }} />
                                        {cat.name}
                                    </Link>
                                    {cat.children && cat.children.length > 0 && (
                                        <button
                                            onClick={() => toggleMobileCat(cat.id)}
                                            className="px-4 py-2.5 text-gray-400 transition hover:text-gray-600"
                                        >
                                            <ChevronDown
                                                className={`size-4 transition-transform ${mobileExpandedCats.includes(cat.id) ? 'rotate-180' : ''}`}
                                            />
                                        </button>
                                    )}
                                </div>

                                {/* Subcategories */}
                                {cat.children && cat.children.length > 0 && mobileExpandedCats.includes(cat.id) && (
                                    <div className="bg-gray-50 dark:bg-gray-800/50">
                                        {cat.children.map((child) => (
                                            <Link
                                                key={child.id}
                                                href={`/category/${child.slug}`}
                                                className="flex items-center gap-3 py-2 pl-10 pr-5 text-sm text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                                                onClick={() => setMobileOpen(false)}
                                            >
                                                <span className="inline-block size-1.5 rounded-full" style={{ backgroundColor: child.color }} />
                                                {child.name}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
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
