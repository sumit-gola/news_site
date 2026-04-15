import { router } from '@inertiajs/react';
import {
    Check,
    Copy,
    ExternalLink,
    FileText,
    Grid3X3,
    Image as ImageIcon,
    Loader2,
    Music,
    Pencil,
    Search,
    Trash2,
    Upload,
    Video,
    X,
} from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

// ── Types ─────────────────────────────────────────────────────────────────────

type MediaItem = {
    id: number;
    url: string;
    file_name: string;
    file_type: 'image' | 'video' | 'audio' | 'document';
    mime_type: string | null;
    file_size: number | null;
    width: number | null;
    height: number | null;
    alt_text: string | null;
    human_size: string;
    created_at: string;
    user?: { id: number; name: string };
};

type PaginationLink = { url: string | null; label: string; active: boolean };

type PaginatedMedia = {
    data: MediaItem[];
    current_page: number;
    last_page: number;
    total: number;
    links: PaginationLink[];
};

type Stats = { total: number; images: number; videos: number; documents: number };

type Props = {
    media: PaginatedMedia;
    filters: { search?: string; type?: string };
    stats: Stats;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/dashboard' },
    { title: 'Media Library', href: '/admin/media' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function FileTypeIcon({ type }: { type: string }) {
    if (type === 'image')    return <ImageIcon className="size-8 text-blue-400" />;
    if (type === 'video')    return <Video className="size-8 text-purple-400" />;
    if (type === 'audio')    return <Music className="size-8 text-green-400" />;
    return <FileText className="size-8 text-gray-400" />;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function MediaIndex({ media, filters, stats }: Props) {
    const [search, setSearch]       = useState(filters.search ?? '');
    const [typeFilter, setTypeFilter] = useState(filters.type ?? '');
    const [selected, setSelected]   = useState<MediaItem | null>(null);
    const [bulkIds, setBulkIds]     = useState<Set<number>>(new Set());
    const [bulkMode, setBulkMode]   = useState(false);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver]   = useState(false);
    const [editName, setEditName]   = useState('');
    const [editAlt, setEditAlt]     = useState('');
    const [editSaving, setEditSaving] = useState(false);
    const [copied, setCopied]       = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const searchTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Filter / search ───────────────────────────────────────────────────────

    const applyFilters = useCallback((s: string, t: string) => {
        router.get('/admin/media', { search: s || undefined, type: t || undefined }, { preserveState: true, preserveScroll: true });
    }, []);

    const handleSearchChange = (v: string) => {
        setSearch(v);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => applyFilters(v, typeFilter), 400);
    };

    const handleTypeChange = (v: string) => {
        const next = v === 'all' ? '' : v;
        setTypeFilter(next);
        applyFilters(search, next);
    };

    // ── Selection ─────────────────────────────────────────────────────────────

    const openDetail = (item: MediaItem) => {
        if (bulkMode) {
            toggleBulk(item.id);
            return;
        }
        setSelected(item);
        setEditName(item.file_name);
        setEditAlt(item.alt_text ?? '');
    };

    const toggleBulk = (id: number) => {
        setBulkIds((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleBulkAll = () => {
        if (bulkIds.size === media.data.length) {
            setBulkIds(new Set());
        } else {
            setBulkIds(new Set(media.data.map((m) => m.id)));
        }
    };

    // ── Upload ────────────────────────────────────────────────────────────────

    const uploadFiles = async (files: File[]) => {
        if (!files.length) return;
        setUploading(true);
        const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
        try {
            for (const file of files) {
                const fd = new FormData();
                fd.append('file', file);
                await fetch('/admin/media', {
                    method: 'POST',
                    headers: { 'X-CSRF-TOKEN': csrfToken, 'X-Requested-With': 'XMLHttpRequest' },
                    body: fd,
                });
            }
            router.reload({ preserveScroll: true });
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const files = Array.from(e.dataTransfer.files);
        uploadFiles(files);
    };

    // ── Edit ──────────────────────────────────────────────────────────────────

    const saveEdit = async () => {
        if (!selected) return;
        setEditSaving(true);
        const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
        try {
            const res = await fetch(`/admin/media/${selected.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ file_name: editName, alt_text: editAlt }),
            });
            if (res.ok) {
                router.reload({ preserveScroll: true });
                setSelected(null);
            }
        } finally {
            setEditSaving(false);
        }
    };

    // ── Delete ────────────────────────────────────────────────────────────────

    const deleteItem = async (id: number) => {
        if (!confirm('Delete this file permanently?')) return;
        const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
        await fetch(`/admin/media/${id}`, {
            method: 'DELETE',
            headers: { 'X-CSRF-TOKEN': csrfToken, 'X-Requested-With': 'XMLHttpRequest' },
        });
        if (selected?.id === id) setSelected(null);
        router.reload({ preserveScroll: true });
    };

    const bulkDelete = async () => {
        if (!bulkIds.size || !confirm(`Delete ${bulkIds.size} file(s) permanently?`)) return;
        const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
        await fetch('/admin/media/bulk', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: JSON.stringify({ ids: Array.from(bulkIds) }),
        });
        setBulkIds(new Set());
        setBulkMode(false);
        router.reload({ preserveScroll: true });
    };

    const copyUrl = (url: string) => {
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        });
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="p-4 md:p-6">
                {/* Header */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">Media Library</h1>
                        <p className="text-sm text-muted-foreground">{stats.total.toLocaleString()} files</p>
                    </div>
                    <div className="flex gap-2">
                        {bulkMode ? (
                            <>
                                <Button variant="outline" size="sm" onClick={() => { setBulkMode(false); setBulkIds(new Set()); }}>
                                    Cancel
                                </Button>
                                <Button variant="outline" size="sm" onClick={toggleBulkAll}>
                                    {bulkIds.size === media.data.length ? 'Deselect All' : 'Select All'}
                                </Button>
                                {bulkIds.size > 0 && (
                                    <Button variant="destructive" size="sm" onClick={bulkDelete}>
                                        <Trash2 className="mr-1.5 size-3.5" />
                                        Delete ({bulkIds.size})
                                    </Button>
                                )}
                            </>
                        ) : (
                            <>
                                <Button variant="outline" size="sm" onClick={() => setBulkMode(true)}>
                                    <Grid3X3 className="mr-1.5 size-3.5" />
                                    Select
                                </Button>
                                <Button
                                    size="sm"
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                >
                                    {uploading ? (
                                        <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                                    ) : (
                                        <Upload className="mr-1.5 size-3.5" />
                                    )}
                                    Upload
                                </Button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                                    className="hidden"
                                    onChange={(e) => uploadFiles(Array.from(e.target.files ?? []))}
                                />
                            </>
                        )}
                    </div>
                </div>

                {/* Stats */}
                <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                        { label: 'Images',    count: stats.images,    color: 'text-blue-600'   },
                        { label: 'Videos',    count: stats.videos,    color: 'text-purple-600' },
                        { label: 'Documents', count: stats.documents, color: 'text-orange-600' },
                        { label: 'Total',     count: stats.total,     color: 'text-red-600'    },
                    ].map(({ label, count, color }) => (
                        <div key={label} className="rounded-lg border bg-card p-3">
                            <p className="text-xs text-muted-foreground">{label}</p>
                            <p className={`text-xl font-bold ${color}`}>{count.toLocaleString()}</p>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="mb-4 flex flex-wrap gap-2">
                    <div className="relative flex-1 min-w-48">
                        <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search files…"
                            value={search}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="pl-8 h-9"
                        />
                    </div>
                    <Select value={typeFilter || 'all'} onValueChange={handleTypeChange}>
                        <SelectTrigger className="w-36 h-9">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All types</SelectItem>
                            <SelectItem value="image">Images</SelectItem>
                            <SelectItem value="video">Videos</SelectItem>
                            <SelectItem value="audio">Audio</SelectItem>
                            <SelectItem value="document">Documents</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex gap-6">
                    {/* Grid */}
                    <div className="flex-1 min-w-0">
                        {/* Drop zone */}
                        <div
                            className={`mb-4 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition ${
                                dragOver ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : 'border-gray-200 dark:border-gray-800'
                            } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                        >
                            {uploading ? (
                                <><Loader2 className="size-5 animate-spin text-red-500" /><p className="text-sm text-muted-foreground">Uploading…</p></>
                            ) : (
                                <><Upload className="size-5 text-muted-foreground" /><p className="text-xs text-muted-foreground">Drop files here to upload</p></>
                            )}
                        </div>

                        {/* Media grid */}
                        {media.data.length === 0 ? (
                            <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-xl border bg-muted/30">
                                <ImageIcon className="size-10 text-muted-foreground/30" />
                                <p className="text-sm text-muted-foreground">No files found</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                                {media.data.map((item) => {
                                    const isSelected = selected?.id === item.id;
                                    const isBulked   = bulkIds.has(item.id);

                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => openDetail(item)}
                                            className={`group relative aspect-square overflow-hidden rounded-lg border-2 bg-muted transition ${
                                                isSelected ? 'border-red-500 ring-2 ring-red-400/30'
                                                : isBulked  ? 'border-blue-500 ring-2 ring-blue-400/30'
                                                : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                                            }`}
                                        >
                                            {item.file_type === 'image' ? (
                                                <img
                                                    src={item.url}
                                                    alt={item.alt_text ?? item.file_name}
                                                    className="size-full object-cover"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="flex size-full flex-col items-center justify-center gap-1 p-2">
                                                    <FileTypeIcon type={item.file_type} />
                                                    <span className="line-clamp-2 text-center text-[10px] leading-tight text-muted-foreground">
                                                        {item.file_name}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Bulk checkbox overlay */}
                                            {bulkMode && (
                                                <div className={`absolute inset-0 flex items-center justify-center ${isBulked ? 'bg-blue-500/20' : 'bg-black/0 group-hover:bg-black/10'}`}>
                                                    {isBulked && (
                                                        <div className="flex size-6 items-center justify-center rounded-full bg-blue-500">
                                                            <Check className="size-3.5 text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Pagination */}
                        {media.last_page > 1 && (
                            <div className="mt-6 flex items-center justify-center gap-1">
                                {media.links.map((link, i) => (
                                    <Button
                                        key={i}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url, {}, { preserveScroll: true })}
                                        className={`h-8 min-w-8 text-xs ${link.active ? 'bg-red-600 hover:bg-red-700' : ''}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Detail panel */}
                    {selected && (
                        <div className="w-64 shrink-0">
                            <div className="sticky top-4 rounded-xl border bg-card p-4 shadow-sm">
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="text-sm font-semibold">File Details</h3>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setSelected(null)}>
                                        <X className="size-3.5" />
                                    </Button>
                                </div>

                                {/* Preview */}
                                <div className="mb-3 overflow-hidden rounded-lg bg-muted">
                                    {selected.file_type === 'image' ? (
                                        <img src={selected.url} alt={selected.alt_text ?? ''} className="max-h-40 w-full object-contain" />
                                    ) : (
                                        <div className="flex h-24 items-center justify-center">
                                            <FileTypeIcon type={selected.file_type} />
                                        </div>
                                    )}
                                </div>

                                {/* Meta */}
                                <div className="mb-3 space-y-1 text-xs text-muted-foreground">
                                    <p><span className="font-medium text-foreground">Size:</span> {selected.human_size}</p>
                                    {selected.width && selected.height && (
                                        <p><span className="font-medium text-foreground">Dimensions:</span> {selected.width}×{selected.height}</p>
                                    )}
                                    {selected.mime_type && (
                                        <p><span className="font-medium text-foreground">Type:</span> {selected.mime_type}</p>
                                    )}
                                    {selected.user && (
                                        <p><span className="font-medium text-foreground">By:</span> {selected.user.name}</p>
                                    )}
                                </div>

                                <Separator className="my-3" />

                                {/* Editable fields */}
                                <div className="space-y-3">
                                    <div>
                                        <Label className="text-xs">File name</Label>
                                        <Input
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="mt-1 h-7 text-xs"
                                        />
                                    </div>
                                    {selected.file_type === 'image' && (
                                        <div>
                                            <Label className="text-xs">Alt text</Label>
                                            <Textarea
                                                value={editAlt}
                                                onChange={(e) => setEditAlt(e.target.value)}
                                                className="mt-1 min-h-[60px] text-xs resize-none"
                                                placeholder="Describe the image…"
                                            />
                                        </div>
                                    )}
                                    <Button
                                        size="sm"
                                        className="w-full h-7 text-xs"
                                        onClick={saveEdit}
                                        disabled={editSaving}
                                    >
                                        {editSaving ? <Loader2 className="mr-1.5 size-3 animate-spin" /> : <Pencil className="mr-1.5 size-3" />}
                                        Save Changes
                                    </Button>
                                </div>

                                <Separator className="my-3" />

                                {/* Actions */}
                                <div className="space-y-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full h-7 justify-start text-xs"
                                        onClick={() => copyUrl(selected.url)}
                                    >
                                        {copied ? <Check className="mr-1.5 size-3 text-green-500" /> : <Copy className="mr-1.5 size-3" />}
                                        {copied ? 'Copied!' : 'Copy URL'}
                                    </Button>
                                    <a
                                        href={selected.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex h-7 w-full items-center justify-start gap-1.5 rounded-md border border-input bg-background px-3 text-xs font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                                    >
                                        <ExternalLink className="size-3" />
                                        Open in new tab
                                    </a>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="w-full h-7 justify-start text-xs"
                                        onClick={() => deleteItem(selected.id)}
                                    >
                                        <Trash2 className="mr-1.5 size-3" />
                                        Delete file
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
