import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    ImageOff,
    Loader2,
    Megaphone,
    MoreHorizontal,
    Pencil,
    Plus,
    Search,
    ToggleLeft,
    ToggleRight,
    Trash2,
    X,
} from 'lucide-react';
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast, ToastProvider } from '@/components/ui/toast';
import AppLayout from '@/layouts/app-layout';
import type { Advertisement, AdPlacement, AdDevice, AdStatus, BreadcrumbItem, Paginated } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Advertisements', href: '/admin/advertisements' },
];

const PLACEMENTS: { value: AdPlacement; label: string; color: string }[] = [
    { value: 'header',  label: 'Header',  color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
    { value: 'sidebar', label: 'Sidebar', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    { value: 'inline',  label: 'Inline',  color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    { value: 'footer',  label: 'Footer',  color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
    { value: 'popup',   label: 'Popup',   color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
];

const DEVICES: { value: AdDevice; label: string }[] = [
    { value: 'all',     label: 'All Devices' },
    { value: 'desktop', label: 'Desktop' },
    { value: 'tablet',  label: 'Tablet' },
    { value: 'mobile',  label: 'Mobile' },
];

const STATUS_STYLES: Record<AdStatus, string> = {
    active:   'bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-400',
    inactive: 'bg-gray-100   text-gray-600   dark:bg-gray-800      dark:text-gray-400',
    draft:    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
};

function placementColor(p: AdPlacement): string {
    return PLACEMENTS.find((x) => x.value === p)?.color ?? '';
}

function fmtDate(d: string | null): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString(undefined, { dateStyle: 'medium' });
}

interface PageProps {
    advertisements: Paginated<Advertisement>;
    stats: { total: number; active: number; draft: number; inactive: number };
    filters: {
        search?: string;
        status?: string;
        placement?: string;
        device?: string;
        date_from?: string;
        date_to?: string;
    };
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className="bg-card rounded-xl border p-4 shadow-xs">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{label}</p>
            <p className={`mt-1 text-2xl font-bold tabular-nums ${color}`}>{value}</p>
        </div>
    );
}

// ── Ad Form Modal ─────────────────────────────────────────────────────────────
function AdFormModal({
    open,
    onClose,
    editAd,
}: {
    open: boolean;
    onClose: () => void;
    editAd: Advertisement | null;
}) {
    const { data, setData, post, put, processing, errors, reset } = useForm<{
        title: string;
        description: string;
        media_file: File | null;
        media_type: string;
        redirect_url: string;
        placement_type: string;
        device_target: string;
        start_datetime: string;
        end_datetime: string;
        status: string;
        priority: string;
        is_dismissible: boolean;
        remove_media: boolean;
    }>({
        title:           editAd?.title ?? '',
        description:     editAd?.description ?? '',
        media_file:      null,
        media_type:      editAd?.media_type ?? 'image',
        redirect_url:    editAd?.redirect_url ?? '',
        placement_type:  editAd?.placement_type ?? 'header',
        device_target:   editAd?.device_target ?? 'all',
        start_datetime:  editAd?.start_datetime ? editAd.start_datetime.slice(0, 16) : '',
        end_datetime:    editAd?.end_datetime   ? editAd.end_datetime.slice(0, 16)   : '',
        status:          editAd?.status ?? 'draft',
        priority:        String(editAd?.priority ?? 0),
        is_dismissible:  editAd?.is_dismissible ?? true,
        remove_media:    false,
    });

    const [previewUrl, setPreviewUrl] = React.useState<string | null>(editAd?.media_full_url ?? null);

    React.useEffect(() => {
        if (open) {
            setData({
                title:           editAd?.title ?? '',
                description:     editAd?.description ?? '',
                media_file:      null,
                media_type:      editAd?.media_type ?? 'image',
                redirect_url:    editAd?.redirect_url ?? '',
                placement_type:  editAd?.placement_type ?? 'header',
                device_target:   editAd?.device_target ?? 'all',
                start_datetime:  editAd?.start_datetime ? editAd.start_datetime.slice(0, 16) : '',
                end_datetime:    editAd?.end_datetime   ? editAd.end_datetime.slice(0, 16)   : '',
                status:          editAd?.status ?? 'draft',
                priority:        String(editAd?.priority ?? 0),
                is_dismissible:  editAd?.is_dismissible ?? true,
                remove_media:    false,
            });
            setPreviewUrl(editAd?.media_full_url ?? null);
        }
    }, [open, editAd]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setData('media_file', file);
        if (file) {
            setPreviewUrl(URL.createObjectURL(file));
            setData('remove_media', false);
        }
    };

    const removeMedia = () => {
        setPreviewUrl(null);
        setData('media_file', null);
        setData('remove_media', true);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const url = editAd ? `/admin/advertisements/${editAd.id}` : '/admin/advertisements';

        const options = {
            forceFormData: true,
            onSuccess: () => {
                toast.success(editAd ? 'Advertisement updated.' : 'Advertisement created.');
                reset();
                onClose();
            },
        };

        if (editAd) {
            put(url, options);
        } else {
            post(url, options);
        }
    };

    const selectCls = 'border-input bg-background text-foreground flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1';

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-2xl overflow-hidden">
                <DialogHeader className="shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        <Megaphone className="size-5" />
                        {editAd ? 'Edit Advertisement' : 'New Advertisement'}
                    </DialogTitle>
                    <DialogDescription>
                        {editAd ? 'Update the advertisement details.' : 'Create a new advertisement placement.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="grid gap-5 overflow-y-auto pr-1 py-2">
                    {/* Title */}
                    <div className="grid gap-1.5">
                        <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
                        <Input
                            id="title"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            placeholder="Summer Sale Banner"
                        />
                        {errors.title && <p className="text-destructive text-xs">{errors.title}</p>}
                    </div>

                    {/* Description */}
                    <div className="grid gap-1.5">
                        <Label htmlFor="description">Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
                        <textarea
                            id="description"
                            rows={2}
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            placeholder="Short description for internal reference..."
                            className="border-input bg-background text-foreground w-full rounded-md border px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-1 resize-none"
                        />
                        {errors.description && <p className="text-destructive text-xs">{errors.description}</p>}
                    </div>

                    {/* Media Upload */}
                    <div className="grid gap-1.5">
                        <Label>Media (Image / Video)</Label>
                        <div className="flex gap-3 items-start">
                            <div className="flex-1">
                                <input
                                    type="file"
                                    accept="image/*,video/mp4,video/webm"
                                    onChange={handleFileChange}
                                    className="border-input bg-background text-foreground flex h-9 w-full rounded-md border px-3 py-1 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium"
                                />
                                {errors.media_file && <p className="text-destructive text-xs mt-1">{errors.media_file}</p>}
                            </div>

                            {previewUrl && (
                                <div className="relative size-16 shrink-0 overflow-hidden rounded-md border">
                                    {data.media_type === 'video' ? (
                                        <video src={previewUrl} className="size-full object-cover" muted />
                                    ) : (
                                        <img src={previewUrl} alt="preview" className="size-full object-cover" />
                                    )}
                                    <button
                                        type="button"
                                        onClick={removeMedia}
                                        className="absolute top-0.5 right-0.5 rounded-full bg-black/60 p-0.5 text-white hover:bg-black"
                                    >
                                        <X className="size-3" />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                            <Label className="text-xs text-muted-foreground">Type:</Label>
                            <select
                                value={data.media_type}
                                onChange={(e) => setData('media_type', e.target.value)}
                                className="border-input bg-background h-7 rounded border px-2 text-xs"
                            >
                                <option value="image">Image</option>
                                <option value="video">Video</option>
                            </select>
                        </div>
                    </div>

                    {/* Redirect URL */}
                    <div className="grid gap-1.5">
                        <Label htmlFor="redirect_url">Redirect URL <span className="text-destructive">*</span></Label>
                        <Input
                            id="redirect_url"
                            type="url"
                            value={data.redirect_url}
                            onChange={(e) => setData('redirect_url', e.target.value)}
                            placeholder="https://example.com/offer"
                        />
                        {errors.redirect_url && <p className="text-destructive text-xs">{errors.redirect_url}</p>}
                    </div>

                    {/* Placement + Device */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-1.5">
                            <Label htmlFor="placement_type">Placement <span className="text-destructive">*</span></Label>
                            <select
                                id="placement_type"
                                value={data.placement_type}
                                onChange={(e) => setData('placement_type', e.target.value)}
                                className={selectCls}
                            >
                                {PLACEMENTS.map((p) => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                ))}
                            </select>
                            {errors.placement_type && <p className="text-destructive text-xs">{errors.placement_type}</p>}
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="device_target">Device Target</Label>
                            <select
                                id="device_target"
                                value={data.device_target}
                                onChange={(e) => setData('device_target', e.target.value)}
                                className={selectCls}
                            >
                                {DEVICES.map((d) => (
                                    <option key={d.value} value={d.value}>{d.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Schedule */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-1.5">
                            <Label htmlFor="start_datetime">Start Date/Time</Label>
                            <Input
                                id="start_datetime"
                                type="datetime-local"
                                value={data.start_datetime}
                                onChange={(e) => setData('start_datetime', e.target.value)}
                            />
                            {errors.start_datetime && <p className="text-destructive text-xs">{errors.start_datetime}</p>}
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="end_datetime">End Date/Time</Label>
                            <Input
                                id="end_datetime"
                                type="datetime-local"
                                value={data.end_datetime}
                                onChange={(e) => setData('end_datetime', e.target.value)}
                            />
                            {errors.end_datetime && <p className="text-destructive text-xs">{errors.end_datetime}</p>}
                        </div>
                    </div>

                    {/* Status + Priority */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-1.5">
                            <Label htmlFor="status">Status</Label>
                            <select
                                id="status"
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value)}
                                className={selectCls}
                            >
                                <option value="draft">Draft</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="priority">Priority (0 = lowest)</Label>
                            <Input
                                id="priority"
                                type="number"
                                min={0}
                                max={9999}
                                value={data.priority}
                                onChange={(e) => setData('priority', e.target.value)}
                            />
                            {errors.priority && <p className="text-destructive text-xs">{errors.priority}</p>}
                        </div>
                    </div>

                    {/* Dismissible */}
                    <div className="flex items-center gap-3 rounded-lg border p-3">
                        <Switch
                            id="is_dismissible"
                            checked={data.is_dismissible}
                            onCheckedChange={(v) => setData('is_dismissible', v)}
                        />
                        <div>
                            <Label htmlFor="is_dismissible" className="cursor-pointer font-medium">Allow users to dismiss this ad</Label>
                            <p className="text-muted-foreground text-xs">Shows a close (×) button on the ad</p>
                        </div>
                    </div>

                    <DialogFooter className="pt-2 shrink-0">
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={processing}>
                            {processing && <Loader2 className="mr-1.5 size-4 animate-spin" />}
                            {editAd ? 'Save Changes' : 'Create Advertisement'}
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
    ad,
}: {
    open: boolean;
    onClose: () => void;
    ad: Advertisement | null;
}) {
    const [processing, setProcessing] = React.useState(false);

    const handleDelete = () => {
        if (!ad) return;
        setProcessing(true);
        router.delete(`/admin/advertisements/${ad.id}`, {
            onSuccess: () => { toast.success('Advertisement deleted.'); onClose(); },
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <Trash2 className="size-5" />
                        Delete Advertisement
                    </DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete <strong>{ad?.title}</strong>? This action cannot be undone.
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

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdvertisementsIndex({ advertisements, stats, filters }: PageProps) {
    const { props } = usePage<{ flash: { success?: string; error?: string } }>();

    React.useEffect(() => {
        if (props.flash?.success) toast.success(props.flash.success);
        if (props.flash?.error)   toast.error(props.flash.error);
    }, [props.flash]);

    // Filters
    const [search,    setSearch]    = React.useState(filters.search    ?? '');
    const [status,    setStatus]    = React.useState(filters.status    ?? '');
    const [placement, setPlacement] = React.useState(filters.placement ?? '');
    const [device,    setDevice]    = React.useState(filters.device    ?? '');

    const applyFilters = (overrides: Record<string, string> = {}) => {
        router.get(
            '/admin/advertisements',
            { search, status, placement, device, ...overrides },
            { preserveState: true, replace: true },
        );
    };

    // Modals
    const [modalOpen, setModalOpen] = React.useState(false);
    const [editAd,    setEditAd]    = React.useState<Advertisement | null>(null);
    const [deleteAd,  setDeleteAd]  = React.useState<Advertisement | null>(null);

    // Bulk selection
    const [selected, setSelected] = React.useState<number[]>([]);
    const allSelected = advertisements.data.length > 0 && selected.length === advertisements.data.length;

    const toggleSelectAll = () => setSelected(allSelected ? [] : advertisements.data.map((a) => a.id));
    const toggleSelect    = (id: number) =>
        setSelected((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));

    const bulkDelete = () => {
        if (!selected.length) return;
        router.delete('/admin/advertisements/bulk', {
            data: { ids: selected },
            onSuccess: () => { toast.success(`${selected.length} advertisements deleted.`); setSelected([]); },
        });
    };

    const toggleStatus = (ad: Advertisement) => {
        router.patch(`/admin/advertisements/${ad.id}/toggle-status`, {}, {
            onSuccess: () => toast.success(`Status updated for "${ad.title}".`),
        });
    };

    const openCreate = () => { setEditAd(null); setModalOpen(true); };
    const openEdit   = (ad: Advertisement) => { setEditAd(ad); setModalOpen(true); };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Advertisements" />
            <ToastProvider />

            <div className="flex flex-1 flex-col gap-6 p-6">

                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Advertisements</h1>
                        <p className="text-muted-foreground text-sm">Manage ad placements, scheduling, and targeting.</p>
                    </div>
                    <Button onClick={openCreate}>
                        <Plus className="mr-1.5 size-4" />
                        New Ad
                    </Button>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <StatCard label="Total"    value={stats.total}    color="text-foreground" />
                    <StatCard label="Active"   value={stats.active}   color="text-green-600 dark:text-green-400" />
                    <StatCard label="Draft"    value={stats.draft}    color="text-yellow-600 dark:text-yellow-400" />
                    <StatCard label="Inactive" value={stats.inactive} color="text-muted-foreground" />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                    <div className="relative min-w-[200px] flex-1">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                        <Input
                            placeholder="Search by title..."
                            className="pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters({ search })}
                        />
                    </div>

                    <select
                        value={status}
                        onChange={(e) => { setStatus(e.target.value); applyFilters({ status: e.target.value }); }}
                        className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                    >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="draft">Draft</option>
                    </select>

                    <select
                        value={placement}
                        onChange={(e) => { setPlacement(e.target.value); applyFilters({ placement: e.target.value }); }}
                        className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                    >
                        <option value="">All Placements</option>
                        {PLACEMENTS.map((p) => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                    </select>

                    <select
                        value={device}
                        onChange={(e) => { setDevice(e.target.value); applyFilters({ device: e.target.value }); }}
                        className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                    >
                        <option value="">All Devices</option>
                        {DEVICES.filter((d) => d.value !== 'all').map((d) => (
                            <option key={d.value} value={d.value}>{d.label}</option>
                        ))}
                    </select>

                    {selected.length > 0 && (
                        <Button variant="destructive" size="sm" onClick={bulkDelete}>
                            <Trash2 className="mr-1.5 size-4" />
                            Delete {selected.length} selected
                        </Button>
                    )}
                </div>

                {/* Table */}
                <div className="rounded-xl border shadow-xs overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/40">
                                <TableHead className="w-10">
                                    <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
                                </TableHead>
                                <TableHead className="w-16">Media</TableHead>
                                <TableHead>Title / Description</TableHead>
                                <TableHead>Placement</TableHead>
                                <TableHead>Device</TableHead>
                                <TableHead>Schedule</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-16 text-center">Priority</TableHead>
                                <TableHead className="text-center">Stats</TableHead>
                                <TableHead className="w-10" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {advertisements.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="py-16 text-center">
                                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                            <Megaphone className="size-10 opacity-30" />
                                            <p className="text-sm font-medium">No advertisements found</p>
                                            <p className="text-xs">Create your first ad to get started.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                advertisements.data.map((ad) => (
                                    <TableRow key={ad.id} className={selected.includes(ad.id) ? 'bg-muted/30' : ''}>
                                        {/* Checkbox */}
                                        <TableCell>
                                            <Checkbox
                                                checked={selected.includes(ad.id)}
                                                onCheckedChange={() => toggleSelect(ad.id)}
                                            />
                                        </TableCell>

                                        {/* Thumbnail */}
                                        <TableCell>
                                            <div className="size-12 overflow-hidden rounded-md border bg-muted flex items-center justify-center">
                                                {ad.media_full_url ? (
                                                    ad.media_type === 'video' ? (
                                                        <video src={ad.media_full_url} className="size-full object-cover" muted />
                                                    ) : (
                                                        <img src={ad.media_full_url} alt={ad.title} className="size-full object-cover" />
                                                    )
                                                ) : (
                                                    <ImageOff className="size-5 text-muted-foreground/40" />
                                                )}
                                            </div>
                                        </TableCell>

                                        {/* Title */}
                                        <TableCell>
                                            <p className="font-medium leading-tight">{ad.title}</p>
                                            {ad.description && (
                                                <p className="text-muted-foreground text-xs mt-0.5 line-clamp-1">{ad.description}</p>
                                            )}
                                            <a
                                                href={ad.redirect_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-0.5 inline-flex items-center gap-1 text-xs text-blue-500 hover:underline"
                                            >
                                                <ExternalLink className="size-3" />
                                                CTA Link
                                            </a>
                                        </TableCell>

                                        {/* Placement */}
                                        <TableCell>
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${placementColor(ad.placement_type)}`}>
                                                {ad.placement_type}
                                            </span>
                                        </TableCell>

                                        {/* Device */}
                                        <TableCell>
                                            <span className="text-muted-foreground text-xs capitalize">{ad.device_target}</span>
                                        </TableCell>

                                        {/* Schedule */}
                                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                            {fmtDate(ad.start_datetime)}
                                            {ad.start_datetime && ad.end_datetime && ' → '}
                                            {fmtDate(ad.end_datetime)}
                                        </TableCell>

                                        {/* Status */}
                                        <TableCell>
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[ad.status]}`}>
                                                {ad.status}
                                            </span>
                                        </TableCell>

                                        {/* Priority */}
                                        <TableCell className="text-center tabular-nums text-sm font-mono">
                                            {ad.priority}
                                        </TableCell>

                                        {/* Stats */}
                                        <TableCell className="text-center text-xs text-muted-foreground whitespace-nowrap">
                                            <span title="Impressions">👁 {ad.impressions_count.toLocaleString()}</span>
                                            {' · '}
                                            <span title="Clicks">🖱 {ad.clicks_count.toLocaleString()}</span>
                                        </TableCell>

                                        {/* Actions */}
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="size-8">
                                                        <MoreHorizontal className="size-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => openEdit(ad)}>
                                                        <Pencil className="mr-2 size-4" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => toggleStatus(ad)}>
                                                        {ad.status === 'active'
                                                            ? <><ToggleLeft  className="mr-2 size-4" /> Deactivate</>
                                                            : <><ToggleRight className="mr-2 size-4" /> Activate</>
                                                        }
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={() => setDeleteAd(ad)}
                                                    >
                                                        <Trash2 className="mr-2 size-4" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {advertisements.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <p>
                            Showing {advertisements.from ?? 0}–{advertisements.to ?? 0} of {advertisements.total}
                        </p>
                        <div className="flex items-center gap-1">
                            {advertisements.links.map((link, i) => {
                                if (link.label === '&laquo; Previous') {
                                    return (
                                        <Button key={i} variant="outline" size="icon" className="size-8" disabled={!link.url}
                                            onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}>
                                            <ChevronLeft className="size-4" />
                                        </Button>
                                    );
                                }
                                if (link.label === 'Next &raquo;') {
                                    return (
                                        <Button key={i} variant="outline" size="icon" className="size-8" disabled={!link.url}
                                            onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}>
                                            <ChevronRight className="size-4" />
                                        </Button>
                                    );
                                }
                                return (
                                    <Button key={i} variant={link.active ? 'default' : 'outline'} size="icon" className="size-8"
                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}>
                                        {link.label}
                                    </Button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            <AdFormModal open={modalOpen} onClose={() => setModalOpen(false)} editAd={editAd} />
            <DeleteDialog open={!!deleteAd} onClose={() => setDeleteAd(null)} ad={deleteAd} />
        </AppLayout>
    );
}
