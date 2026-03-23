import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { PaginatedData } from '@/types';

interface Page {
    id: number;
    title: string;
    slug: string;
    status: string;
    template: string;
    show_in_menu: boolean;
    order: number;
    created_at: string;
}

export default function PagesIndex({ pages }: { pages: PaginatedData<Page> }) {
    function del(page: Page) {
        if (confirm(`Delete page "${page.title}"?`)) router.delete(`/admin/pages/${page.id}`);
    }

    return (
        <AppLayout breadcrumbs={[{ title: 'Admin', href: '/admin/dashboard' }, { title: 'Pages', href: '/admin/pages' }]}>
            <Head title="Pages" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Static Pages</h1>
                    <Button asChild size="sm">
                        <Link href="/admin/pages/create">
                            <Plus className="mr-1 size-4" />
                            New Page
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardContent className="p-0">
                        {pages.data.length === 0 ? (
                            <p className="px-4 py-8 text-center text-sm text-muted-foreground">No pages yet.</p>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="border-b bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium">Title</th>
                                        <th className="px-4 py-3 text-left font-medium">Slug</th>
                                        <th className="px-4 py-3 text-left font-medium">Status</th>
                                        <th className="px-4 py-3 text-left font-medium">Menu</th>
                                        <th className="px-4 py-3 text-left font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {pages.data.map((page) => (
                                        <tr key={page.id} className="hover:bg-muted/30">
                                            <td className="px-4 py-3 font-medium">{page.title}</td>
                                            <td className="px-4 py-3 text-muted-foreground">/{page.slug}</td>
                                            <td className="px-4 py-3">
                                                <Badge
                                                    variant="secondary"
                                                    className={page.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}
                                                >
                                                    {page.status}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">{page.show_in_menu ? '✓' : '—'}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-1">
                                                    <Button asChild size="icon" variant="ghost" className="size-7" title="Preview">
                                                        <Link href={`/page/${page.slug}`} target="_blank"><Eye className="size-4" /></Link>
                                                    </Button>
                                                    <Button asChild size="icon" variant="ghost" className="size-7">
                                                        <Link href={`/admin/pages/${page.id}/edit`}><Pencil className="size-4" /></Link>
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="size-7 text-red-500" onClick={() => del(page)}>
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </div>
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
