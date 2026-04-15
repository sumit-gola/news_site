import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Copy,
    Eye,
    EyeOff,
    FileText,
    Globe,
    LayoutTemplate,
    MoreHorizontal,
    Pencil,
    Plus,
    Search,
    Star,
    Trash2,
    X,
} from 'lucide-react';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem, Category, Page, Paginated } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Pages', href: '/pages' },
];

interface Props {
    pages: Paginated<Page>;
    summary: { total: number; published: number; draft: number; featured: number };
    filters: { search?: string; status?: string; category_id?: string; template?: string };
    categories: Category[];
    can_manage: boolean;
    flash: { success?: string; error?: string };
}

const STATUS_CONFIG = {
    published: { label: 'Published', cls: 'bg-green-50 text-green-700 ring-1 ring-green-200 dark:bg-green-950 dark:text-green-300' },
    draft:     { label: 'Draft',     cls: 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200 dark:bg-yellow-950 dark:text-yellow-300' },
} as const;

const TEMPLATE_LABELS: Record<string, string> = {
    'default':    'Default',
    'full-width': 'Full Width',
    'landing':    'Landing',
};

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
    return (
        <Card className="border shadow-none">
            <CardContent className="flex items-center gap-3 p-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: color + '18' }}>
                    <Icon className="size-4" style={{ color }} />
                </span>
                <div>
                    <p className="text-muted-foreground text-xs font-medium">{label}</p>
                    <p className="text-lg font-bold">{value}</p>
                </div>
            </CardContent>
        </Card>
    );
}

