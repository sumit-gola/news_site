import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import axios from 'axios';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Check,
    ChevronDown,
    ChevronRight,
    ChevronsUpDown,
    ExternalLink,
    Eye,
    EyeOff,
    Filter,
    Folder,
    FolderOpen,
    FolderTree,
    GripVertical,
    Loader2,
    MoreHorizontal,
    Pencil,
    Plus,
    Search,
    Tags,
    Trash2,
    X,
} from 'lucide-react';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { toast, ToastProvider } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Category } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Categories', href: '/categories' },
];

interface PageProps {
    categories: Category[];
    allCategories: Category[];   // flat list for comboboxes
    include_inactive: boolean;
    can_manage: boolean;
    flash: { success?: string; error?: string };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function flattenCategories(categories: Category[]): Category[] {
    const result: Category[] = [];
    function walk(cats: Category[]) {
        for (const c of cats) {
            result.push(c);
            if (c.children?.length) walk(c.children);
        }
    }
    walk(categories);
    return result;
}

/** Find a category anywhere in a tree by id. */
function findById(cats: Category[], id: number): Category | null {
    for (const c of cats) {
        if (c.id === id) return c;
        if (c.children?.length) {
            const found = findById(c.children, id);
            if (found) return found;
        }
    }
    return null;
}

/** Update the children array of a specific parent (null = top level). */
function updateSiblings(cats: Category[], parentId: number | null, newSiblings: Category[]): Category[] {
    if (parentId === null) return newSiblings;
    return cats.map((c) => {
        if (c.id === parentId) return { ...c, children: newSiblings };
        if (c.children?.length) return { ...c, children: updateSiblings(c.children, parentId, newSiblings) };
        return c;
    });
}

/** Build a flat combobox option list with depth info, reconstructing tree from flat parent_id list. */
function buildComboboxTree(flatCats: Category[]): { cat: Category; depth: number }[] {
    const childrenMap = new Map<number | null, Category[]>();

    for (const cat of flatCats) {
        const key = cat.parent_id ?? null;
        const arr = childrenMap.get(key) ?? [];
        arr.push(cat);
        childrenMap.set(key, arr);
    }

    const result: { cat: Category; depth: number }[] = [];

    function walk(parentId: number | null, depth: number) {
        const children = childrenMap.get(parentId) ?? [];
        for (const cat of children) {
            result.push({ cat, depth });
            walk(cat.id, depth + 1);
        }
    }

    walk(null, 0);
    return result;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <Card className="border shadow-none">
            <CardContent className="p-4">
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">{label}</p>
                <p className="mt-1 text-2xl font-bold" style={{ color }}>{value}</p>
            </CardContent>
        </Card>
    );
}

// ─── Searchable Category Combobox ─────────────────────────────────────────────

// depth → pill style
const DEPTH_PILL: Record<number, string> = {
    0: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-800',
    1: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:ring-violet-800',
    2: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:ring-orange-800',
};
const DEPTH_PILL_LABELS = ['Main', 'Sub', 'Sub-Sub'];

