import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ChevronDown,
    ChevronRight,
    ExternalLink,
    Eye,
    EyeOff,
    Filter,
    FolderOpen,
    FolderTree,
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
import { Switch } from '@/components/ui/switch';
import { toast, ToastProvider } from '@/components/ui/toast';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Category } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Categories', href: '/categories' },
];

interface PageProps {
    categories: Category[];
    include_inactive: boolean;
    can_manage: boolean;
    flash: { success?: string; error?: string };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function flattenCategories(categories: Category[]): Category[] {
    const result: Category[] = [];
    for (const cat of categories) {
        result.push(cat);
        if (cat.children?.length) result.push(...cat.children);
    }
    return result;
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

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

// ── Category Form Modal ───────────────────────────────────────────────────────

function CategoryFormModal({
    open,
    onClose,
    editCategory,
    defaultParentId,
    parentCategories,
}: {
    open: boolean;
    onClose: () => void;
    editCategory: Category | null;
    defaultParentId?: number | null;
    parentCategories: Category[];
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

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Tags className="size-5" />
                        {editCategory ? 'Edit Category' : 'New Category'}
                    </DialogTitle>
                    <DialogDescription>
                        {editCategory ? 'Update category details.' : 'Create a new category.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="grid gap-4 py-2">
                    <div className="grid gap-1.5">
                        <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="e.g. Technology"
                        />
                        {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="description">Description</Label>
                        <textarea
                            id="description"
                            value={data.description ?? ''}
                            onChange={(e) => setData('description', e.target.value)}
                            placeholder="Optional description..."
                            rows={3}
                            className="border-input bg-background text-foreground placeholder:text-muted-foreground w-full rounded-md border px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-1"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-1.5">
                            <Label htmlFor="parent_id">Parent Category</Label>
                            <select
                                id="parent_id"
                                value={data.parent_id}
                                onChange={(e) => setData('parent_id', e.target.value)}
                                className="border-input bg-background text-foreground flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1"
                            >
                                <option value="">None (main category)</option>
                                {parentCategories
                                    .filter((c) => !editCategory || c.id !== editCategory.id)
                                    .map((c) => (
                                        <option key={c.id} value={String(c.id)}>{c.name}</option>
                                    ))}
                            </select>
                            {errors.parent_id && <p className="text-destructive text-xs">{errors.parent_id}</p>}
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
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Switch
                            id="is_active"
                            checked={data.is_active}
                            onCheckedChange={(v) => setData('is_active', v)}
                        />
                        <Label htmlFor="is_active">Active</Label>
                    </div>

                    <DialogFooter className="pt-2">
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

// ── Delete Confirmation ───────────────────────────────────────────────────────

function DeleteDialog({
    open,
    onClose,
    category,
}: {
    open: boolean;
    onClose: () => void;
    category: Category | null;
}) {
    const [processing, setProcessing] = React.useState(false);

    const handleDelete = () => {
        if (!category) return;
        setProcessing(true);
        router.delete(`/categories/${category.slug}`, {
            onSuccess: () => { toast.success('Category deleted.'); onClose(); },
            onError: (errs) => {
                const msg = Object.values(errs)[0];
                if (msg) toast.error(String(msg));
                onClose();
            },
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
                        {category?.children && category.children.length > 0 && (
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

// ── Bulk Delete Confirmation ──────────────────────────────────────────────────

function BulkDeleteDialog({
    open,
    onClose,
    count,
    onConfirm,
    processing,
}: {
    open: boolean;
    onClose: () => void;
    count: number;
    onConfirm: () => void;
    processing: boolean;
}) {
    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle className="text-destructive flex items-center gap-2">
                        <Trash2 className="size-5" /> Delete {count} {count === 1 ? 'Category' : 'Categories'}
                    </DialogTitle>
                    <DialogDescription>
                        This will permanently delete {count} selected {count === 1 ? 'category' : 'categories'}.
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

// ── Category Row ──────────────────────────────────────────────────────────────

function CategoryRow({
    category,
    depth,
    canManage,
    selected,
    onSelect,
    onEdit,
    onDelete,
    onAddSub,
    onToggleStatus,
    forceExpanded,
}: {
    category: Category;
    depth: number;
    canManage: boolean;
    selected: boolean;
    onSelect: (id: number, checked: boolean) => void;
    onEdit: (c: Category) => void;
    onDelete: (c: Category) => void;
    onAddSub: (parent: Category) => void;
    onToggleStatus: (c: Category) => void;
    forceExpanded: boolean | null; // null = local control
}) {
    const [localExpanded, setLocalExpanded] = React.useState(true);
    const expanded = forceExpanded !== null ? forceExpanded : localExpanded;
    const hasChildren = (category.children?.length ?? 0) > 0;

    return (
        <>
            <tr className={`hover:bg-muted/40 border-b transition-colors ${selected ? 'bg-primary/5' : ''}`}>
                {/* Checkbox */}
                <td className="w-10 px-3 py-3">
                    {canManage && (
                        <Checkbox
                            checked={selected}
                            onCheckedChange={(v) => onSelect(category.id, !!v)}
                        />
                    )}
                </td>

                {/* Name */}
                <td className="px-3 py-3">
                    <div className="flex items-center gap-2" style={{ paddingLeft: depth * 20 }}>
                        {hasChildren ? (
                            <button
                                onClick={() => setLocalExpanded((v) => !v)}
                                className="text-muted-foreground hover:text-foreground shrink-0 rounded p-0.5 hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                {expanded
                                    ? <ChevronDown className="size-4" />
                                    : <ChevronRight className="size-4" />}
                            </button>
                        ) : (
                            <span className="size-5 shrink-0" />
                        )}

                        {/* Color dot */}
                        <span
                            className="inline-block size-3 shrink-0 rounded-full ring-1 ring-black/10"
                            style={{ backgroundColor: category.color }}
                        />

                        <span className="font-medium">{category.name}</span>

                        {depth === 0 && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Main</Badge>
                        )}
                        {depth > 0 && (
                            <Badge variant="outline" className="text-muted-foreground text-[10px] px-1.5 py-0">Sub</Badge>
                        )}
                    </div>
                </td>

                {/* Slug */}
                <td className="text-muted-foreground hidden px-3 py-3 font-mono text-xs md:table-cell">
                    {category.slug}
                </td>

                {/* Subcategories */}
                <td className="text-muted-foreground hidden px-3 py-3 text-center text-sm lg:table-cell">
                    {hasChildren ? (
                        <span className="font-medium text-foreground">{category.children!.length}</span>
                    ) : (
                        <span className="text-xs">—</span>
                    )}
                </td>

                {/* Status */}
                <td className="px-3 py-3">
                    <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                            category.is_active
                                ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400'
                                : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                        }`}
                    >
                        <span className={`size-1.5 rounded-full ${category.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                        {category.is_active ? 'Active' : 'Inactive'}
                    </span>
                </td>

                {/* Actions */}
                <td className="px-3 py-3">
                    {canManage && (
                        <div className="flex items-center justify-end gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                onClick={() => onEdit(category)}
                                title="Edit"
                            >
                                <Pencil className="size-3.5" />
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="size-8">
                                        <MoreHorizontal className="size-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                                        {category.name}
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem onClick={() => onEdit(category)}>
                                        <Pencil className="mr-2 size-4" /> Edit
                                    </DropdownMenuItem>

                                    {depth === 0 && (
                                        <DropdownMenuItem onClick={() => onAddSub(category)}>
                                            <Plus className="mr-2 size-4" /> Add Subcategory
                                        </DropdownMenuItem>
                                    )}

                                    <DropdownMenuItem onClick={() => onToggleStatus(category)}>
                                        {category.is_active
                                            ? <><EyeOff className="mr-2 size-4" /> Deactivate</>
                                            : <><Eye className="mr-2 size-4" /> Activate</>
                                        }
                                    </DropdownMenuItem>

                                    <DropdownMenuItem asChild>
                                        <Link
                                            href={`/category/${category.slug}`}
                                            target="_blank"
                                            className="flex items-center"
                                        >
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
                    )}
                </td>
            </tr>

            {/* Children */}
            {hasChildren && expanded &&
                category.children!.map((child) => (
                    <CategoryRow
                        key={child.id}
                        category={child}
                        depth={depth + 1}
                        canManage={canManage}
                        selected={selected}
                        onSelect={onSelect}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onAddSub={onAddSub}
                        onToggleStatus={onToggleStatus}
                        forceExpanded={forceExpanded}
                    />
                ))}
        </>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CategoriesIndex({ categories, include_inactive, can_manage, flash }: PageProps) {
    React.useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error)   toast.error(flash.error);
    }, [flash]);

    // ── state ────────────────────────────────────────────────────────────────
    const [showInactive, setShowInactive]   = React.useState(include_inactive);
    const [search, setSearch]               = React.useState('');
    const [statusFilter, setStatusFilter]   = React.useState<'all' | 'active' | 'inactive'>('all');
    const [typeFilter, setTypeFilter]       = React.useState<'all' | 'main' | 'sub'>('all');
    const [forceExpanded, setForceExpanded] = React.useState<boolean | null>(null);

    const [modalOpen, setModalOpen]         = React.useState(false);
    const [editCategory, setEditCategory]   = React.useState<Category | null>(null);
    const [defaultParent, setDefaultParent] = React.useState<number | null>(null);
    const [deleteTarget, setDeleteTarget]   = React.useState<Category | null>(null);

    const [selected, setSelected]           = React.useState<Set<number>>(new Set());
    const [bulkDeleteOpen, setBulkDeleteOpen] = React.useState(false);
    const [bulkProcessing, setBulkProcessing] = React.useState(false);

    // ── flat list for filtering ───────────────────────────────────────────────
    const allFlat = React.useMemo(() => flattenCategories(categories), [categories]);

    const mainCategories = React.useMemo(
        () => categories.filter((c) => !c.parent_id),
        [categories],
    );

    // ── filter the top-level list (search/type filters work on flat then rebuild) ──
    const filteredCategories = React.useMemo(() => {
        const q = search.trim().toLowerCase();

        return categories.filter((cat) => {
            // Type filter
            if (typeFilter === 'main' && cat.parent_id !== null) return false;
            if (typeFilter === 'sub'  && cat.parent_id === null)  return false;

            // Status filter
            if (statusFilter === 'active'   && !cat.is_active) return false;
            if (statusFilter === 'inactive' &&  cat.is_active) return false;

            // Search: match on name, slug or description
            if (q) {
                const matchSelf =
                    cat.name.toLowerCase().includes(q) ||
                    cat.slug.toLowerCase().includes(q) ||
                    (cat.description ?? '').toLowerCase().includes(q);
                const matchChild = (cat.children ?? []).some(
                    (ch) =>
                        ch.name.toLowerCase().includes(q) ||
                        ch.slug.toLowerCase().includes(q),
                );
                if (!matchSelf && !matchChild) return false;
            }

            return true;
        });
    }, [categories, search, statusFilter, typeFilter]);

    // ── stats ────────────────────────────────────────────────────────────────
    const totalCount    = allFlat.length;
    const activeCount   = allFlat.filter((c) => c.is_active).length;
    const inactiveCount = totalCount - activeCount;
    const mainCount     = allFlat.filter((c) => !c.parent_id).length;
    const subCount      = totalCount - mainCount;

    // ── handlers ─────────────────────────────────────────────────────────────
    const toggleInactive = (v: boolean) => {
        setShowInactive(v);
        router.get('/categories', { include_inactive: v ? '1' : '' }, { preserveState: true, replace: true });
    };

    const openCreate  = () => { setEditCategory(null); setDefaultParent(null); setModalOpen(true); };
    const openEdit    = (c: Category) => { setEditCategory(c); setDefaultParent(null); setModalOpen(true); };
    const openAddSub  = (parent: Category) => { setEditCategory(null); setDefaultParent(parent.id); setModalOpen(true); };

    const toggleStatus = (cat: Category) => {
        router.put(
            `/categories/${cat.slug}`,
            { ...cat, is_active: !cat.is_active, parent_id: cat.parent_id ?? null },
            {
                preserveState: true,
                onSuccess: () => toast.success(`Category ${cat.is_active ? 'deactivated' : 'activated'}.`),
            },
        );
    };

    // Selection
    const toggleSelect = (id: number, checked: boolean) => {
        setSelected((prev) => {
            const next = new Set(prev);
            checked ? next.add(id) : next.delete(id);
            return next;
        });
    };

    const allVisibleIds = React.useMemo(
        () => flattenCategories(filteredCategories).map((c) => c.id),
        [filteredCategories],
    );
    const allSelected  = allVisibleIds.length > 0 && allVisibleIds.every((id) => selected.has(id));
    const someSelected = allVisibleIds.some((id) => selected.has(id));

    const toggleSelectAll = (checked: boolean) => {
        setSelected(checked ? new Set(allVisibleIds) : new Set());
    };

    const selectedCount = allVisibleIds.filter((id) => selected.has(id)).length;

    const handleBulkDelete = () => {
        setBulkProcessing(true);
        const ids = [...selected];
        let done = 0;
        let errors = 0;
        ids.forEach((id) => {
            const cat = allFlat.find((c) => c.id === id);
            if (!cat) { done++; return; }
            router.delete(`/categories/${cat.slug}`, {
                preserveState: true,
                onSuccess: () => { done++; },
                onError: () => { done++; errors++; },
                onFinish: () => {
                    if (done === ids.length) {
                        setBulkProcessing(false);
                        setBulkDeleteOpen(false);
                        setSelected(new Set());
                        if (errors > 0) toast.error(`${errors} categor${errors > 1 ? 'ies' : 'y'} could not be deleted.`);
                        else toast.success(`${ids.length} categor${ids.length > 1 ? 'ies' : 'y'} deleted.`);
                        router.reload();
                    }
                },
            });
        });
    };

    const clearFilters = () => { setSearch(''); setStatusFilter('all'); setTypeFilter('all'); };
    const hasFilters = search || statusFilter !== 'all' || typeFilter !== 'all';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Categories" />
            <ToastProvider />

            <div className="flex flex-1 flex-col gap-6 p-6">

                {/* ── Page Header ── */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
                        <p className="text-muted-foreground text-sm">
                            Manage your content categories and hierarchy
                        </p>
                    </div>
                    {can_manage && (
                        <Button onClick={openCreate}>
                            <Plus className="mr-1.5 size-4" /> New Category
                        </Button>
                    )}
                </div>

                {/* ── Stats ── */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <StatCard label="Total" value={totalCount} color="hsl(var(--foreground))" />
                    <StatCard label="Active" value={activeCount} color="#16a34a" />
                    <StatCard label="Inactive" value={inactiveCount} color="#9ca3af" />
                    <StatCard label="Main / Sub" value={mainCount} color="#6366f1" />
                </div>

                {/* ── Filter Toolbar ── */}
                <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3">
                    {/* Search */}
                    <div className="relative min-w-[200px] flex-1">
                        <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                        <Input
                            placeholder="Search by name or slug…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 h-8 text-sm"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="text-muted-foreground hover:text-foreground absolute right-2 top-1/2 -translate-y-1/2"
                            >
                                <X className="size-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Status filter */}
                    <div className="flex items-center gap-1 rounded-md border bg-background p-1">
                        {(['all', 'active', 'inactive'] as const).map((s) => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`rounded px-3 py-1 text-xs font-medium capitalize transition-colors ${
                                    statusFilter === s
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>

                    {/* Type filter */}
                    <div className="flex items-center gap-1 rounded-md border bg-background p-1">
                        {(['all', 'main', 'sub'] as const).map((t) => (
                            <button
                                key={t}
                                onClick={() => setTypeFilter(t)}
                                className={`rounded px-3 py-1 text-xs font-medium capitalize transition-colors ${
                                    typeFilter === t
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {t === 'all' ? 'All types' : t === 'main' ? 'Main only' : 'Sub only'}
                            </button>
                        ))}
                    </div>

                    {/* Show inactive toggle */}
                    <div className="flex items-center gap-2 border-l pl-3">
                        <Switch id="show-inactive" checked={showInactive} onCheckedChange={toggleInactive} />
                        <Label htmlFor="show-inactive" className="text-xs whitespace-nowrap">Show inactive</Label>
                    </div>

                    {/* Expand / Collapse */}
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5 text-xs"
                            onClick={() => setForceExpanded(true)}
                            title="Expand all"
                        >
                            <FolderOpen className="size-3.5" /> Expand all
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5 text-xs"
                            onClick={() => setForceExpanded(false)}
                            title="Collapse all"
                        >
                            <FolderTree className="size-3.5" /> Collapse all
                        </Button>
                    </div>

                    {/* Clear filters */}
                    {hasFilters && (
                        <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={clearFilters}>
                            <X className="size-3.5" /> Clear
                        </Button>
                    )}
                </div>

                {/* ── Bulk Action Bar ── */}
                {selectedCount > 0 && (
                    <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5">
                        <span className="text-sm font-medium">
                            {selectedCount} {selectedCount === 1 ? 'category' : 'categories'} selected
                        </span>
                        <div className="flex items-center gap-2 ml-auto">
                            <Button
                                variant="destructive"
                                size="sm"
                                className="h-7 gap-1.5 text-xs"
                                onClick={() => setBulkDeleteOpen(true)}
                            >
                                <Trash2 className="size-3.5" /> Delete selected
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => setSelected(new Set())}
                            >
                                Clear selection
                            </Button>
                        </div>
                    </div>
                )}

                {/* ── Table ── */}
                <div className="overflow-hidden rounded-lg border">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-muted/50 border-b">
                                {can_manage && (
                                    <th className="w-10 px-3 py-3">
                                        <Checkbox
                                            checked={allSelected}
                                            onCheckedChange={toggleSelectAll}
                                            className={someSelected && !allSelected ? 'opacity-50' : ''}
                                        />
                                    </th>
                                )}
                                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                                    <div className="flex items-center gap-1.5">
                                        <Filter className="size-3" /> Name
                                    </div>
                                </th>
                                <th className="hidden px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider md:table-cell">
                                    Slug
                                </th>
                                <th className="hidden px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider lg:table-cell">
                                    Subcategories
                                </th>
                                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="w-24 px-3 py-3" />
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCategories.length === 0 ? (
                                <tr>
                                    <td colSpan={can_manage ? 6 : 5} className="text-muted-foreground py-16 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Tags className="size-10 opacity-20" />
                                            <div>
                                                <p className="font-medium">
                                                    {hasFilters ? 'No categories match your filters' : 'No categories found'}
                                                </p>
                                                {hasFilters ? (
                                                    <button
                                                        className="text-primary mt-1 text-sm underline"
                                                        onClick={clearFilters}
                                                    >
                                                        Clear filters
                                                    </button>
                                                ) : can_manage ? (
                                                    <button
                                                        className="text-primary mt-1 text-sm underline"
                                                        onClick={openCreate}
                                                    >
                                                        Create the first category
                                                    </button>
                                                ) : null}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredCategories.map((category) => (
                                    <CategoryRow
                                        key={category.id}
                                        category={category}
                                        depth={0}
                                        canManage={can_manage}
                                        selected={selected.has(category.id)}
                                        onSelect={toggleSelect}
                                        onEdit={openEdit}
                                        onDelete={setDeleteTarget}
                                        onAddSub={openAddSub}
                                        onToggleStatus={toggleStatus}
                                        forceExpanded={forceExpanded}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Footer summary */}
                    {filteredCategories.length > 0 && (
                        <div className="bg-muted/30 border-t px-4 py-2 text-xs text-muted-foreground flex items-center justify-between">
                            <span>
                                Showing {filteredCategories.length} of {mainCategories.length} main categories
                                {hasFilters && ' (filtered)'}
                            </span>
                            {hasFilters && (
                                <button className="text-primary underline" onClick={clearFilters}>
                                    Clear filters
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Modals ── */}
            <CategoryFormModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                editCategory={editCategory}
                defaultParentId={defaultParent}
                parentCategories={mainCategories}
            />
            <DeleteDialog
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                category={deleteTarget}
            />
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
