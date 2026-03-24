/**
 * MegaMenu — 4-level progressive column mega menu panel.
 *
 * Renders inside NavigationMenuContent. Features:
 *  - Up to 4 drill-down columns (L1 → L2 → L3 → L4)
 *  - In-panel search with 300 ms debounce, text highlight, keyboard nav
 *  - Hover-intent column reveals
 *  - Color-coded category dots
 *  - "View All" header links per column
 *  - Dark-mode support
 */

import { Link, router } from '@inertiajs/react';
import { ChevronRight, Search, X } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Separator } from '@/components/ui/separator';
import type { Category } from '@/types';

// ─── Helpers ───────────────────────────────────────────────────────────────────

interface FlatCat {
    category: Category;
    /** Ancestor names above this category (not including itself). */
    breadcrumb: string[];
}

/** BFS-flatten a category tree into a searchable list of all descendants. */
function flattenTree(root: Category): FlatCat[] {
    const result: FlatCat[] = [];
    function traverse(cat: Category, breadcrumb: string[]) {
        for (const child of cat.children ?? []) {
            result.push({ category: child, breadcrumb });
            traverse(child, [...breadcrumb, child.name]);
        }
    }
    traverse(root, [root.name]);
    return result;
}

/** Return the maximum depth of the category tree (0 = no children). */
function treeDepth(cat: Category): number {
    const kids = cat.children ?? [];
    if (kids.length === 0) return 0;
    return 1 + Math.max(...kids.map(treeDepth));
}

/** Highlight the first occurrence of `query` inside `text`. */
function Highlight({ text, query }: { text: string; query: string }) {
    if (!query) return <>{text}</>;
    const lower = text.toLowerCase();
    const q = query.toLowerCase();
    const idx = lower.indexOf(q);
    if (idx === -1) return <>{text}</>;
    return (
        <>
            {text.slice(0, idx)}
            <mark className="rounded-sm bg-yellow-200 px-0.5 font-medium not-italic text-yellow-900 dark:bg-yellow-800/70 dark:text-yellow-100">
                {text.slice(idx, idx + q.length)}
            </mark>
            {text.slice(idx + q.length)}
        </>
    );
}

// ─── ColumnItem ────────────────────────────────────────────────────────────────

interface ColumnItemProps {
    cat: Category;
    isActive: boolean;
    hasChildren: boolean;
    onHover: () => void;
}

function ColumnItem({ cat, isActive, hasChildren, onHover }: ColumnItemProps) {
    return (
        <Link
            href={`/category/${cat.slug}`}
            className={[
                'group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive
                    ? 'bg-red-50 font-semibold text-red-700 dark:bg-red-950/30 dark:text-red-400'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
            ].join(' ')}
            onMouseEnter={onHover}
        >
            <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: cat.color }} />
            <span className="flex-1 truncate leading-snug">{cat.name}</span>
            {hasChildren && (
                <ChevronRight
                    className={[
                        'size-3.5 shrink-0 transition-colors',
                        isActive
                            ? 'text-red-500'
                            : 'text-gray-300 group-hover:text-gray-500 dark:text-gray-600 dark:group-hover:text-gray-400',
                    ].join(' ')}
                />
            )}
        </Link>
    );
}

// ─── Column ────────────────────────────────────────────────────────────────────

interface ColumnProps {
    /** Link and label for the "View All" header row. */
    viewAllSlug: string;
    viewAllLabel: string;
    viewAllColor: string;
    items: Category[];
    activeId: number | null;
    onHover: (cat: Category) => void;
    /** Whether this is the deepest visible column (no chevrons). */
    isLeaf?: boolean;
}

function Column({ viewAllSlug, viewAllLabel, viewAllColor, items, activeId, onHover, isLeaf }: ColumnProps) {
    return (
        <div className="flex min-h-[200px] flex-col">
            {/* "View All" header link */}
            <Link
                href={`/category/${viewAllSlug}`}
                className="mb-1 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            >
                <span className="size-1.5 rounded-full" style={{ backgroundColor: viewAllColor }} />
                <span className="flex-1 truncate">{viewAllLabel}</span>
                <ChevronRight className="size-3 shrink-0 text-gray-300 dark:text-gray-600" />
            </Link>

            <Separator className="mb-1" />

            {/* Scrollable item list */}
            <div className="flex-1 space-y-0.5 overflow-y-auto pr-0.5" style={{ maxHeight: 320 }}>
                {items.map((cat) => (
                    <ColumnItem
                        key={cat.id}
                        cat={cat}
                        isActive={activeId === cat.id}
                        hasChildren={!isLeaf && (cat.children?.length ?? 0) > 0}
                        onHover={() => onHover(cat)}
                    />
                ))}
            </div>
        </div>
    );
}

// ─── MegaMenu ──────────────────────────────────────────────────────────────────

interface MegaMenuProps {
    /** The top-level category whose children populate Column 1. */
    category: Category;
}

