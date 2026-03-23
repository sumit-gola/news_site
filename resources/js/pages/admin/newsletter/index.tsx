import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Download, Mail, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { PaginatedData } from '@/types';

interface Subscriber {
    id: number; email: string; name: string; status: string;
    confirmed_at: string | null; created_at: string;
}
interface Counts { active: number; pending: number; unsubscribed: number }

const STATUS_COLORS: Record<string, string> = {
    active:       'bg-green-100 text-green-700',
    pending:      'bg-yellow-100 text-yellow-700',
    unsubscribed: 'bg-gray-100 text-gray-700',
};

export default function NewsletterIndex({
    subscribers, filters, counts,
}: {
    subscribers: PaginatedData<Subscriber>;
    filters: { status?: string; search?: string };
    counts: Counts;
}) {
    function del(subscriber: Subscriber) {
        if (confirm(`Remove ${subscriber.email}?`)) router.delete(`/admin/newsletter/${subscriber.id}`);
    }

    return (
        <AppLayout breadcrumbs={[{ title: 'Admin', href: '/admin/dashboard' }, { title: 'Newsletter', href: '/admin/newsletter' }]}>
            <Head title="Newsletter Subscribers" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Newsletter Subscribers</h1>
                    <Button variant="outline" size="sm" asChild>
                        <a href="/admin/newsletter/export"><Download className="mr-1 size-4" />Export CSV</a>
                    </Button>
                </div>

                {/* Counts */}
                <div className="flex gap-3">
                    {[
                        { label: 'Active', count: counts.active, status: 'active' },
                        { label: 'Pending', count: counts.pending, status: 'pending' },
                        { label: 'Unsubscribed', count: counts.unsubscribed, status: 'unsubscribed' },
                    ].map(({ label, count, status }) => (
                        <button
                            key={status}
                            onClick={() => router.get('/admin/newsletter', { status }, { preserveState: true })}
                            className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted ${filters.status === status ? 'bg-muted font-medium' : ''}`}
                        >
                            <Mail className="size-4" />
                            {label} <Badge variant="secondary">{count}</Badge>
                        </button>
                    ))}
                    {filters.status && (
                        <Button variant="ghost" size="sm" onClick={() => router.get('/admin/newsletter', {})}>Clear</Button>
                    )}
                </div>

                {/* Search */}
                <Input
                    placeholder="Search by email or name…"
                    defaultValue={filters.search}
                    className="max-w-xs"
                    onChange={e => router.get('/admin/newsletter', { ...filters, search: e.target.value }, { preserveState: true, replace: true })}
                />

                <Card>
                    <CardContent className="p-0">
                        {subscribers.data.length === 0 ? (
                            <p className="px-4 py-8 text-center text-sm text-muted-foreground">No subscribers found.</p>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="border-b bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium">Email</th>
                                        <th className="px-4 py-3 text-left font-medium">Name</th>
                                        <th className="px-4 py-3 text-left font-medium">Status</th>
                                        <th className="px-4 py-3 text-left font-medium">Subscribed</th>
                                        <th className="px-4 py-3 text-left font-medium"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {subscribers.data.map((s) => (
                                        <tr key={s.id} className="hover:bg-muted/30">
                                            <td className="px-4 py-3 font-medium">{s.email}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{s.name || '—'}</td>
                                            <td className="px-4 py-3">
                                                <Badge variant="secondary" className={STATUS_COLORS[s.status] ?? ''}>{s.status}</Badge>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</td>
                                            <td className="px-4 py-3">
                                                <Button size="icon" variant="ghost" className="size-7 text-red-500" onClick={() => del(s)}>
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
