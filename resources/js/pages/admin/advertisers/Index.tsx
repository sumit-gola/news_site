import { Head, Link, router, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Paginated } from '@/types';

type AdvertiserRow = {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    advertisements_count: number;
    active_ads_count: number;
    is_active: boolean;
};

type Props = {
    advertisers: Paginated<AdvertiserRow>;
    filters: { search?: string };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Clients', href: '/admin/advertisers' },
];

export default function AdvertisersIndex({ advertisers, filters }: Props) {
    const form = useForm({ search: filters.search ?? '' });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/advertisers', { search: form.data.search || undefined }, { preserveState: true, replace: true });
    };

    const destroyClient = (id: number) => {
        if (!window.confirm('Delete this client?')) {
            return;
        }

        router.delete(`/admin/advertisers/${id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Clients" />

            <div className="grid gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Clients</h1>
                        <p className="text-sm text-muted-foreground">Manage advertiser profiles and relationships.</p>
                    </div>
                    <Button asChild>
                        <Link href="/admin/advertisers/create">Add Client</Link>
                    </Button>
                </div>

                <Card>
                    <CardContent className="p-4">
                        <form className="flex gap-2" onSubmit={submit}>
                            <Input value={form.data.search} onChange={(e) => form.setData('search', e.target.value)} placeholder="Search clients by name" />
                            <Button type="submit">Search</Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>All Clients</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Total Ads</TableHead>
                                    <TableHead>Active Ads</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {advertisers.data.map((client) => (
                                    <TableRow key={client.id}>
                                        <TableCell className="font-medium">{client.name}</TableCell>
                                        <TableCell>{client.email ?? '-'}</TableCell>
                                        <TableCell>{client.phone ?? '-'}</TableCell>
                                        <TableCell>{client.advertisements_count}</TableCell>
                                        <TableCell>{client.active_ads_count}</TableCell>
                                        <TableCell className="space-x-2 text-right">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/admin/advertisers/${client.id}/edit`}>Edit</Link>
                                            </Button>
                                            <Button variant="destructive" size="sm" onClick={() => destroyClient(client.id)}>Delete</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
