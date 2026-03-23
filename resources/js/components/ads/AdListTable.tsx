import { Link, router } from '@inertiajs/react';
import { Grid3X3, List, MoreHorizontal, Pin, PinOff, Star } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { AdvertisementRecord, Paginated } from '@/types';
import AdPreviewCard from './AdPreviewCard';

type Props = {
    ads: Paginated<AdvertisementRecord>;
    slots: Array<{ id: number; name: string }>;
};

type BulkAction = 'activate' | 'pause' | 'archive' | 'duplicate' | 'move_slot' | 'change_priority' | 'delete' | 'pin' | 'unpin';

type VisibleColumn =
    | 'title'
    | 'client'
    | 'position'
    | 'pages'
    | 'size'
    | 'schedule'
    | 'status'
    | 'workflow'
    | 'priority'
    | 'metrics'
    | 'flags';

const statusBadge: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    active: 'default',
    inactive: 'secondary',
    scheduled: 'outline',
    expired: 'destructive',
};

const defaultColumns: Record<VisibleColumn, boolean> = {
    title: true,
    client: true,
    position: true,
    pages: true,
    size: true,
    schedule: true,
    status: true,
    workflow: true,
    priority: true,
    metrics: true,
    flags: true,
};

export default function AdListTable({ ads, slots }: Props) {
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
    const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [bulkSlotId, setBulkSlotId] = useState<string>('');
    const [bulkPriority, setBulkPriority] = useState<string>('');
    const [visibleColumns, setVisibleColumns] = useState<Record<VisibleColumn, boolean>>(defaultColumns);

    const selectedCount = selectedIds.length;

    const allSelectedOnPage = useMemo(
        () => ads.data.length > 0 && ads.data.every((ad) => selectedIds.includes(ad.id)),
        [ads.data, selectedIds],
    );

    const toggleRow = (id: number) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter((item) => item !== id));

            return;
        }

        setSelectedIds([...selectedIds, id]);
    };

    const toggleAllOnPage = () => {
        if (allSelectedOnPage) {
            setSelectedIds([]);

            return;
        }

        setSelectedIds(ads.data.map((ad) => ad.id));
    };

    const destroyAd = (id: number) => {
        if (!window.confirm('Delete this ad?')) {
            return;
        }

        router.delete(`/admin/advertisements/${id}`);
    };

    const toggleStatus = (id: number) => {
        router.patch(`/admin/advertisements/${id}/toggle-status`);
    };

    const bulk = (action: BulkAction) => {
        if (selectedIds.length === 0) {
            return;
        }

        if (action === 'delete' && !window.confirm(`Delete ${selectedIds.length} selected ads?`)) {
            return;
        }

        router.patch('/admin/advertisements/bulk-action', {
            action,
            ids: selectedIds,
            slot_id: action === 'move_slot' ? Number(bulkSlotId) || null : null,
            priority: action === 'change_priority' ? Number(bulkPriority) || null : null,
        }, {
            preserveScroll: true,
            onSuccess: () => setSelectedIds([]),
        });
    };

    const rowPadding = density === 'compact' ? 'py-2' : 'py-3';

    return (
        <div className="space-y-3">
            <div className="sticky top-14 z-20 flex flex-wrap items-center gap-2 rounded-lg border bg-background/95 p-2 backdrop-blur">
                <Button type="button" size="sm" variant={viewMode === 'table' ? 'default' : 'outline'} onClick={() => setViewMode('table')}>
                    <List className="mr-1 size-4" /> Table
                </Button>
                <Button type="button" size="sm" variant={viewMode === 'cards' ? 'default' : 'outline'} onClick={() => setViewMode('cards')}>
                    <Grid3X3 className="mr-1 size-4" /> Cards
                </Button>

                <Button type="button" size="sm" variant={density === 'compact' ? 'default' : 'outline'} onClick={() => setDensity(density === 'compact' ? 'comfortable' : 'compact')}>
                    Density: {density}
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline">Columns</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuLabel>Visible Columns</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {(Object.keys(defaultColumns) as VisibleColumn[]).map((column) => (
                            <DropdownMenuCheckboxItem
                                key={column}
                                checked={visibleColumns[column]}
                                onCheckedChange={(checked) => setVisibleColumns((prev) => ({ ...prev, [column]: Boolean(checked) }))}
                            >
                                {column}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className="ml-auto flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground">Selected: {selectedCount}</span>
                    <Button type="button" size="sm" variant="outline" disabled={!selectedCount} onClick={() => bulk('activate')}>Activate</Button>
                    <Button type="button" size="sm" variant="outline" disabled={!selectedCount} onClick={() => bulk('pause')}>Pause</Button>
                    <Button type="button" size="sm" variant="outline" disabled={!selectedCount} onClick={() => bulk('archive')}>Archive</Button>
                    <Button type="button" size="sm" variant="outline" disabled={!selectedCount} onClick={() => bulk('duplicate')}>Duplicate</Button>
                    <Button type="button" size="sm" variant="outline" disabled={!selectedCount} onClick={() => bulk('pin')}>Pin</Button>
                    <Button type="button" size="sm" variant="outline" disabled={!selectedCount} onClick={() => bulk('unpin')}>Unpin</Button>
                    <Input className="h-8 w-28" placeholder="Priority" value={bulkPriority} onChange={(e) => setBulkPriority(e.target.value)} />
                    <Button type="button" size="sm" variant="outline" disabled={!selectedCount} onClick={() => bulk('change_priority')}>Set Priority</Button>
                    <select className="border-input bg-background h-8 rounded-md border px-2 text-xs" value={bulkSlotId} onChange={(e) => setBulkSlotId(e.target.value)}>
                        <option value="">Move to slot</option>
                        {slots.map((slot) => <option key={slot.id} value={slot.id}>{slot.name}</option>)}
                    </select>
                    <Button type="button" size="sm" variant="outline" disabled={!selectedCount || !bulkSlotId} onClick={() => bulk('move_slot')}>Move Slot</Button>
                    <Button type="button" size="sm" variant="destructive" disabled={!selectedCount} onClick={() => bulk('delete')}>Delete</Button>
                </div>
            </div>

            {viewMode === 'cards' ? (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {ads.data.map((ad) => (
                        <div key={ad.id} className="space-y-2 rounded-lg border p-3">
                            <div className="flex items-start justify-between gap-2">
                                <label className="flex items-center gap-2 text-sm font-medium">
                                    <input type="checkbox" checked={selectedIds.includes(ad.id)} onChange={() => toggleRow(ad.id)} />
                                    {ad.title}
                                </label>
                                <div className="flex items-center gap-1">
                                    {ad.is_pinned ? <Pin className="size-3.5 text-amber-500" /> : null}
                                    {ad.is_house_ad ? <Star className="size-3.5 text-blue-500" /> : null}
                                </div>
                            </div>
                            <AdPreviewCard ad={ad} />
                            <div className="grid gap-1 text-xs text-muted-foreground">
                                <p>{ad.advertiser?.name ?? 'No client'} • {ad.position}</p>
                                <p>Pages: {ad.pages.join(', ') || 'All'}</p>
                                <p>CTR: {ad.ctr}% • {ad.total_clicks} clicks</p>
                            </div>
                            <div className="flex items-center justify-between">
                                <Badge variant={statusBadge[ad.status] ?? 'secondary'} className="capitalize">{ad.status}</Badge>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" asChild><Link href={`/admin/advertisements/${ad.id}/edit`}>Edit</Link></Button>
                                    <Button size="sm" variant="outline" onClick={() => toggleStatus(ad.id)}>Toggle</Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[32px]"><input type="checkbox" checked={allSelectedOnPage} onChange={toggleAllOnPage} /></TableHead>
                            <TableHead>Preview</TableHead>
                            {visibleColumns.title && <TableHead>Title</TableHead>}
                            {visibleColumns.client && <TableHead>Client</TableHead>}
                            {visibleColumns.position && <TableHead>Position</TableHead>}
                            {visibleColumns.pages && <TableHead>Pages</TableHead>}
                            {visibleColumns.size && <TableHead>Size</TableHead>}
                            {visibleColumns.schedule && <TableHead>Schedule</TableHead>}
                            {visibleColumns.status && <TableHead>Status</TableHead>}
                            {visibleColumns.workflow && <TableHead>Workflow</TableHead>}
                            {visibleColumns.priority && <TableHead>Priority</TableHead>}
                            {visibleColumns.metrics && <TableHead>Metrics</TableHead>}
                            {visibleColumns.flags && <TableHead>Flags</TableHead>}
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {ads.data.map((ad) => (
                            <TableRow key={ad.id} tabIndex={0} onKeyDown={(e) => {
                                if (e.key.toLowerCase() === 'e') {
                                    router.visit(`/admin/advertisements/${ad.id}/edit`);
                                }
                            }}>
                                <TableCell className={rowPadding}><input type="checkbox" checked={selectedIds.includes(ad.id)} onChange={() => toggleRow(ad.id)} /></TableCell>
                                <TableCell className={rowPadding + ' w-[160px]'}><AdPreviewCard ad={ad} /></TableCell>
                                {visibleColumns.title && <TableCell className={rowPadding + ' font-medium'}>{ad.title}</TableCell>}
                                {visibleColumns.client && <TableCell className={rowPadding}>{ad.advertiser?.name ?? '-'}</TableCell>}
                                {visibleColumns.position && <TableCell className={rowPadding + ' capitalize'}>{ad.position}</TableCell>}
                                {visibleColumns.pages && <TableCell className={rowPadding}>{ad.pages.join(', ') || 'All'}</TableCell>}
                                {visibleColumns.size && <TableCell className={rowPadding}>{ad.width ?? '-'} x {ad.height ?? '-'}</TableCell>}
                                {visibleColumns.schedule && (
                                    <TableCell className={rowPadding + ' text-xs'}>
                                        <p>{ad.start_date ? new Date(ad.start_date).toLocaleDateString() : 'Any time'}</p>
                                        <p>{ad.end_date ? new Date(ad.end_date).toLocaleDateString() : 'No end'}</p>
                                    </TableCell>
                                )}
                                {visibleColumns.status && <TableCell className={rowPadding}><Badge variant={statusBadge[ad.status] ?? 'secondary'} className="capitalize">{ad.status}</Badge></TableCell>}
                                {visibleColumns.workflow && <TableCell className={rowPadding}><Badge variant="outline" className="capitalize">{ad.workflow_status ?? 'draft'}</Badge></TableCell>}
                                {visibleColumns.priority && <TableCell className={rowPadding}>{ad.priority}</TableCell>}
                                {visibleColumns.metrics && <TableCell className={rowPadding + ' text-xs'}><p>{ad.total_impressions} imp</p><p>{ad.total_clicks} clk • {ad.ctr}%</p></TableCell>}
                                {visibleColumns.flags && (
                                    <TableCell className={rowPadding}>
                                        <div className="flex gap-1">
                                            {ad.is_pinned ? <Badge variant="outline"><Pin className="mr-1 size-3" />Pinned</Badge> : null}
                                            {ad.is_house_ad ? <Badge variant="outline"><Star className="mr-1 size-3" />House</Badge> : null}
                                        </div>
                                    </TableCell>
                                )}
                                <TableCell className={rowPadding + ' text-right'}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="size-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem asChild><Link href={`/admin/advertisements/${ad.id}/edit`}>Edit</Link></DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => toggleStatus(ad.id)}>Toggle Status</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => router.patch('/admin/advertisements/bulk-action', { action: ad.is_pinned ? 'unpin' : 'pin', ids: [ad.id] })}>
                                                {ad.is_pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
                                                {ad.is_pinned ? 'Unpin' : 'Pin'}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => router.patch('/admin/advertisements/bulk-action', { action: 'duplicate', ids: [ad.id] })}>Duplicate</DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive" onClick={() => destroyAd(ad.id)}>Delete</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                        {ads.data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={15} className="py-10 text-center text-muted-foreground">No ads found for selected filters.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            )}
        </div>
    );
}
