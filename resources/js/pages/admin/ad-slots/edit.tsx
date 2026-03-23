import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Props = {
    slot: {
        id: number;
        name: string;
        slug: string;
        page: string | null;
        position: string;
        allowed_sizes: string[] | null;
        description: string | null;
        is_active: boolean;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Ad Slots', href: '/admin/ad-slots' },
    { title: 'Edit Slot', href: '#' },
];

export default function EditAdSlot({ slot }: Props) {
    const form = useForm({
        name: slot.name,
        slug: slot.slug,
        page: slot.page ?? 'home',
        position: slot.position,
        allowed_sizes_text: (slot.allowed_sizes ?? []).join(', '),
        description: slot.description ?? '',
        is_active: slot.is_active,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        const allowed_sizes = form.data.allowed_sizes_text
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean);

        form.transform((data) => ({ ...data, allowed_sizes }));
        form.put(`/admin/ad-slots/${slot.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Ad Slot" />

            <div className="p-6">
                <Card>
                    <CardHeader><CardTitle>Edit Ad Slot</CardTitle></CardHeader>
                    <CardContent>
                        <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
                            <div className="space-y-1.5">
                                <Label>Name</Label>
                                <Input value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Slug</Label>
                                <Input value={form.data.slug} onChange={(e) => form.setData('slug', e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Page</Label>
                                <select className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm" value={form.data.page} onChange={(e) => form.setData('page', e.target.value)}>
                                    <option value="home">Home</option>
                                    <option value="article">Article</option>
                                    <option value="category">Category</option>
                                    <option value="search">Search</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Position</Label>
                                <select className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm" value={form.data.position} onChange={(e) => form.setData('position', e.target.value)}>
                                    <option value="header">Header Banner</option>
                                    <option value="sidebar">Sidebar</option>
                                    <option value="inline">Inline</option>
                                    <option value="footer">Footer</option>
                                    <option value="popup">Popup</option>
                                </select>
                            </div>
                            <div className="space-y-1.5 md:col-span-2">
                                <Label>Allowed Sizes (comma separated)</Label>
                                <Input value={form.data.allowed_sizes_text} onChange={(e) => form.setData('allowed_sizes_text', e.target.value)} placeholder="300x250, 728x90" />
                            </div>
                            <div className="space-y-1.5 md:col-span-2">
                                <Label>Description</Label>
                                <Textarea value={form.data.description} onChange={(e) => form.setData('description', e.target.value)} />
                            </div>
                            <div className="flex items-center gap-2 md:col-span-2">
                                <Switch checked={form.data.is_active} onCheckedChange={(v) => form.setData('is_active', v)} />
                                <span className="text-sm">Active Slot</span>
                            </div>
                            <div className="md:col-span-2 flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => window.history.back()}>Cancel</Button>
                                <Button type="submit" disabled={form.processing}>Update</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