function CategoryCombobox({
    options,
    value,
    onChange,
    excludeId,
    error,
}: {
    options: Category[];
    value: string;
    onChange: (val: string) => void;
    excludeId?: number;
    error?: string;
}) {
    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = React.useState('');

    const treeOptions = React.useMemo(() => {
        const filtered = options.filter((c) => c.id !== excludeId);
        return buildComboboxTree(filtered);
    }, [options, excludeId]);

    const displayed = React.useMemo(() => {
        const q = query.toLowerCase();
        if (!q) return treeOptions;
        const matchedIds = new Set(
            treeOptions.filter(({ cat }) => cat.name.toLowerCase().includes(q)).map(({ cat }) => cat.id)
        );
        return treeOptions.filter(({ cat }) => matchedIds.has(cat.id));
    }, [treeOptions, query]);

    const selected = options.find((c) => String(c.id) === value);

    // Full breadcrumb for selected item
    const selectedPath = React.useMemo(() => {
        if (!selected) return [];
        const path: Category[] = [selected];
        let cur = selected;
        while (cur.parent_id) {
            const p = options.find((c) => c.id === cur.parent_id);
            if (!p) break;
            path.unshift(p);
            cur = p;
        }
        return path;
    }, [selected, options]);

    return (
        <div className="grid gap-1">
            <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setQuery(''); }}>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        role="combobox"
                        aria-expanded={open}
                        className={cn(
                            'group border-input bg-background flex h-10 w-full items-center justify-between rounded-lg border px-3 text-sm shadow-xs',
                            'transition-all duration-150 hover:border-ring/60 focus:outline-none focus:ring-2 focus:ring-ring/30',
                            open && 'border-ring/60 ring-2 ring-ring/20',
                            error && 'border-destructive focus:ring-destructive/20',
                        )}
                    >
                        {selected ? (
                            <span className="flex min-w-0 items-center gap-2">
                                {/* color swatch */}
                                <span
                                    className="size-3 shrink-0 rounded-sm shadow-sm ring-1 ring-black/10"
                                    style={{ backgroundColor: selected.color }}
                                />
                                {/* breadcrumb */}
                                <span className="flex min-w-0 items-center gap-1 text-xs">
                                    {selectedPath.map((c, i) => (
                                        <React.Fragment key={c.id}>
                                            {i > 0 && <ChevronRight className="text-muted-foreground/50 size-3 shrink-0" />}
                                            <span className={cn(
                                                'truncate',
                                                i === selectedPath.length - 1
                                                    ? 'font-semibold text-foreground'
                                                    : 'text-muted-foreground',
                                            )}>{c.name}</span>
                                        </React.Fragment>
                                    ))}
                                </span>
                            </span>
                        ) : (
                            <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
                                <FolderOpen className="size-3.5 shrink-0 opacity-60" />
                                Top-level category
                            </span>
                        )}
                        <ChevronsUpDown className={cn(
                            'ml-2 size-3.5 shrink-0 transition-transform duration-150',
                            'text-muted-foreground/60 group-hover:text-muted-foreground',
                            open && 'rotate-180',
                        )} />
                    </button>
                </PopoverTrigger>

                <PopoverContent
                    className="overflow-hidden rounded-xl border p-0 shadow-xl"
                    style={{ width: 'var(--radix-popover-trigger-width)' }}
                    align="start"
                    sideOffset={6}
                >
                    {/* Search bar */}
                    <div className="bg-muted/30 flex items-center gap-2 border-b px-3 py-2.5">
                        <Search className="text-muted-foreground size-3.5 shrink-0" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search categories…"
                            className="text-foreground flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                            autoFocus
                        />
                        {query ? (
                            <button
                                type="button"
                                onClick={() => setQuery('')}
                                className="text-muted-foreground hover:text-foreground rounded-full transition-colors"
                            >
                                <X className="size-3.5" />
                            </button>
                        ) : (
                            <span className="text-muted-foreground/40 text-xs">{displayed.length}</span>
                        )}
                    </div>

                    <Command shouldFilter={false}>
                        <CommandList className="max-h-60 overflow-y-auto py-1.5">
                            {displayed.length === 0 && (
                                <div className="text-muted-foreground px-4 py-6 text-center text-xs">
                                    No categories match "{query}"
                                </div>
                            )}

                            {/* None option */}
                            <CommandGroup>
                                <CommandItem
                                    value=""
                                    onSelect={() => { onChange(''); setOpen(false); setQuery(''); }}
                                    className={cn(
                                        'mx-1.5 flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
                                        value === '' ? 'bg-accent' : 'hover:bg-accent/60',
                                    )}
                                >
                                    <span className={cn(
                                        'flex size-5 shrink-0 items-center justify-center rounded-md',
                                        value === '' ? 'bg-primary text-primary-foreground' : 'bg-muted',
                                    )}>
                                        {value === ''
                                            ? <Check className="size-3" />
                                            : <FolderOpen className="text-muted-foreground size-3" />
                                        }
                                    </span>
                                    <span className={cn(
                                        'flex-1 text-sm',
                                        value === '' ? 'font-medium' : 'text-muted-foreground',
                                    )}>
                                        None — top-level category
                                    </span>
                                </CommandItem>
                            </CommandGroup>

                            {/* Category items */}
                            <CommandGroup>
                                {displayed.map(({ cat, depth }) => {
                                    const isSelected = value === String(cat.id);
                                    const pillCls = DEPTH_PILL[Math.min(depth, 2)];
                                    const pillLabel = DEPTH_PILL_LABELS[Math.min(depth, 2)];
                                    return (
                                        <CommandItem
                                            key={cat.id}
                                            value={String(cat.id)}
                                            onSelect={() => { onChange(String(cat.id)); setOpen(false); setQuery(''); }}
                                            className={cn(
                                                'mx-1.5 flex cursor-pointer items-center gap-2.5 rounded-lg py-2 pr-2.5 text-sm transition-colors',
                                                isSelected ? 'bg-accent' : 'hover:bg-accent/60',
                                            )}
                                            style={{ paddingLeft: `${depth * 14 + 10}px` }}
                                        >
                                            {/* Check / connector */}
                                            <span className={cn(
                                                'flex size-5 shrink-0 items-center justify-center rounded-md transition-colors',
                                                isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted',
                                            )}>
                                                {isSelected
                                                    ? <Check className="size-3" />
                                                    : depth === 0
                                                        ? <Folder className="text-muted-foreground size-3" />
                                                        : <span className="text-muted-foreground/50 font-mono text-[10px]">└</span>
                                                }
                                            </span>

                                            {/* Color dot */}
                                            <span
                                                className="size-2.5 shrink-0 rounded-full shadow-sm ring-1 ring-black/10"
                                                style={{ backgroundColor: cat.color }}
                                            />

                                            {/* Name */}
                                            <span className={cn(
                                                'flex-1 truncate',
                                                isSelected ? 'font-semibold' : 'font-medium',
                                                !cat.is_active && 'opacity-50',
                                            )}>
                                                {cat.name}
                                            </span>

                                            {/* Depth pill */}
                                            <span className={cn(
                                                'shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none',
                                                pillCls,
                                            )}>
                                                {pillLabel}
                                            </span>

                                            {!cat.is_active && (
                                                <span className="text-muted-foreground bg-muted shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none">
                                                    Off
                                                </span>
                                            )}
                                        </CommandItem>
                                    );
                                })}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            {error && <p className="text-destructive text-xs">{error}</p>}
        </div>
    );
}

