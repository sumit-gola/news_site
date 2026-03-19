import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    ChevronDown,
    ChevronRight,
    Loader2,
    MoreHorizontal,
    Pencil,
    Plus,
    Tags,
    Trash2,
} from 'lucide-react';
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

// ── Category Form Modal ───────────────────────────────────────────────────────
function CategoryFormModal({
    open,
    onClose,
    editCategory,
    parentCategories,
}: {
    open: boolean;
    onClose: () => void;
    editCategory: Category | null;
    parentCategories: Category[];
}) {
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name:        editCategory?.name ?? '',
        description: editCategory?.description ?? '',
        parent_id:   editCategory?.parent_id ? String(editCategory.parent_id) : '',
        color:       editCategory?.color ?? '#6366f1',
        is_active:   editCategory?.is_active ?? true,
    });

    React.useEffect(() => {
        if (open) {
            setData({
                name:        editCategory?.name ?? '',
                description: editCategory?.description ?? '',
                parent_id:   editCategory?.parent_id ? String(editCategory.parent_id) : '',
                color:       editCategory?.color ?? '#6366f1',
                is_active:   editCategory?.is_active ?? true,
            });
            clearErrors();
        }
    }, [open, editCategory]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            ...data,
            parent_id: data.parent_id ? Number(data.parent_id) : null,
        };

        // Update form state with the converted payload so Inertia submits correct values
        setData(payload as any);

        if (editCategory) {
            put(`/categories/${editCategory.slug}`, {
                onSuccess: () => {
                    toast.success('Category updated.');
                    reset();
                    onClose();
                },
            });
        } else {
            post('/categories', {
                onSuccess: () => {
                    toast.success('Category created.');
                    reset();
                    onClose();
                },
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
                        {errors.description && <p className="text-destructive text-xs">{errors.description}</p>}
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
                                        <option key={c.id} value={String(c.id)}>
                                            {c.name}
                                        </option>
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
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
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
            onError: (errors) => {
                const msg = Object.values(errors)[0];
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
                        <Trash2 className="size-5" />
                        Delete Category
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

// ── Category Row ──────────────────────────────────────────────────────────────
function CategoryRow({
    category,
    depth,
    canManage,
    onEdit,
    onDelete,
}: {
    category: Category;
    depth: number;
    canManage: boolean;
    onEdit: (c: Category) => void;
    onDelete: (c: Category) => void;
}) {
    const [expanded, setExpanded] = React.useState(true);
    const hasChildren = category.children && category.children.length > 0;

    return (
        <>
            <tr className="hover:bg-muted/40 border-b transition-colors">
                <td className="px-4 py-3">
                    <div className="flex items-center gap-2" style={{ paddingLeft: depth * 20 }}>
                        {hasChildren ? (
                            <button
                                onClick={() => setExpanded((v) => !v)}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                {expanded
                                    ? <ChevronDown className="size-4" />
                                    : <ChevronRight className="size-4" />}
                            </button>
                        ) : (
                            <span className="size-4" />
                        )}
                        <span
                            className="inline-block size-3 shrink-0 rounded-full"
                            style={{ backgroundColor: category.color }}
                        />
                        <span className="font-medium">{category.name}</span>
                        {!category.is_active && (
                            <Badge variant="outline" className="text-muted-foreground text-xs">
                                Inactive
                            </Badge>
                        )}
                    </div>
                </td>
                <td className="text-muted-foreground px-4 py-3 text-sm">
                    {category.description
                        ? category.description.length > 60
                            ? category.description.slice(0, 60) + '…'
                            : category.description
                        : <span className="italic">—</span>}
                </td>
                <td className="text-muted-foreground px-4 py-3 text-sm">
                    {category.slug}
                </td>
                <td className="px-4 py-3 text-sm">
                    <span className={`font-medium ${category.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                        {category.is_active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td className="px-4 py-3">
                    {canManage && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="size-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onEdit(category)}>
                                    <Pencil className="mr-2 size-4" />
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => onDelete(category)}
                                >
                                    <Trash2 className="mr-2 size-4" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </td>
            </tr>
            {hasChildren && expanded &&
                category.children!.map((child) => (
                    <CategoryRow
                        key={child.id}
                        category={child}
                        depth={depth + 1}
                        canManage={canManage}
                        onEdit={onEdit}
                        onDelete={onDelete}
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

    const [showInactive, setShowInactive] = React.useState(include_inactive);
    const [modalOpen, setModalOpen]       = React.useState(false);
    const [editCategory, setEditCategory] = React.useState<Category | null>(null);
    const [deleteTarget, setDeleteTarget] = React.useState<Category | null>(null);

    // All main-level categories as parent options in the form
    const mainCategories = categories.filter((c) => !c.parent_id);

    const toggleInactive = (v: boolean) => {
        setShowInactive(v);
        router.get('/categories', { include_inactive: v ? '1' : '' }, { preserveState: true, replace: true });
    };

    const openCreate = () => { setEditCategory(null); setModalOpen(true); };
    const openEdit   = (c: Category) => { setEditCategory(c); setModalOpen(true); };

    const totalCount    = categories.reduce((n, c) => n + 1 + (c.children?.length ?? 0), 0);
    const activeCount   = categories.reduce((n, c) => {
        let count = c.is_active ? 1 : 0;
        count += (c.children ?? []).filter((ch) => ch.is_active).length;
        return n + count;
    }, 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Categories" />
            <ToastProvider />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
                        <p className="text-muted-foreground text-sm">
                            {totalCount} total · {activeCount} active
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Switch
                                id="show-inactive"
                                checked={showInactive}
                                onCheckedChange={toggleInactive}
                            />
                            <Label htmlFor="show-inactive" className="text-sm">Show inactive</Label>
                        </div>
                        {can_manage && (
                            <Button onClick={openCreate}>
                                <Plus className="mr-1.5 size-4" />
                                New Category
                            </Button>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-lg border">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-muted/50 border-b text-left">
                                <th className="px-4 py-3 font-medium">Name</th>
                                <th className="px-4 py-3 font-medium">Description</th>
                                <th className="px-4 py-3 font-medium">Slug</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                                <th className="w-14 px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody>
                            {categories.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-muted-foreground py-12 text-center">
                                        No categories found.{' '}
                                        {can_manage && (
                                            <button
                                                className="text-primary underline"
                                                onClick={openCreate}
                                            >
                                                Create the first one.
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                categories.map((category) => (
                                    <CategoryRow
                                        key={category.id}
                                        category={category}
                                        depth={0}
                                        canManage={can_manage}
                                        onEdit={openEdit}
                                        onDelete={setDeleteTarget}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <CategoryFormModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                editCategory={editCategory}
                parentCategories={mainCategories}
            />
            <DeleteDialog
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                category={deleteTarget}
            />
        </AppLayout>
    );
}
