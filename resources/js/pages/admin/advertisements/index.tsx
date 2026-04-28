import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    BarChart2,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    ImageOff,
    Loader2,
    Megaphone,
    MoreHorizontal,
    Pencil,
    Plus,
    RotateCcw,
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
import type {
    Advertisement,
    AdDevice,
    AdPlacement,
    AdStatus,
    AdType,
    BreadcrumbItem,
    Paginated,
} from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Advertisements', href: '/admin/advertisements' },
];

// ── Config maps ───────────────────────────────────────────────────────────────
const PLACEMENTS: { value: AdPlacement; label: string; color: string }[] = [
    { value: 'header',  label: 'Header',  color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
    { value: 'sidebar', label: 'Sidebar', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    { value: 'inline',  label: 'Inline',  color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    { value: 'footer',  label: 'Footer',  color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
    { value: 'popup',   label: 'Popup',   color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
];

const AD_TYPES: { value: AdType; label: string; color: string }[] = [
    { value: 'fixed',    label: 'Fixed',    color: 'bg-slate-100 text-slate-700' },
    { value: 'closable', label: 'Closable', color: 'bg-blue-100 text-blue-700' },
    { value: 'floating', label: 'Floating', color: 'bg-purple-100 text-purple-700' },
    { value: 'popup',    label: 'Popup',    color: 'bg-rose-100 text-rose-700' },
    { value: 'inline',   label: 'Inline',   color: 'bg-amber-100 text-amber-700' },
    { value: 'sticky',   label: 'Sticky',   color: 'bg-teal-100 text-teal-700' },
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
function adTypeColor(t: AdType): string {
    return AD_TYPES.find((x) => x.value === t)?.color ?? '';
}
function fmtDate(d: string | null): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString(undefined, { dateStyle: 'medium' });
}

interface PageProps {
    advertisements: Paginated<Advertisement>;
    stats:   { total: number; active: number; draft: number; inactive: number; trashed: number };
    filters: { search?: string; status?: string; ad_type?: string; placement?: string; device?: string; trashed?: string };
}

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className="bg-card rounded-xl border p-4 shadow-xs">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{label}</p>
            <p className={`mt-1 text-2xl font-bold tabular-nums ${color}`}>{value}</p>
        </div>
    );
}

// ── Ad Form Modal ─────────────────────────────────────────────────────────────
function AdFormModal({ open, onClose, editAd }: { open: boolean; onClose: () => void; editAd: Advertisement | null }) {
    const { data, setData, post, put, processing, errors, reset } = useForm<{
        title: string; description: string; ad_type: string;
        media_file: File | null; media_type: string; embed_code: string;
        redirect_url: string; cta_label: string; bg_color: string;
        placement_type: string; device_target: string;
        float_position: string; float_animation: string;
        popup_delay_seconds: string; popup_frequency_minutes: string; sticky_offset_px: string;
        start_datetime: string; end_datetime: string;
        status: string; priority: string; is_dismissible: boolean;
        ab_testing_enabled: boolean; remove_media: boolean;
        // Schedule
        'schedule.days_of_week': number[];
        'schedule.time_from': string; 'schedule.time_to': string; 'schedule.timezone': string;
    }>({
        title: '', description: '', ad_type: 'fixed',
        media_file: null, media_type: 'image', embed_code: '',
        redirect_url: '', cta_label: '', bg_color: '',
        placement_type: 'header', device_target: 'all',
        float_position: 'bottom-right', float_animation: 'slide',
        popup_delay_seconds: '3', popup_frequency_minutes: '', sticky_offset_px: '0',
        start_datetime: '', end_datetime: '',
        status: 'draft', priority: '0', is_dismissible: true,
        ab_testing_enabled: false, remove_media: false,
        'schedule.days_of_week': [], 'schedule.time_from': '', 'schedule.time_to': '', 'schedule.timezone': 'UTC',
    });

    const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
    const [scheduleEnabled, setScheduleEnabled] = React.useState(false);

    React.useEffect(() => {
        if (!open) return;
        const s = editAd?.schedule;
        setScheduleEnabled(!!s);
        setPreviewUrl(editAd?.media_full_url ?? null);
        setData({
            title:                    editAd?.title ?? '',
            description:              editAd?.description ?? '',
            ad_type:                  editAd?.ad_type ?? 'fixed',
            media_file:               null,
            media_type:               editAd?.media_type ?? 'image',
            embed_code:               editAd?.embed_code ?? '',
            redirect_url:             editAd?.redirect_url ?? '',
            cta_label:                editAd?.cta_label ?? '',
            bg_color:                 editAd?.bg_color ?? '',
            placement_type:           editAd?.placement_type ?? 'header',
            device_target:            editAd?.device_target ?? 'all',
            float_position:           editAd?.float_position ?? 'bottom-right',
            float_animation:          editAd?.float_animation ?? 'slide',
            popup_delay_seconds:      String(editAd?.popup_delay_seconds ?? 3),
            popup_frequency_minutes:  editAd?.popup_frequency_minutes ? String(editAd.popup_frequency_minutes) : '',
            sticky_offset_px:         String(editAd?.sticky_offset_px ?? 0),
            start_datetime:           editAd?.start_datetime ? editAd.start_datetime.slice(0, 16) : '',
            end_datetime:             editAd?.end_datetime   ? editAd.end_datetime.slice(0, 16)   : '',
            status:                   editAd?.status ?? 'draft',
            priority:                 String(editAd?.priority ?? 0),
            is_dismissible:           editAd?.is_dismissible ?? true,
            ab_testing_enabled:       editAd?.ab_testing_enabled ?? false,
            remove_media:             false,
            'schedule.days_of_week':  s?.days_of_week ?? [],
            'schedule.time_from':     s?.time_from ?? '',
            'schedule.time_to':       s?.time_to ?? '',
            'schedule.timezone':      s?.timezone ?? 'UTC',
        });
    }, [open, editAd]);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setData('media_file', file);
        if (file) { setPreviewUrl(URL.createObjectURL(file)); setData('remove_media', false); }
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const url = editAd ? `/admin/advertisements/${editAd.id}` : '/admin/advertisements';
        const opts = { forceFormData: true, onSuccess: () => { toast.success(editAd ? 'Updated.' : 'Created.'); reset(); onClose(); } };
        editAd ? put(url, opts) : post(url, opts);
    };

    const sel = 'border-input bg-background text-foreground flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1';
    const showEmbed  = data.media_type === 'html' || data.media_type === 'script';
    const showFloat  = data.ad_type === 'floating';
    const showPopup  = data.ad_type === 'popup';
    const showSticky = data.ad_type === 'sticky';

    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-2xl overflow-hidden">
                <DialogHeader className="shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        <Megaphone className="size-5" />{editAd ? 'Edit Advertisement' : 'New Advertisement'}
                    </DialogTitle>
                    <DialogDescription>{editAd ? 'Update advertisement details.' : 'Create a new advertisement.'}</DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="grid gap-4 overflow-y-auto pr-1 py-2">
                    {/* Title */}
                    <div className="grid gap-1.5">
                        <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
                        <Input id="title" value={data.title} onChange={(e) => setData('title', e.target.value)} placeholder="Summer Sale Banner" />
                        {errors.title && <p className="text-destructive text-xs">{errors.title}</p>}
                    </div>

                    {/* Ad Type + Placement */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-1.5">
                            <Label>Ad Type <span className="text-destructive">*</span></Label>
                            <select value={data.ad_type} onChange={(e) => setData('ad_type', e.target.value)} className={sel}>
                                {AD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                        </div>
                        <div className="grid gap-1.5">
                            <Label>Placement <span className="text-destructive">*</span></Label>
                            <select value={data.placement_type} onChange={(e) => setData('placement_type', e.target.value)} className={sel}>
                                {PLACEMENTS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Media Type */}
                    <div className="grid gap-1.5">
                        <Label>Media Type</Label>
                        <select value={data.media_type} onChange={(e) => setData('media_type', e.target.value)} className={sel}>
                            <option value="image">Image</option>
                            <option value="video">Video</option>
                            <option value="html">HTML Embed</option>
                            <option value="script">Script / AdSense</option>
                        </select>
                    </div>

                    {/* Media Upload or Embed Code */}
                    {showEmbed ? (
                        <div className="grid gap-1.5">
                            <Label>Embed Code <span className="text-destructive">*</span></Label>
                            <textarea
                                rows={4}
                                value={data.embed_code}
                                onChange={(e) => setData('embed_code', e.target.value)}
                                placeholder='<ins class="adsbygoogle" ...'
                                className="border-input bg-background text-foreground w-full rounded-md border px-3 py-2 text-xs font-mono shadow-xs focus:outline-none focus:ring-1 resize-y"
                            />
                            {errors.embed_code && <p className="text-destructive text-xs">{errors.embed_code}</p>}
                        </div>
                    ) : (
                        <div className="grid gap-1.5">
                            <Label>Media File</Label>
                            <div className="flex gap-3 items-start">
                                <input type="file" accept="image/*,video/mp4,video/webm" onChange={handleFile}
                                    className="border-input bg-background text-foreground flex h-9 w-full rounded-md border px-3 py-1 text-sm file:border-0 file:bg-transparent file:text-sm" />
                                {previewUrl && (
                                    <div className="relative size-16 shrink-0 overflow-hidden rounded-md border">
                                        <img src={previewUrl} alt="preview" className="size-full object-cover" />
                                        <button type="button" onClick={() => { setPreviewUrl(null); setData('remove_media', true); }}
                                            className="absolute top-0.5 right-0.5 rounded-full bg-black/60 p-0.5 text-white"><X className="size-3" /></button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Redirect URL + CTA */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-1.5">
                            <Label>Redirect URL <span className="text-destructive">*</span></Label>
                            <Input type="url" value={data.redirect_url} onChange={(e) => setData('redirect_url', e.target.value)} placeholder="https://example.com" />
                            {errors.redirect_url && <p className="text-destructive text-xs">{errors.redirect_url}</p>}
                        </div>
                        <div className="grid gap-1.5">
                            <Label>CTA Button Label</Label>
                            <Input value={data.cta_label} onChange={(e) => setData('cta_label', e.target.value)} placeholder="Shop Now" />
                        </div>
                    </div>

                    {/* Floating options */}
                    {showFloat && (
                        <div className="grid grid-cols-2 gap-4 rounded-lg border p-3 bg-muted/30">
                            <div className="grid gap-1.5">
                                <Label>Float Position</Label>
                                <select value={data.float_position} onChange={(e) => setData('float_position', e.target.value)} className={sel}>
                                    {['bottom-right','bottom-left','top-right','top-left'].map((v) => <option key={v} value={v}>{v}</option>)}
                                </select>
                            </div>
                            <div className="grid gap-1.5">
                                <Label>Animation</Label>
                                <select value={data.float_animation} onChange={(e) => setData('float_animation', e.target.value)} className={sel}>
                                    <option value="slide">Slide</option>
                                    <option value="fade">Fade</option>
                                    <option value="bounce">Bounce</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Popup options */}
                    {showPopup && (
                        <div className="grid grid-cols-2 gap-4 rounded-lg border p-3 bg-muted/30">
                            <div className="grid gap-1.5">
                                <Label>Delay (seconds)</Label>
                                <Input type="number" min={0} max={60} value={data.popup_delay_seconds} onChange={(e) => setData('popup_delay_seconds', e.target.value)} />
                            </div>
                            <div className="grid gap-1.5">
                                <Label>Re-show every (minutes)</Label>
                                <Input type="number" min={1} value={data.popup_frequency_minutes} onChange={(e) => setData('popup_frequency_minutes', e.target.value)} placeholder="once per session" />
                            </div>
                        </div>
                    )}

                    {/* Sticky options */}
                    {showSticky && (
                        <div className="grid gap-1.5 rounded-lg border p-3 bg-muted/30">
                            <Label>Show after scrolling (px)</Label>
                            <Input type="number" min={0} value={data.sticky_offset_px} onChange={(e) => setData('sticky_offset_px', e.target.value)} />
                        </div>
                    )}

                    {/* Device + Schedule */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-1.5">
                            <Label>Device Target</Label>
                            <select value={data.device_target} onChange={(e) => setData('device_target', e.target.value)} className={sel}>
                                {DEVICES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                            </select>
                        </div>
                        <div className="grid gap-1.5">
                            <Label>Status</Label>
                            <select value={data.status} onChange={(e) => setData('status', e.target.value)} className={sel}>
                                <option value="draft">Draft</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    {/* Schedule */}
                    <div className="rounded-lg border p-3 space-y-3">
                        <div className="flex items-center gap-2">
                            <Switch id="sch" checked={scheduleEnabled} onCheckedChange={setScheduleEnabled} />
                            <Label htmlFor="sch" className="cursor-pointer">Enable day/time schedule</Label>
                        </div>
                        {scheduleEnabled && (
                            <>
                                <div className="flex flex-wrap gap-2">
                                    {DAYS.map((d, i) => (
                                        <label key={d} className={`flex items-center gap-1 rounded px-2 py-1 text-xs cursor-pointer border transition ${(data['schedule.days_of_week'] ?? []).includes(i) ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}>
                                            <input type="checkbox" className="sr-only"
                                                checked={(data['schedule.days_of_week'] ?? []).includes(i)}
                                                onChange={() => {
                                                    const cur = data['schedule.days_of_week'] ?? [];
                                                    setData('schedule.days_of_week', cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]);
                                                }} />
                                            {d}
                                        </label>
                                    ))}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-1">
                                        <Label className="text-xs">From time</Label>
                                        <Input type="time" value={data['schedule.time_from']} onChange={(e) => setData('schedule.time_from', e.target.value)} className="h-8 text-sm" />
                                    </div>
                                    <div className="grid gap-1">
                                        <Label className="text-xs">To time</Label>
                                        <Input type="time" value={data['schedule.time_to']} onChange={(e) => setData('schedule.time_to', e.target.value)} className="h-8 text-sm" />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Priority + Dismissible + A/B */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-1.5">
                            <Label>Priority (higher = shown first)</Label>
                            <Input type="number" min={0} max={9999} value={data.priority} onChange={(e) => setData('priority', e.target.value)} />
                        </div>
                        <div className="grid gap-1.5">
                            <Label>Background Color</Label>
                            <div className="flex gap-2">
                                <Input value={data.bg_color} onChange={(e) => setData('bg_color', e.target.value)} placeholder="#ffffff" className="flex-1" />
                                <input type="color" value={data.bg_color || '#ffffff'} onChange={(e) => setData('bg_color', e.target.value)} className="h-9 w-9 rounded border p-1 cursor-pointer" />
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 rounded-lg border p-3">
                            <Switch id="dismissible" checked={data.is_dismissible} onCheckedChange={(v) => setData('is_dismissible', v)} />
                            <Label htmlFor="dismissible" className="cursor-pointer text-sm">Allow dismiss (×)</Label>
                        </div>
                        <div className="flex items-center gap-3 rounded-lg border p-3">
                            <Switch id="ab" checked={data.ab_testing_enabled} onCheckedChange={(v) => setData('ab_testing_enabled', v)} />
                            <Label htmlFor="ab" className="cursor-pointer text-sm">Enable A/B testing</Label>
                        </div>
                    </div>

                    {/* Schedule datetimes */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-1.5">
                            <Label>Start Date/Time</Label>
                            <Input type="datetime-local" value={data.start_datetime} onChange={(e) => setData('start_datetime', e.target.value)} />
                        </div>
                        <div className="grid gap-1.5">
                            <Label>End Date/Time</Label>
                            <Input type="datetime-local" value={data.end_datetime} onChange={(e) => setData('end_datetime', e.target.value)} />
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
function DeleteDialog({ open, onClose, ad }: { open: boolean; onClose: () => void; ad: Advertisement | null }) {
    const [processing, setProcessing] = React.useState(false);
    const handle = () => {
        if (!ad) return;
        setProcessing(true);
        router.delete(`/admin/advertisements/${ad.id}`, {
            onSuccess: () => { toast.success('Deleted.'); onClose(); },
            onFinish:  () => setProcessing(false),
        });
    };
    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive"><Trash2 className="size-5" /> Delete Advertisement</DialogTitle>
                    <DialogDescription>Are you sure you want to delete <strong>{ad?.title}</strong>? This cannot be undone.</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button variant="destructive" onClick={handle} disabled={processing}>
                        {processing && <Loader2 className="mr-1.5 size-4 animate-spin" />} Delete
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

    const [search,    setSearch]    = React.useState(filters.search    ?? '');
    const [status,    setStatus]    = React.useState(filters.status    ?? '');
    const [adType,    setAdType]    = React.useState(filters.ad_type   ?? '');
    const [placement, setPlacement] = React.useState(filters.placement ?? '');
    const [device,    setDevice]    = React.useState(filters.device    ?? '');
    const [trashed,   setTrashed]   = React.useState(filters.trashed   ?? '');

    const applyFilters = (overrides: Record<string, string> = {}) => {
        router.get('/admin/advertisements', { search, status, ad_type: adType, placement, device, trashed, ...overrides }, { preserveState: true, replace: true });
    };

    const [modalOpen, setModalOpen] = React.useState(false);
    const [editAd,    setEditAd]    = React.useState<Advertisement | null>(null);
    const [deleteAd,  setDeleteAd]  = React.useState<Advertisement | null>(null);

    const [selected, setSelected] = React.useState<number[]>([]);
    const allSelected = advertisements.data.length > 0 && selected.length === advertisements.data.length;
    const toggleSelectAll = () => setSelected(allSelected ? [] : advertisements.data.map((a) => a.id));
    const toggleSelect    = (id: number) => setSelected((p) => p.includes(id) ? p.filter((i) => i !== id) : [...p, id]);

    const bulkDelete = () => {
        if (!selected.length) return;
        router.delete('/admin/advertisements/bulk', {
            data:      { ids: selected },
            onSuccess: () => { toast.success(`${selected.length} deleted.`); setSelected([]); },
        });
    };

    const toggleStatus = (ad: Advertisement) =>
        router.patch(`/admin/advertisements/${ad.id}/toggle-status`, {}, { onSuccess: () => toast.success('Status updated.') });

    const restore = (ad: Advertisement) =>
        router.patch(`/admin/advertisements/${ad.id}/restore`, {}, { onSuccess: () => toast.success('Restored.') });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Advertisements" />
            <ToastProvider />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Advertisements</h1>
                        <p className="text-muted-foreground text-sm">Manage ad placements, scheduling, and targeting.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href="/admin/advertisements/analytics"><BarChart2 className="mr-1.5 size-4" />Analytics</Link>
                        </Button>
                        <Button onClick={() => { setEditAd(null); setModalOpen(true); }}>
                            <Plus className="mr-1.5 size-4" />New Ad
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    <StatCard label="Total"    value={stats.total}    color="text-foreground" />
                    <StatCard label="Active"   value={stats.active}   color="text-green-600 dark:text-green-400" />
                    <StatCard label="Draft"    value={stats.draft}    color="text-yellow-600 dark:text-yellow-400" />
                    <StatCard label="Inactive" value={stats.inactive} color="text-muted-foreground" />
                    <StatCard label="Trashed"  value={stats.trashed}  color="text-rose-500" />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                    <div className="relative min-w-[200px] flex-1">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                        <Input placeholder="Search by title..." className="pl-9" value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters({ search })} />
                    </div>
                    {([ ['status', status, setStatus, [['', 'All Status'],['active','Active'],['inactive','Inactive'],['draft','Draft']]],
                        ['ad_type', adType, setAdType, [['','All Types'], ...AD_TYPES.map((t) => [t.value, t.label])]],
                        ['placement', placement, setPlacement, [['', 'All Placements'], ...PLACEMENTS.map((p) => [p.value, p.label])]],
                        ['device', device, setDevice, [['','All Devices'], ...DEVICES.filter((d) => d.value !== 'all').map((d) => [d.value, d.label])]],
                    ] as Array<[string, string, (v: string) => void, string[][]]>).map(([key, val, setter, opts]) => (
                        <select key={key} value={val}
                            onChange={(e) => { setter(e.target.value); applyFilters({ [key]: e.target.value }); }}
                            className="border-input bg-background h-9 rounded-md border px-3 text-sm">
                            {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                    ))}
                    <label className="flex items-center gap-1.5 cursor-pointer text-sm border rounded-md px-3 h-9 bg-background">
                        <input type="checkbox" checked={trashed === '1'} onChange={(e) => { const v = e.target.checked ? '1' : ''; setTrashed(v); applyFilters({ trashed: v }); }} />
                        Show Trashed
                    </label>
                    {selected.length > 0 && (
                        <Button variant="destructive" size="sm" onClick={bulkDelete}>
                            <Trash2 className="mr-1.5 size-4" />Delete {selected.length}
                        </Button>
                    )}
                </div>

                {/* Table */}
                <div className="rounded-xl border shadow-xs overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/40">
                                <TableHead className="w-10"><Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} /></TableHead>
                                <TableHead className="w-16">Media</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Placement</TableHead>
                                <TableHead>Device</TableHead>
                                <TableHead>Schedule</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-center w-16">CTR</TableHead>
                                <TableHead className="text-center w-12">Pri.</TableHead>
                                <TableHead className="w-10" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {advertisements.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={11} className="py-16 text-center">
                                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                            <Megaphone className="size-10 opacity-30" />
                                            <p className="text-sm font-medium">No advertisements found</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : advertisements.data.map((ad) => (
                                <TableRow key={ad.id} className={`${selected.includes(ad.id) ? 'bg-muted/30' : ''} ${ad.deleted_at ? 'opacity-60' : ''}`}>
                                    <TableCell><Checkbox checked={selected.includes(ad.id)} onCheckedChange={() => toggleSelect(ad.id)} /></TableCell>
                                    <TableCell>
                                        <div className="size-12 overflow-hidden rounded-md border bg-muted flex items-center justify-center">
                                            {ad.media_full_url ? (
                                                <img src={ad.media_full_url} alt={ad.title} className="size-full object-cover" />
                                            ) : (
                                                <ImageOff className="size-5 text-muted-foreground/40" />
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <p className="font-medium leading-tight">{ad.title}</p>
                                        {ad.description && <p className="text-muted-foreground text-xs mt-0.5 line-clamp-1">{ad.description}</p>}
                                        {ad.redirect_url && (
                                            <a href={ad.redirect_url} target="_blank" rel="noopener noreferrer" className="mt-0.5 inline-flex items-center gap-1 text-xs text-blue-500 hover:underline">
                                                <ExternalLink className="size-3" /> CTA
                                            </a>
                                        )}
                                        {ad.deleted_at && <Badge variant="destructive" className="mt-1 text-[9px] h-4">Trashed</Badge>}
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${adTypeColor(ad.ad_type)}`}>{ad.ad_type}</span>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${placementColor(ad.placement_type)}`}>{ad.placement_type}</span>
                                    </TableCell>
                                    <TableCell><span className="text-muted-foreground text-xs capitalize">{ad.device_target}</span></TableCell>
                                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{fmtDate(ad.start_datetime)}{ad.start_datetime && ad.end_datetime && ' → '}{fmtDate(ad.end_datetime)}</TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[ad.status]}`}>{ad.status}</span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="text-xs">
                                            <p className="font-semibold tabular-nums text-emerald-600">{ad.ctr ?? 0}%</p>
                                            <p className="text-muted-foreground tabular-nums">{(ad.impressions_count ?? 0).toLocaleString()} imp</p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center tabular-nums text-sm font-mono">{ad.priority}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="size-8"><MoreHorizontal className="size-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {!ad.deleted_at && (
                                                    <>
                                                        <DropdownMenuItem onClick={() => { setEditAd(ad); setModalOpen(true); }}>
                                                            <Pencil className="mr-2 size-4" /> Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => toggleStatus(ad)}>
                                                            {ad.status === 'active'
                                                                ? <><ToggleLeft  className="mr-2 size-4" /> Deactivate</>
                                                                : <><ToggleRight className="mr-2 size-4" /> Activate</>}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => router.visit(`/admin/advertisements/analytics?ad_id=${ad.id}`)}>
                                                            <BarChart2 className="mr-2 size-4" /> Analytics
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteAd(ad)}>
                                                            <Trash2 className="mr-2 size-4" /> Delete
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                                {ad.deleted_at && (
                                                    <DropdownMenuItem onClick={() => restore(ad)}>
                                                        <RotateCcw className="mr-2 size-4" /> Restore
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {advertisements.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <p>Showing {advertisements.from ?? 0}–{advertisements.to ?? 0} of {advertisements.total}</p>
                        <div className="flex items-center gap-1">
                            {advertisements.links.map((link, i) => {
                                if (link.label === '&laquo; Previous') return (
                                    <Button key={i} variant="outline" size="icon" className="size-8" disabled={!link.url} onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}><ChevronLeft className="size-4" /></Button>
                                );
                                if (link.label === 'Next &raquo;') return (
                                    <Button key={i} variant="outline" size="icon" className="size-8" disabled={!link.url} onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}><ChevronRight className="size-4" /></Button>
                                );
                                return (
                                    <Button key={i} variant={link.active ? 'default' : 'outline'} size="icon" className="size-8" onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}>{link.label}</Button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            <AdFormModal open={modalOpen} onClose={() => setModalOpen(false)} editAd={editAd} />
            <DeleteDialog open={!!deleteAd} onClose={() => setDeleteAd(null)} ad={deleteAd} />
        </AppLayout>
    );
}