export function MegaMenu({ category }: MegaMenuProps) {
    const L1s = useMemo(() => category.children ?? [], [category]);

    // Compute maximum panel width once (based on tree depth) to avoid layout shifts.
    const maxDepth = useMemo(() => Math.min(4, treeDepth(category)), [category]);

    /**
     * Panel width = 210 px per column + 32 px outer padding.
     * We cap at 4 columns (≈ 872 px).
     */
    const panelWidth = useMemo(() => {
        if (maxDepth <= 1) return 300;
        if (maxDepth === 2) return 500;
        if (maxDepth === 3) return 690;
        return 870;
    }, [maxDepth]);

    // Active drill-down selections per level
    const [activeL1, setActiveL1] = useState<Category | null>(
        () => L1s.find((c) => (c.children?.length ?? 0) > 0) ?? L1s[0] ?? null,
    );
    const [activeL2, setActiveL2] = useState<Category | null>(null);
    const [activeL3, setActiveL3] = useState<Category | null>(null);

    // Reset lower levels when a higher level changes
    const handleHoverL1 = useCallback((cat: Category) => {
        setActiveL1(cat);
        setActiveL2(null);
        setActiveL3(null);
    }, []);

    const handleHoverL2 = useCallback((cat: Category) => {
        setActiveL2(cat);
        setActiveL3(null);
    }, []);

    const handleHoverL3 = useCallback((cat: Category) => {
        setActiveL3(cat);
    }, []);

    // Computed child lists
    const L2s = activeL1?.children ?? [];
    const L3s = activeL2?.children ?? [];
    const L4s = activeL3?.children ?? [];

    const showL2 = L2s.length > 0;
    const showL3 = showL2 && L3s.length > 0;
    const showL4 = showL3 && L4s.length > 0;

    // ── Search ────────────────────────────────────────────────────────────────

    const [rawQuery, setRawQuery] = useState('');
    const [query, setQuery] = useState('');
    const [kbIdx, setKbIdx] = useState(0);
    const searchRef = useRef<HTMLInputElement>(null);
    const resultsRef = useRef<HTMLDivElement>(null);

    // Debounce search query (300 ms)
    useEffect(() => {
        const timer = setTimeout(() => {
            setQuery(rawQuery);
            setKbIdx(0);
        }, 300);
        return () => clearTimeout(timer);
    }, [rawQuery]);

    const allFlat = useMemo(() => flattenTree(category), [category]);

    const searchResults = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return [];
        return allFlat.filter(({ category: c }) => c.name.toLowerCase().includes(q));
    }, [allFlat, query]);

    // Keyboard navigation in search results
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (!searchResults.length) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setKbIdx((i) => Math.min(i + 1, searchResults.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setKbIdx((i) => Math.max(i - 1, 0));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const hit = searchResults[kbIdx];
                if (hit) router.visit(`/category/${hit.category.slug}`);
            } else if (e.key === 'Escape') {
                setRawQuery('');
                setQuery('');
            }
        },
        [searchResults, kbIdx],
    );

    // Auto-scroll highlighted search result into view
    useEffect(() => {
        const el = resultsRef.current?.querySelector<HTMLElement>(`[data-kb="${kbIdx}"]`);
        el?.scrollIntoView({ block: 'nearest' });
    }, [kbIdx]);

    const isSearching = query.trim().length > 0;

    // Column count for the grid layout (min 1, max 4)
    const activeCols = 1 + (showL2 ? 1 : 0) + (showL3 ? 1 : 0) + (showL4 ? 1 : 0);
    // Use max possible cols so width stays stable (avoids layout shift)
    const gridCols = Math.min(maxDepth, 4);

    return (
        <div
            className="overflow-hidden rounded-b-xl border-t-0 border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900"
            style={{ width: panelWidth }}
        >
            {/* ── Search bar ─────────────────────────────────────────────── */}
            <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-2.5 dark:border-gray-800">
                <Search className="size-3.5 shrink-0 text-gray-400" />
                <input
                    ref={searchRef}
                    value={rawQuery}
                    onChange={(e) => setRawQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Search in ${category.name}…`}
                    className="flex-1 bg-transparent text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none dark:text-gray-300 dark:placeholder:text-gray-600"
                    autoComplete="off"
                />
                {rawQuery && (
                    <button
                        type="button"
                        onClick={() => {
                            setRawQuery('');
                            setQuery('');
                            searchRef.current?.focus();
                        }}
                        className="text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
                    >
                        <X className="size-3" />
                    </button>
                )}
            </div>

            {isSearching ? (
                /* ── Search results view ───────────────────────────────── */
                <div ref={resultsRef} className="overflow-y-auto p-2" style={{ maxHeight: 360 }}>
                    {searchResults.length === 0 ? (
                        <div className="py-8 text-center text-xs text-gray-400">
                            No categories found for &ldquo;<strong className="text-gray-600 dark:text-gray-300">{query}</strong>&rdquo;
                        </div>
                    ) : (
                        searchResults.map(({ category: cat, breadcrumb }, idx) => (
                            <Link
                                key={cat.id}
                                data-kb={idx}
                                href={`/category/${cat.slug}`}
                                className={[
                                    'flex items-center gap-3 rounded-lg px-3 py-2 transition-colors',
                                    idx === kbIdx
                                        ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
                                ].join(' ')}
                                onMouseEnter={() => setKbIdx(idx)}
                            >
                                <span
                                    className="size-2 shrink-0 rounded-full"
                                    style={{ backgroundColor: cat.color }}
                                />
                                <div className="min-w-0 flex-1">
                                    <div className="truncate text-sm font-medium">
                                        <Highlight text={cat.name} query={query} />
                                    </div>
                                    {breadcrumb.length > 0 && (
                                        <div className="truncate text-xs text-gray-400 dark:text-gray-500">
                                            {breadcrumb.join(' › ')}
                                        </div>
                                    )}
                                </div>
                                <ChevronRight className="size-3.5 shrink-0 text-gray-300 dark:text-gray-600" />
                            </Link>
                        ))
                    )}
                </div>
            ) : (
                /* ── Progressive column view ───────────────────────────── */
                <div
                    className="grid divide-x divide-gray-100 dark:divide-gray-800"
                    style={{
                        gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
                        minHeight: 240,
                    }}
                >
                    {/* Column 1: direct children of the trigger category */}
                    <div className="p-3">
                        <Column
                            viewAllSlug={category.slug}
                            viewAllLabel={`All ${category.name}`}
                            viewAllColor={category.color}
                            items={L1s}
                            activeId={activeL1?.id ?? null}
                            onHover={handleHoverL1}
                            isLeaf={maxDepth === 1}
                        />
                    </div>

                    {/* Column 2: children of hovered L1 item */}
                    {gridCols >= 2 && (
                        <div className="p-3">
                            {showL2 && activeL1 ? (
                                <Column
                                    viewAllSlug={activeL1.slug}
                                    viewAllLabel={activeL1.name}
                                    viewAllColor={activeL1.color}
                                    items={L2s}
                                    activeId={activeL2?.id ?? null}
                                    onHover={handleHoverL2}
                                    isLeaf={maxDepth === 2}
                                />
                            ) : (
                                <EmptyColumnHint label="Hover a category" />
                            )}
                        </div>
                    )}

                    {/* Column 3: children of hovered L2 item */}
                    {gridCols >= 3 && (
                        <div className="p-3">
                            {showL3 && activeL2 ? (
                                <Column
                                    viewAllSlug={activeL2.slug}
                                    viewAllLabel={activeL2.name}
                                    viewAllColor={activeL2.color}
                                    items={L3s}
                                    activeId={activeL3?.id ?? null}
                                    onHover={handleHoverL3}
                                    isLeaf={maxDepth === 3}
                                />
                            ) : (
                                <EmptyColumnHint label="Hover a subcategory" />
                            )}
                        </div>
                    )}

                    {/* Column 4: children of hovered L3 item */}
                    {gridCols >= 4 && (
                        <div className="p-3">
                            {showL4 && activeL3 ? (
                                <Column
                                    viewAllSlug={activeL3.slug}
                                    viewAllLabel={activeL3.name}
                                    viewAllColor={activeL3.color}
                                    items={L4s}
                                    activeId={null}
                                    onHover={() => {}}
                                    isLeaf
                                />
                            ) : (
                                <EmptyColumnHint label="Hover a sub-subcategory" />
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ── Footer bar ─────────────────────────────────────────────── */}
            {!isSearching && (
                <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2 dark:border-gray-800">
                    <span className="text-[11px] text-gray-400 dark:text-gray-600">
                        {activeCols > 1 ? `${activeCols} levels visible` : `${L1s.length} subcategories`}
                    </span>
                    <Link
                        href={`/category/${category.slug}`}
                        className="flex items-center gap-1 text-[11px] font-semibold text-red-600 transition-colors hover:text-red-700 dark:text-red-500 dark:hover:text-red-400"
                    >
                        View all {category.name}
                        <ChevronRight className="size-3" />
                    </Link>
                </div>
            )}
        </div>
    );
}

/** Placeholder rendered in a column that has no content yet. */
function EmptyColumnHint({ label }: { label: string }) {
    return (
        <div className="flex h-full min-h-[160px] items-center justify-center">
            <p className="text-center text-xs text-gray-300 dark:text-gray-700">{label}</p>
        </div>
    );
}

// ─── SimpleCategoryList ────────────────────────────────────────────────────────

/**
 * Flat dropdown list for categories with only one level of children.
 * Exported for use in PublicHeader when the category has no grandchildren.
 */
export function SimpleCategoryList({ category }: { category: Category }) {
    const children = category.children ?? [];

    return (
        <div className="w-[300px] py-2">
            <Link
                href={`/category/${category.slug}`}
                className="mx-2 mb-1 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
                <span className="size-2.5 rounded-full" style={{ backgroundColor: category.color }} />
                All {category.name}
                <ChevronRight className="ml-auto size-3.5 text-gray-400" />
            </Link>
            <Separator className="mx-2 mb-1 w-auto" />
            <div className="space-y-0.5 px-2">
                {children.map((child) => (
                    <Link
                        key={child.id}
                        href={`/category/${child.slug}`}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                        <span className="size-1.5 rounded-full" style={{ backgroundColor: child.color }} />
                        {child.name}
                    </Link>
                ))}
            </div>
        </div>
    );
}