export default function PagesIndex({ pages, summary, filters, categories, can_manage, flash }: Props) {
    const [search, setSearch] = React.useState(filters.search ?? '');
    const [deleteTarget, setDeleteTarget] = React.useState<Page | null>(null);
    const { delete: destroy, processing: deleting } = useForm();

    // Apply filters with debounce
    React.useEffect(() => {
        const t = setTimeout(() => {
            if (search !== (filters.search ?? '')) {
                router.get('/pages', { ...filters, search: search || undefined }, { preserveState: true, replace: true });
            }
        }, 350);
        return () => clearTimeout(t);
    }, [search]);

    const applyFilter = (key: string, value: string | undefined) => {
        router.get('/pages', { ...filters, [key]: value || undefined, search: search || undefined }, { preserveState: true, replace: true });
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        destroy(`/pages/${deleteTarget.slug}`, {
            onSuccess: () => setDeleteTarget(null),
        });
    };

    const handlePublish = (page: Page) => {
        router.patch(`/pages/${page.slug}/publish`, {}, { preserveState: true });
    };

    const handleUnpublish = (page: Page) => {
        router.patch(`/pages/${page.slug}/unpublish`, {}, { preserveState: true });
    };

    const handleDuplicate = (page: Page) => {
        router.post(`/pages/${page.slug}/duplicate`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pages" />

            <div className="flex flex-1 flex-col gap-6 p-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FileText className="text-muted-foreground size-6" />
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Pages</h1>
                            <p className="text-muted-foreground text-sm">Manage your CMS pages and content.</p>
                        </div>
                    </div>
                    {can_manage && (
                        <Button asChild size="sm">
                            <Link href="/pages/create">
                                <Plus className="mr-1.5 size-4" /> New Page
                            </Link>
                        </Button>
                    )}
                </div>

                {/* Flash messages */}
                {(flash.success || flash.error) && (
                    <div className={cn('rounded-lg border px-4 py-3 text-sm', flash.success ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300' : 'border-destructive/30 bg-destructive/10 text-destructive')}>
                        {flash.success ?? flash.error}
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <StatCard label="Total Pages" value={summary.total} icon={FileText} color="#6366f1" />
                    <StatCard label="Published" value={summary.published} icon={Globe} color="#22c55e" />
                    <StatCard label="Drafts" value={summary.draft} icon={EyeOff} color="#f59e0b" />
                    <StatCard label="Featured" value={summary.featured} icon={Star} color="#ec4899" />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Search */}
                    <div className="relative flex-1 min-w-48 max-w-sm">
                        <Search className="text-muted-foreground absolute left-3 top-1/2 size-3.5 -translate-y-1/2" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search pages…"
                            className="pl-9 pr-8 h-9"
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="text-muted-foreground hover:text-foreground absolute right-2.5 top-1/2 -translate-y-1/2">
                                <X className="size-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Status pills */}
                    <div className="flex items-center gap-1.5">
                        {(['', 'published', 'draft'] as const).map((s) => (
                            <button
                                key={s}
                                onClick={() => applyFilter('status', s || undefined)}
                                className={cn(
                                    'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                                    (filters.status ?? '') === s
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-muted-foreground hover:bg-muted/80',
                                )}
                            >
                                {s === '' ? 'All' : s === 'published' ? 'Published' : 'Draft'}
                            </button>
                        ))}
                    </div>

                    {/* Category filter */}
                    {categories.length > 0 && (
                        <select
                            value={filters.category_id ?? ''}
                            onChange={(e) => applyFilter('category_id', e.target.value)}
                            className="border-input bg-background text-foreground h-9 rounded-md border px-2 text-xs shadow-xs focus:outline-none"
                        >
                            <option value="">All Categories</option>
                            {categories.map((c) => (
                                <option key={c.id} value={String(c.id)}>{c.name}</option>
                            ))}
                        </select>
                    )}

                    {/* Template filter */}
                    <select
                        value={filters.template ?? ''}
                        onChange={(e) => applyFilter('template', e.target.value)}
                        className="border-input bg-background text-foreground h-9 rounded-md border px-2 text-xs shadow-xs focus:outline-none"
                    >
                        <option value="">All Templates</option>
                        <option value="default">Default</option>
                        <option value="full-width">Full Width</option>
                        <option value="landing">Landing</option>
                    </select>
                </div>

                {/* Table */}
                <div className="rounded-xl border">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/30">
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
                                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">Category</th>
                                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground lg:table-cell">Template</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">Author</th>
                                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground xl:table-cell">Updated</th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pages.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                                        <FileText className="mx-auto mb-2 size-8 opacity-30" />
                                        No pages found.
                                        {can_manage && (
                                            <span> <Link href="/pages/create" className="text-primary underline">Create your first page.</Link></span>
                                        )}
                                    </td>
                                </tr>
                            ) : pages.data.map((page) => {
                                const sc = STATUS_CONFIG[page.status];
                                return (
                                    <tr key={page.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                {page.is_featured && <Star className="size-3.5 shrink-0 text-yellow-500" />}
                                                <div>
                                                    <p className="font-medium leading-snug">{page.title}</p>
                                                    <p className="text-muted-foreground text-xs">/page/{page.slug}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="hidden px-4 py-3 md:table-cell">
                                            {page.category ? (
                                                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white" style={{ backgroundColor: page.category.color }}>
                                                    {page.category.name}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">—</span>
                                            )}
                                        </td>
                                        <td className="hidden px-4 py-3 lg:table-cell">
                                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <LayoutTemplate className="size-3" />
                                                {TEMPLATE_LABELS[page.template] ?? page.template}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', sc.cls)}>
                                                {sc.label}
                                            </span>
                                        </td>
                                        <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell text-xs">
                                            {page.author?.name ?? '—'}
                                        </td>
                                        <td className="hidden px-4 py-3 text-muted-foreground xl:table-cell text-xs">
                                            {new Date(page.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {can_manage && (
                                                    <Button variant="ghost" size="icon" className="size-7" asChild title="Edit">
                                                        <Link href={`/pages/${page.slug}/edit`}>
                                                            <Pencil className="size-3.5" />
                                                        </Link>
                                                    </Button>
                                                )}
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="size-7">
                                                            <MoreHorizontal className="size-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-44">
                                                        {page.status === 'published' && (
                                                            <DropdownMenuItem asChild>
                                                                <a href={`/page/${page.slug}`} target="_blank" rel="noopener noreferrer">
                                                                    <Eye className="mr-2 size-4" /> View Live
                                                                </a>
                                                            </DropdownMenuItem>
                                                        )}
                                                        {can_manage && (
                                                            <>
                                                                <DropdownMenuItem asChild>
                                                                    <Link href={`/pages/${page.slug}/edit`}>
                                                                        <Pencil className="mr-2 size-4" /> Edit
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleDuplicate(page)}>
                                                                    <Copy className="mr-2 size-4" /> Duplicate
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                {page.status === 'draft' ? (
                                                                    <DropdownMenuItem onClick={() => handlePublish(page)}>
                                                                        <Globe className="mr-2 size-4" /> Publish
                                                                    </DropdownMenuItem>
                                                                ) : (
                                                                    <DropdownMenuItem onClick={() => handleUnpublish(page)}>
                                                                        <EyeOff className="mr-2 size-4" /> Unpublish
                                                                    </DropdownMenuItem>
                                                                )}
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    className="text-destructive focus:text-destructive"
                                                                    onClick={() => setDeleteTarget(page)}
                                                                >
                                                                    <Trash2 className="mr-2 size-4" /> Delete
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pages.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Showing {pages.from}–{pages.to} of {pages.total}</span>
                        <div className="flex gap-1">
                            {pages.links.map((link, i) => (
                                <button
                                    key={i}
                                    disabled={!link.url}
                                    onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                    className={cn(
                                        'min-w-8 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                                        link.active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                                        !link.url && 'opacity-40 cursor-not-allowed',
                                    )}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Delete confirmation */}
            <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Delete Page</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>"{deleteTarget?.title}"</strong>? This cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
                            {deleting ? 'Deleting…' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