// ─── Category Form Modal ──────────────────────────────────────────────────────

function CategoryFormModal({
    open,
    onClose,
    editCategory,
    defaultParentId,
    allCategories,
}: {
    open: boolean;
    onClose: () => void;
    editCategory: Category | null;
    defaultParentId?: number | null;
    allCategories: Category[];
}) {
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name:        editCategory?.name ?? '',
        description: editCategory?.description ?? '',
        parent_id:   editCategory?.parent_id
            ? String(editCategory.parent_id)
            : defaultParentId ? String(defaultParentId) : '',
        color:       editCategory?.color ?? '#6366f1',
        is_active:   editCategory?.is_active ?? true,
    });

    React.useEffect(() => {
        if (open) {
            setData({
                name:        editCategory?.name ?? '',
                description: editCategory?.description ?? '',
                parent_id:   editCategory?.parent_id
                    ? String(editCategory.parent_id)
                    : defaultParentId ? String(defaultParentId) : '',
                color:       editCategory?.color ?? '#6366f1',
                is_active:   editCategory?.is_active ?? true,
            });
            clearErrors();
        }
    }, [open, editCategory, defaultParentId]);

    const submit = (e: React.SyntheticEvent) => {
        e.preventDefault();
        const payload = { ...data, parent_id: data.parent_id ? Number(data.parent_id) : null };
        setData(payload as any);
        if (editCategory) {
            put(`/categories/${editCategory.slug}`, {
                onSuccess: () => { toast.success('Category updated.'); reset(); onClose(); },
            });
        } else {
            post('/categories', {
                onSuccess: () => { toast.success('Category created.'); reset(); onClose(); },
            });
        }
    };

    // Exclude self + descendants from parent options
    const comboboxOptions = React.useMemo(() => {
        if (!editCategory) return allCategories;
        // Build descendant id set by walking allCategories as tree
        const descendantIds = new Set<number>();
        function markDescendants(id: number) {
            for (const c of allCategories) {
                if (c.parent_id === id) {
                    descendantIds.add(c.id);
                    markDescendants(c.id);
                }
            }
        }
        descendantIds.add(editCategory.id);
        markDescendants(editCategory.id);
        return allCategories.filter((c) => !descendantIds.has(c.id));
    }, [allCategories, editCategory]);

    // Depth label helper
    const parentCat = allCategories.find((c) => String(c.id) === data.parent_id);
    const grandparentCat = parentCat ? allCategories.find((c) => c.id === parentCat.parent_id) : null;
    const depthLabel = !data.parent_id ? 'Main category' : grandparentCat ? 'Sub-sub category (level 3)' : 'Subcategory (level 2)';

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div
                            className="flex size-8 items-center justify-center rounded-lg"
                            style={{ backgroundColor: (data.color || '#6366f1') + '20' }}
                        >
                            <Tags className="size-4" style={{ color: data.color || '#6366f1' }} />
                        </div>
                        {editCategory ? `Edit "${editCategory.name}"` : 'New Category'}
                    </DialogTitle>
                    <DialogDescription>
                        {editCategory ? 'Update category details below.' : 'Fill in the details to create a new category.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="grid gap-4 py-1">
                    {/* Name */}
                    <div className="grid gap-1.5">
                        <Label htmlFor="name">
                            Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="e.g. Technology"
                            autoFocus
                        />
                        {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
                    </div>

                    {/* Description */}
                    <div className="grid gap-1.5">
                        <Label htmlFor="description">Description</Label>
                        <textarea
                            id="description"
                            value={data.description ?? ''}
                            onChange={(e) => setData('description', e.target.value)}
                            placeholder="Optional description…"
                            rows={2}
                            className="border-input bg-background text-foreground placeholder:text-muted-foreground w-full rounded-md border px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-1"
                        />
                    </div>

                    {/* Parent + Color row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-1.5">
                            <div className="flex items-center justify-between">
                                <Label>Parent Category</Label>
                                <span className="text-muted-foreground text-[10px]">{depthLabel}</span>
                            </div>
                            <CategoryCombobox
                                options={comboboxOptions}
                                value={data.parent_id}
                                onChange={(v) => setData('parent_id', v)}
                                error={errors.parent_id}
                            />
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="color">Color</Label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    id="color"
                                    value={data.color}
                                    onChange={(e) => setData('color', e.target.value)}
                                    className="h-9 w-10 cursor-pointer rounded-md border p-1"
                                />
                                <Input
                                    value={data.color}
                                    onChange={(e) => setData('color', e.target.value)}
                                    placeholder="#6366f1"
                                    className="font-mono text-xs"
                                />
                            </div>
                            {/* Color preview */}
                            <div
                                className="flex items-center gap-2 rounded-md px-2 py-1 text-xs font-medium text-white"
                                style={{ backgroundColor: data.color || '#6366f1' }}
                            >
                                <span className="size-1.5 rounded-full bg-white/40" />
                                {data.name || 'Preview'}
                            </div>
                        </div>
                    </div>

                    {/* Active toggle */}
                    <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
                        <div>
                            <p className="text-sm font-medium">Active</p>
                            <p className="text-muted-foreground text-xs">Show in navigation &amp; listings</p>
                        </div>
                        <Switch
                            id="is_active"
                            checked={data.is_active}
                            onCheckedChange={(v) => setData('is_active', v)}
                        />
                    </div>

                    <DialogFooter className="pt-1">
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={processing}>
                            {processing && <Loader2 className="mr-1.5 size-4 animate-spin" />}
                            {editCategory ? 'Save Changes' : 'Create Category'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ─── Delete Dialog ────────────────────────────────────────────────────────────

function DeleteDialog({ open, onClose, category }: { open: boolean; onClose: () => void; category: Category | null }) {
    const [processing, setProcessing] = React.useState(false);

    const handleDelete = () => {
        if (!category) return;
        setProcessing(true);
        router.delete(`/categories/${category.slug}`, {
            onSuccess: () => { toast.success('Category deleted.'); onClose(); },
            onError: (errs) => { toast.error(String(Object.values(errs)[0] ?? 'Could not delete.')); onClose(); },
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle className="text-destructive flex items-center gap-2">
                        <Trash2 className="size-5" /> Delete Category
                    </DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete <strong>{category?.name}</strong>?
                        {(category?.children?.length ?? 0) > 0 && (
                            <span className="text-destructive mt-1 block text-xs">
                                This category has subcategories and cannot be deleted.
                            </span>
                        )}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={processing}>
                        {processing && <Loader2 className="mr-1.5 size-4 animate-spin" />}
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Bulk Delete Dialog ───────────────────────────────────────────────────────

function BulkDeleteDialog({ open, onClose, count, onConfirm, processing }: {
    open: boolean; onClose: () => void; count: number; onConfirm: () => void; processing: boolean;
}) {
    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle className="text-destructive flex items-center gap-2">
                        <Trash2 className="size-5" /> Delete {count} {count === 1 ? 'Category' : 'Categories'}
                    </DialogTitle>
                    <DialogDescription>
                        Permanently deletes {count} selected {count === 1 ? 'category' : 'categories'}.
                        Categories with subcategories or articles cannot be deleted.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button variant="destructive" onClick={onConfirm} disabled={processing}>
                        {processing && <Loader2 className="mr-1.5 size-4 animate-spin" />}
                        Delete Selected
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Sortable Category Row ────────────────────────────────────────────────────

const DEPTH_BADGE_VARIANT: Record<number, string> = {
    0: 'secondary',
    1: 'outline',
    2: 'outline',
};

const DEPTH_ROW_LABELS: Record<number, string> = {
    0: 'Main',
    1: 'Sub',
    2: 'Sub-Sub',
};

function SortableCategoryRow({
    category,
    depth,
    canManage,
    selected,
    expanded,
    onToggleExpand,
    onSelect,
    onEdit,
    onDelete,
    onAddSub,
    onToggleStatus,
}: {
    category: Category;
    depth: number;
    canManage: boolean;
    selected: boolean;
    expanded: boolean;
    onToggleExpand: (id: number) => void;
    onSelect: (id: number, checked: boolean) => void;
    onEdit: (c: Category) => void;
    onDelete: (c: Category) => void;
    onAddSub: (parent: Category) => void;
    onToggleStatus: (c: Category) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: category.id,
    });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        position: 'relative',
        zIndex: isDragging ? 1 : undefined,
    };

    const hasChildren = (category.children?.length ?? 0) > 0;

    return (
        <tr
            ref={setNodeRef}
            style={style}
            className={cn(
                'border-b transition-colors',
                selected ? 'bg-primary/5' : 'hover:bg-muted/40',
                isDragging && 'bg-muted shadow-lg',
            )}
        >
            {/* Drag handle */}
            {canManage && (
                <td className="w-8 px-1 py-3">
                    <button
                        {...attributes}
                        {...listeners}
                        className="text-muted-foreground/40 hover:text-muted-foreground flex cursor-grab items-center justify-center rounded p-1 active:cursor-grabbing"
                        title="Drag to reorder"
                    >
                        <GripVertical className="size-4" />
                    </button>
                </td>
            )}

            {/* Checkbox */}
            {canManage && (
                <td className="w-8 px-1 py-3">
                    <Checkbox
                        checked={selected}
                        onCheckedChange={(v) => onSelect(category.id, !!v)}
                    />
                </td>
            )}

            {/* Name */}
            <td className="px-3 py-3">
                <div className="flex items-center gap-2" style={{ paddingLeft: depth * 24 }}>
                    {depth > 0 && (
                        <span className="text-muted-foreground/30 mr-1 select-none font-mono text-xs">
                            {'└'.repeat(1)}
                        </span>
                    )}
                    {hasChildren ? (
                        <button
                            onClick={() => onToggleExpand(category.id)}
                            className="text-muted-foreground hover:text-foreground shrink-0 rounded p-0.5 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                        </button>
                    ) : (
                        <span className="size-5 shrink-0" />
                    )}

                    <span
                        className="inline-block size-3 shrink-0 rounded-full ring-1 ring-black/10"
                        style={{ backgroundColor: category.color }}
                    />
                    <span className={cn('font-medium', depth === 0 ? 'text-sm' : 'text-sm text-muted-foreground')}>
                        {category.name}
                    </span>
                    <Badge
                        variant={DEPTH_BADGE_VARIANT[depth] as any}
                        className="text-[10px] px-1.5 py-0"
                    >
                        {DEPTH_ROW_LABELS[depth] ?? `L${depth + 1}`}
                    </Badge>
                </div>
            </td>

            {/* Slug */}
            <td className="text-muted-foreground hidden px-3 py-3 font-mono text-xs md:table-cell">
                {category.slug}
            </td>

            {/* Children count */}
            <td className="text-muted-foreground hidden px-3 py-3 text-center text-sm lg:table-cell">
                {hasChildren
                    ? <span className="text-foreground font-medium">{category.children!.length}</span>
                    : <span className="text-xs">—</span>}
            </td>

            {/* Status */}
            <td className="px-3 py-3">
                <span className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                    category.is_active
                        ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
                )}>
                    <span className={cn('size-1.5 rounded-full', category.is_active ? 'bg-green-500' : 'bg-gray-400')} />
                    {category.is_active ? 'Active' : 'Inactive'}
                </span>
            </td>

            {/* Actions */}
            {canManage && (
                <td className="px-2 py-3">
                    <div className="flex items-center justify-end gap-0.5">
                        <Button variant="ghost" size="icon" className="size-7" onClick={() => onEdit(category)} title="Edit">
                            <Pencil className="size-3.5" />
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-7">
                                    <MoreHorizontal className="size-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
                                    {category.name}
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => onEdit(category)}>
                                    <Pencil className="mr-2 size-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onAddSub(category)}>
                                    <Plus className="mr-2 size-4" />
                                    {depth === 0 ? 'Add Subcategory' : 'Add Sub-Subcategory'}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onToggleStatus(category)}>
                                    {category.is_active
                                        ? <><EyeOff className="mr-2 size-4" /> Deactivate</>
                                        : <><Eye className="mr-2 size-4" /> Activate</>}
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href={`/category/${category.slug}`} target="_blank" className="flex items-center">
                                        <ExternalLink className="mr-2 size-4" /> View on site
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => onDelete(category)}
                                >
                                    <Trash2 className="mr-2 size-4" /> Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </td>
            )}
        </tr>
    );
}

/** Lightweight drag overlay row */
function DragOverlayRow({ category, depth }: { category: Category; depth: number }) {
    return (
        <tr className="bg-background/95 shadow-2xl ring-2 ring-primary/20 rounded-lg">
            <td className="w-8 px-1 py-3"><GripVertical className="size-4 text-muted-foreground/40 mx-auto" /></td>
            <td className="w-8 px-1 py-3" />
            <td className="px-3 py-3">
                <div className="flex items-center gap-2" style={{ paddingLeft: depth * 24 }}>
                    <span className="inline-block size-3 rounded-full ring-1 ring-black/10" style={{ backgroundColor: category.color }} />
                    <span className="font-medium text-sm">{category.name}</span>
                </div>
            </td>
            <td colSpan={4} />
        </tr>
    );
}

// ─── Recursive rows renderer ──────────────────────────────────────────────────

function renderRows(
    cats: Category[],
    depth: number,
    props: {
        canManage: boolean;
        selected: Set<number>;
        expanded: Set<number>;
        forceExpanded: boolean | null;
        onToggleExpand: (id: number) => void;
        onSelect: (id: number, checked: boolean) => void;
        onEdit: (c: Category) => void;
        onDelete: (c: Category) => void;
        onAddSub: (parent: Category) => void;
        onToggleStatus: (c: Category) => void;
    },
): React.ReactNode {
    const { expanded, forceExpanded } = props;

    return cats.map((cat) => {
        const isExpanded = forceExpanded !== null ? forceExpanded : expanded.has(cat.id);
        const hasChildren = (cat.children?.length ?? 0) > 0;

        return (
            <React.Fragment key={cat.id}>
                <SortableCategoryRow
                    category={cat}
                    depth={depth}
                    canManage={props.canManage}
                    selected={props.selected.has(cat.id)}
                    expanded={isExpanded}
                    onToggleExpand={props.onToggleExpand}
                    onSelect={props.onSelect}
                    onEdit={props.onEdit}
                    onDelete={props.onDelete}
                    onAddSub={props.onAddSub}
                    onToggleStatus={props.onToggleStatus}
                />
                {hasChildren && isExpanded && (
                    <SortableContext
                        items={cat.children!.map((c) => c.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {renderRows(cat.children!, depth + 1, props)}
                    </SortableContext>
                )}
            </React.Fragment>
        );
    });
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CategoriesIndex({
    categories,
    allCategories,
    include_inactive,
    can_manage,
    flash,
}: PageProps) {
    React.useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error)   toast.error(flash.error);
    }, [flash]);

    // ── local state ──────────────────────────────────────────────────────────
    const [orderedCats, setOrderedCats]       = React.useState(categories);
    const [showInactive, setShowInactive]     = React.useState(include_inactive);
    const [search, setSearch]                 = React.useState('');
    const [statusFilter, setStatusFilter]     = React.useState<'all' | 'active' | 'inactive'>('all');
    const [typeFilter, setTypeFilter]         = React.useState<'all' | 'main' | 'sub'>('all');
    const [expanded, setExpanded]             = React.useState<Set<number>>(() => new Set(categories.map((c) => c.id)));
    const [forceExpanded, setForceExpanded]   = React.useState<boolean | null>(null);

    const [modalOpen, setModalOpen]           = React.useState(false);
    const [editCategory, setEditCategory]     = React.useState<Category | null>(null);
    const [defaultParent, setDefaultParent]   = React.useState<number | null>(null);
    const [deleteTarget, setDeleteTarget]     = React.useState<Category | null>(null);
    const [selected, setSelected]             = React.useState<Set<number>>(new Set());
    const [bulkDeleteOpen, setBulkDeleteOpen] = React.useState(false);
    const [bulkProcessing, setBulkProcessing] = React.useState(false);
    const [activeId, setActiveId]             = React.useState<number | null>(null);

    // Sync orderedCats when server data changes (after mutations)
    React.useEffect(() => { setOrderedCats(categories); }, [categories]);

    // ── DnD sensors ──────────────────────────────────────────────────────────
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const handleDragStart = ({ active }: DragStartEvent) => {
        setActiveId(Number(active.id));
    };

    const handleDragEnd = ({ active, over }: DragEndEvent) => {
        setActiveId(null);
        if (!over || active.id === over.id) return;

        const activeItemId = Number(active.id);
        const overItemId   = Number(over.id);

        // Find both items in tree and get their parent
        const activeInFlat = flattenCategories(orderedCats).find((c) => c.id === activeItemId);
        const overInFlat   = flattenCategories(orderedCats).find((c) => c.id === overItemId);

        if (!activeInFlat || !overInFlat || activeInFlat.parent_id !== overInFlat.parent_id) return;

        const parentId = activeInFlat.parent_id ?? null;

        // Get the siblings array
        let siblings: Category[];
        if (parentId === null) {
            siblings = orderedCats;
        } else {
            const parent = findById(orderedCats, parentId);
            siblings = parent?.children ?? [];
        }

        const oldIdx = siblings.findIndex((c) => c.id === activeItemId);
        const newIdx = siblings.findIndex((c) => c.id === overItemId);
        if (oldIdx === -1 || newIdx === -1) return;

        const newSiblings = arrayMove(siblings, oldIdx, newIdx);
        const newOrdered  = parentId === null ? newSiblings : updateSiblings(orderedCats, parentId, newSiblings);
        setOrderedCats(newOrdered);

        // Persist to server via axios (controller returns JSON, not Inertia response)
        const payload = newSiblings.map((c, idx) => ({ id: c.id, order: idx, parent_id: c.parent_id ?? null }));
        axios.post('/categories/reorder', { categories: payload })
            .then(() => toast.success('Order saved.'))
            .catch(() => { toast.error('Failed to save order.'); setOrderedCats(categories); });
    };

    // ── filter ───────────────────────────────────────────────────────────────
    const filteredCats = React.useMemo(() => {
        const q = search.trim().toLowerCase();
        return orderedCats.filter((cat) => {
            if (typeFilter === 'main' && cat.parent_id !== null) return false;
            if (typeFilter === 'sub'  && cat.parent_id === null)  return false;
            if (statusFilter === 'active'   && !cat.is_active) return false;
            if (statusFilter === 'inactive' &&  cat.is_active) return false;
            if (q) {
                const self = cat.name.toLowerCase().includes(q) || cat.slug.toLowerCase().includes(q);
                const child = flattenCategories(cat.children ?? []).some(
                    (ch) => ch.name.toLowerCase().includes(q) || ch.slug.toLowerCase().includes(q),
                );
                if (!self && !child) return false;
            }
            return true;
        });
    }, [orderedCats, search, statusFilter, typeFilter]);

    // ── stats ─────────────────────────────────────────────────────────────────
    const allFlat     = React.useMemo(() => flattenCategories(orderedCats), [orderedCats]);
    const totalCount  = allFlat.length;
    const activeCount = allFlat.filter((c) => c.is_active).length;
    const mainCount   = orderedCats.filter((c) => !c.parent_id).length;
    const subCount    = allFlat.filter((c) => !!c.parent_id).length;

    // ── selection ─────────────────────────────────────────────────────────────
    const allVisibleIds = React.useMemo(
        () => flattenCategories(filteredCats).map((c) => c.id),
        [filteredCats],
    );
    const allSelected  = allVisibleIds.length > 0 && allVisibleIds.every((id) => selected.has(id));
    const someSelected = allVisibleIds.some((id) => selected.has(id));
    const selectedCount = allVisibleIds.filter((id) => selected.has(id)).length;

    const toggleSelect    = (id: number, checked: boolean) => setSelected((prev) => { const n = new Set(prev); checked ? n.add(id) : n.delete(id); return n; });
    const toggleSelectAll = (checked: boolean) => setSelected(checked ? new Set(allVisibleIds) : new Set());

    // ── handlers ──────────────────────────────────────────────────────────────
    const toggleInactive = (v: boolean) => {
        setShowInactive(v);
        router.get('/categories', { include_inactive: v ? '1' : '' }, { preserveState: true, replace: true });
    };

    const toggleExpand = (id: number) => setExpanded((prev) => {
        const n = new Set(prev);
        n.has(id) ? n.delete(id) : n.add(id);
        return n;
    });

    const openCreate   = () => { setEditCategory(null); setDefaultParent(null); setModalOpen(true); };
    const openEdit     = (c: Category) => { setEditCategory(c); setDefaultParent(null); setModalOpen(true); };
    const openAddSub   = (parent: Category) => { setEditCategory(null); setDefaultParent(parent.id); setModalOpen(true); };

    const toggleStatus = (cat: Category) => {
        router.put(`/categories/${cat.slug}`, { ...cat, is_active: !cat.is_active, parent_id: cat.parent_id ?? null }, {
            preserveState: true,
            onSuccess: () => toast.success(`${cat.name} ${cat.is_active ? 'deactivated' : 'activated'}.`),
        });
    };

    const handleBulkDelete = () => {
        setBulkProcessing(true);
        const ids = [...selected];
        let done = 0; let errCount = 0;
        ids.forEach((id) => {
            const cat = allFlat.find((c) => c.id === id);
            if (!cat) { done++; return; }
            router.delete(`/categories/${cat.slug}`, {
                preserveState: true,
                onSuccess: () => { done++; },
                onError:   () => { done++; errCount++; },
                onFinish: () => {
                    if (done === ids.length) {
                        setBulkProcessing(false); setBulkDeleteOpen(false); setSelected(new Set());
                        errCount > 0
                            ? toast.error(`${errCount} could not be deleted.`)
                            : toast.success(`${ids.length - errCount} deleted.`);
                        router.reload();
                    }
                },
            });
        });
    };

    const clearFilters = () => { setSearch(''); setStatusFilter('all'); setTypeFilter('all'); };
    const hasFilters   = search || statusFilter !== 'all' || typeFilter !== 'all';

    // active drag item for overlay
    const activeDragCat = activeId ? flattenCategories(orderedCats).find((c) => c.id === activeId) : null;
    const activeDragDepth = activeDragCat ? (activeDragCat.parent_id === null ? 0 : 1) : 0;

    const colCount = can_manage ? 7 : 4;

    const rowProps = {
        canManage: can_manage,
        selected,
        expanded,
        forceExpanded,
        onToggleExpand: toggleExpand,
        onSelect: toggleSelect,
        onEdit: openEdit,
        onDelete: setDeleteTarget,
        onAddSub: openAddSub,
        onToggleStatus: toggleStatus,
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Categories" />
            <ToastProvider />

            <div className="flex flex-1 flex-col gap-6 p-6">

                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
                        <p className="text-muted-foreground text-sm">Manage content categories, subcategories &amp; hierarchy</p>
                    </div>
                    {can_manage && (
                        <Button onClick={openCreate}>
                            <Plus className="mr-1.5 size-4" /> New Category
                        </Button>
                    )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <StatCard label="Total" value={totalCount} color="hsl(var(--foreground))" />
                    <StatCard label="Active" value={activeCount} color="#16a34a" />
                    <StatCard label="Main" value={mainCount} color="#6366f1" />
                    <StatCard label="Sub / Sub-Sub" value={subCount} color="#f59e0b" />
                </div>

                {/* Filter toolbar */}
                <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3">
                    <div className="relative min-w-[200px] flex-1">
                        <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                        <Input
                            placeholder="Search by name or slug…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 h-8 text-sm"
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="text-muted-foreground hover:text-foreground absolute right-2 top-1/2 -translate-y-1/2">
                                <X className="size-3.5" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-1 rounded-md border bg-background p-1">
                        {(['all', 'active', 'inactive'] as const).map((s) => (
                            <button key={s} onClick={() => setStatusFilter(s)}
                                className={cn('rounded px-3 py-1 text-xs font-medium capitalize transition-colors',
                                    statusFilter === s ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
                                {s}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-1 rounded-md border bg-background p-1">
                        {(['all', 'main', 'sub'] as const).map((t) => (
                            <button key={t} onClick={() => setTypeFilter(t)}
                                className={cn('rounded px-3 py-1 text-xs font-medium capitalize transition-colors',
                                    typeFilter === t ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
                                {t === 'all' ? 'All types' : t === 'main' ? 'Main' : 'Sub'}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 border-l pl-3">
                        <Switch id="show-inactive" checked={showInactive} onCheckedChange={toggleInactive} />
                        <Label htmlFor="show-inactive" className="text-xs whitespace-nowrap">Inactive</Label>
                    </div>

                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs"
                            onClick={() => { setForceExpanded(true); setExpanded(new Set(allFlat.map((c) => c.id))); }}>
                            <FolderOpen className="size-3.5" /> Expand all
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs"
                            onClick={() => { setForceExpanded(false); setExpanded(new Set()); }}>
                            <FolderTree className="size-3.5" /> Collapse all
                        </Button>
                    </div>

                    {hasFilters && (
                        <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={clearFilters}>
                            <X className="size-3.5" /> Clear
                        </Button>
                    )}
                </div>

                {/* Bulk bar */}
                {selectedCount > 0 && (
                    <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5">
                        <span className="text-sm font-medium">{selectedCount} selected</span>
                        <div className="ml-auto flex items-center gap-2">
                            <Button variant="destructive" size="sm" className="h-7 gap-1.5 text-xs"
                                onClick={() => setBulkDeleteOpen(true)}>
                                <Trash2 className="size-3.5" /> Delete selected
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelected(new Set())}>
                                Clear
                            </Button>
                        </div>
                    </div>
                )}

                {/* DnD + Table */}
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    modifiers={[restrictToVerticalAxis]}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="overflow-hidden rounded-lg border">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-muted/50 border-b">
                                    {can_manage && <th className="w-8 px-1 py-3" title="Drag to reorder"><GripVertical className="size-3.5 text-muted-foreground/40 mx-auto" /></th>}
                                    {can_manage && (
                                        <th className="w-8 px-1 py-3">
                                            <Checkbox
                                                checked={allSelected}
                                                onCheckedChange={toggleSelectAll}
                                                className={someSelected && !allSelected ? 'opacity-50' : ''}
                                            />
                                        </th>
                                    )}
                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                                        <span className="flex items-center gap-1.5"><Filter className="size-3" /> Name</span>
                                    </th>
                                    <th className="hidden px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider md:table-cell">Slug</th>
                                    <th className="hidden px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider lg:table-cell">Children</th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider">Status</th>
                                    {can_manage && <th className="w-20 px-2 py-3" />}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCats.length === 0 ? (
                                    <tr>
                                        <td colSpan={colCount} className="text-muted-foreground py-16 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <Tags className="size-10 opacity-20" />
                                                <div>
                                                    <p className="font-medium">{hasFilters ? 'No categories match filters' : 'No categories found'}</p>
                                                    {hasFilters
                                                        ? <button className="text-primary mt-1 text-sm underline" onClick={clearFilters}>Clear filters</button>
                                                        : can_manage && <button className="text-primary mt-1 text-sm underline" onClick={openCreate}>Create the first category</button>
                                                    }
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    <SortableContext
                                        items={filteredCats.map((c) => c.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {renderRows(filteredCats, 0, rowProps)}
                                    </SortableContext>
                                )}
                            </tbody>
                        </table>

                        {filteredCats.length > 0 && (
                            <div className="bg-muted/30 border-t px-4 py-2 text-xs text-muted-foreground flex items-center justify-between">
                                <span>
                                    {filteredCats.length} main categor{filteredCats.length !== 1 ? 'ies' : 'y'}
                                    {' · '}{subCount} sub/sub-sub
                                    {hasFilters && ' (filtered)'}
                                </span>
                                <span className="flex items-center gap-1 opacity-60">
                                    <GripVertical className="size-3" /> Drag rows to reorder
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Drag overlay */}
                    <DragOverlay>
                        {activeDragCat && (
                            <table className="w-full rounded-lg shadow-2xl ring-2 ring-primary/20">
                                <tbody>
                                    <DragOverlayRow category={activeDragCat} depth={activeDragDepth} />
                                </tbody>
                            </table>
                        )}
                    </DragOverlay>
                </DndContext>
            </div>

            {/* Modals */}
            <CategoryFormModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                editCategory={editCategory}
                defaultParentId={defaultParent}
                allCategories={allCategories}
            />
            <DeleteDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} category={deleteTarget} />
            <BulkDeleteDialog
                open={bulkDeleteOpen}
                onClose={() => setBulkDeleteOpen(false)}
                count={selectedCount}
                onConfirm={handleBulkDelete}
                processing={bulkProcessing}
            />
        </AppLayout>
    );
}
