import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Clients', href: '/admin/advertisers' },
    { title: 'Add Client', href: '/admin/advertisers/create' },
];

export default function CreateAdvertiser() {
    const form = useForm({
        name: '',
        email: '',
        phone: '',
        company_name: '',
        notes: '',
        is_active: true,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/admin/advertisers');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Client" />

            <div className="p-6">
                <Card>
                    <CardHeader><CardTitle>Create Client</CardTitle></CardHeader>
                    <CardContent>
                        <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
                            <div className="space-y-1.5">
                                <Label>Name</Label>
                                <Input value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Email</Label>
                                <Input type="email" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Phone</Label>
                                <Input value={form.data.phone} onChange={(e) => form.setData('phone', e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Company</Label>
                                <Input value={form.data.company_name} onChange={(e) => form.setData('company_name', e.target.value)} />
                            </div>
                            <div className="space-y-1.5 md:col-span-2">
                                <Label>Notes</Label>
                                <Textarea value={form.data.notes} onChange={(e) => form.setData('notes', e.target.value)} />
                            </div>
                            <div className="flex items-center gap-2 md:col-span-2">
                                <Switch checked={form.data.is_active} onCheckedChange={(v) => form.setData('is_active', v)} />
                                <span className="text-sm">Active Client</span>
                            </div>
                            <div className="md:col-span-2 flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => window.history.back()}>Cancel</Button>
                                <Button type="submit" disabled={form.processing}>Save</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
