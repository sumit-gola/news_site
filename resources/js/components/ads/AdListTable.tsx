import { Link, router } from '@inertiajs/react';
import { MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
};

const statusBadge: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    active: 'default',
    inactive: 'secondary',
    scheduled: 'outline',
    expired: 'destructive',
};

export default function AdListTable({ ads }: Props) {
    const destroyAd = (id: number) => {
        if (!window.confirm('Delete this ad?')) {
            return;
        }

        router.delete(`/admin/advertisements/${id}`);
    };

    const toggleStatus = (id: number) => {
        router.patch(`/admin/advertisements/${id}/toggle-status`);
    };

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Ad Preview</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Page</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {ads.data.map((ad) => (
                    <TableRow key={ad.id}>
                        <TableCell className="w-[180px]"><AdPreviewCard ad={ad} /></TableCell>
                        <TableCell className="font-medium">{ad.title}</TableCell>
                        <TableCell>{ad.advertiser?.name ?? '-'}</TableCell>
                        <TableCell className="capitalize">{ad.position}</TableCell>
                        <TableCell>{ad.pages.join(', ') || 'All'}</TableCell>
                        <TableCell>{ad.width ?? '-'} x {ad.height ?? '-'}</TableCell>
                        <TableCell>{ad.start_date ? new Date(ad.start_date).toLocaleDateString() : '-'}</TableCell>
                        <TableCell>{ad.end_date ? new Date(ad.end_date).toLocaleDateString() : '-'}</TableCell>
                        <TableCell>
                            <Badge variant={statusBadge[ad.status] ?? 'secondary'} className="capitalize">
                                {ad.status}
                            </Badge>
                        </TableCell>
                        <TableCell>{ad.priority}</TableCell>
                        <TableCell className="text-right">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="size-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                        <Link href={`/admin/advertisements/${ad.id}/edit`}>Edit</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => toggleStatus(ad.id)}>
                                        Toggle Status
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive" onClick={() => destroyAd(ad.id)}>
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))}
                {ads.data.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={11} className="py-10 text-center text-muted-foreground">
                            No ads found for selected filters.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}
