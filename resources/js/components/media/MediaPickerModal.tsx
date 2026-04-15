import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Image as ImageIcon, Loader2, Search, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type MediaItem = {
    id: number;
    url: string;
    file_name: string;
    alt_text: string | null;
    width: number | null;
    height: number | null;
    human_size: string;
};

type PaginatedResponse = {
    data: MediaItem[];
    current_page: number;
    last_page: number;
    total: number;
};

type Props = {
    open: boolean;
    onClose: () => void;
    onSelect: (url: string, altText: string) => void;
};

export default function MediaPickerModal({ open, onClose, onSelect }: Props) {
    const [tab, setTab] = useState<'library' | 'upload'>('library');
    const [items, setItems] = useState<MediaItem[]>([]);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState<MediaItem | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadDrag, setUploadDrag] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchMedia = useCallback(async (pg: number, q: string) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(pg) });
            if (q) params.set('search', q);
            const res  = await fetch(`/api/media?${params.toString()}`);
            const data: PaginatedResponse = await res.json();
            setItems(pg === 1 ? data.data : (prev) => [...prev, ...data.data]);
            setLastPage(data.last_page);
            setPage(pg);
        } finally {
            setLoading(false);
        }
    }, []);

    // Reset & fetch when opened
    useEffect(() => {
        if (!open) return;
        setSelected(null);
        setSearch('');
        setPage(1);
        fetchMedia(1, '');
    }, [open, fetchMedia]);

    // Debounced search
    useEffect(() => {
        if (!open) return;
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => fetchMedia(1, search), 350);
        return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
    }, [search, open, fetchMedia]);

    const uploadFiles = async (files: File[]) => {
        if (!files.length) return;
        setUploading(true);
        const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
        try {
            for (const file of files) {
                const fd = new FormData();
                fd.append('file', file);
                const res = await fetch('/admin/media', {
                    method: 'POST',
                    headers: { 'X-CSRF-TOKEN': csrfToken, 'X-Requested-With': 'XMLHttpRequest' },
                    body: fd,
                });
                if (res.ok) {
                    const item: MediaItem = await res.json();
                    setItems((prev) => [item, ...prev]);
                }
            }
            setTab('library');
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setUploadDrag(false);
        const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
        uploadFiles(files);
    };

    const handleInsert = () => {
        if (!selected) return;
        onSelect(selected.url, selected.alt_text ?? '');
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-h-[85vh] max-w-4xl overflow-hidden p-0 flex flex-col">
                <DialogHeader className="px-4 pt-4 pb-0 shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        <ImageIcon className="size-4 text-red-600" />
                        Media Library
                    </DialogTitle>
                </DialogHeader>

                <Tabs value={tab} onValueChange={(v) => setTab(v as 'library' | 'upload')} className="flex flex-col flex-1 overflow-hidden">
                    <div className="px-4 pt-2 shrink-0">
                        <TabsList className="h-8">
                            <TabsTrigger value="library" className="text-xs">Browse Library</TabsTrigger>
                            <TabsTrigger value="upload" className="text-xs">Upload New</TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Library Tab */}
                    <TabsContent value="library" className="flex flex-col flex-1 overflow-hidden m-0 px-4 pb-4">
                        {/* Search */}
                        <div className="relative my-3 shrink-0">
                            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search by filename..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-8 pl-8 text-sm"
                            />
                        </div>

                        {/* Grid */}
                        <div className="flex-1 overflow-y-auto">
                            {loading && items.length === 0 ? (
                                <div className="flex h-40 items-center justify-center">
                                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : items.length === 0 ? (
                                <div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
                                    <ImageIcon className="size-8 opacity-30" />
                                    <p className="text-sm">No images found</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6">
                                    {items.map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => setSelected(selected?.id === item.id ? null : item)}
                                            className={`group relative aspect-square overflow-hidden rounded-md border-2 bg-gray-100 transition dark:bg-gray-800 ${
                                                selected?.id === item.id
                                                    ? 'border-red-500 ring-2 ring-red-500/30'
                                                    : 'border-transparent hover:border-gray-300'
                                            }`}
                                        >
                                            <img
                                                src={item.url}
                                                alt={item.alt_text ?? item.file_name}
                                                className="size-full object-cover"
                                                loading="lazy"
                                            />
                                            {selected?.id === item.id && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-red-500/20">
                                                    <div className="flex size-6 items-center justify-center rounded-full bg-red-500">
                                                        <Check className="size-3.5 text-white" />
                                                    </div>
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Load more */}
                            {page < lastPage && !loading && (
                                <div className="mt-4 flex justify-center">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fetchMedia(page + 1, search)}
                                    >
                                        Load more
                                    </Button>
                                </div>
                            )}
                            {loading && items.length > 0 && (
                                <div className="mt-4 flex justify-center">
                                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                                </div>
                            )}
                        </div>

                        {/* Selected preview + actions */}
                        {selected && (
                            <div className="mt-3 flex items-center gap-3 rounded-lg border bg-muted/50 p-2.5 shrink-0">
                                <img src={selected.url} alt={selected.alt_text ?? ''} className="size-12 rounded object-cover shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="truncate text-xs font-medium">{selected.file_name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {selected.width && selected.height ? `${selected.width}×${selected.height} · ` : ''}{selected.human_size}
                                    </p>
                                </div>
                                <Button size="sm" onClick={handleInsert} className="bg-red-600 hover:bg-red-700 text-white shrink-0">
                                    Insert
                                </Button>
                            </div>
                        )}

                        {!selected && (
                            <p className="mt-2 shrink-0 text-center text-xs text-muted-foreground">
                                Click an image to select it
                            </p>
                        )}
                    </TabsContent>

                    {/* Upload Tab */}
                    <TabsContent value="upload" className="m-0 px-4 pb-4">
                        <div
                            className={`mt-3 flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-12 transition ${
                                uploadDrag ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : 'border-gray-300 dark:border-gray-700'
                            }`}
                            onDragOver={(e) => { e.preventDefault(); setUploadDrag(true); }}
                            onDragLeave={() => setUploadDrag(false)}
                            onDrop={handleDrop}
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="size-8 animate-spin text-red-500" />
                                    <p className="text-sm font-medium">Uploading…</p>
                                </>
                            ) : (
                                <>
                                    <Upload className="size-8 text-muted-foreground" />
                                    <div className="text-center">
                                        <p className="text-sm font-medium">Drag & drop images here</p>
                                        <p className="mt-1 text-xs text-muted-foreground">JPG, PNG, GIF, WebP, SVG — max 10 MB</p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        Browse files
                                    </Button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                        onChange={(e) => uploadFiles(Array.from(e.target.files ?? []))}
                                    />
                                </>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
