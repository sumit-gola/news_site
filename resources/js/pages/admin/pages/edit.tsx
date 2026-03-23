import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import RichTextEditor from '@/components/rich-text-editor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Page {
    id: number; title: string; slug: string; content: string; excerpt: string;
    status: string; meta_title: string; meta_description: string;
    show_in_menu: boolean; order: number; template: string;
}

export default function EditPage({ page }: { page: Page }) {
    const form = useForm({
        title:            page.title,
        slug:             page.slug,
        content:          page.content,
        excerpt:          page.excerpt ?? '',
        status:           page.status,
        meta_title:       page.meta_title ?? '',
        meta_description: page.meta_description ?? '',
        show_in_menu:     page.show_in_menu,
        order:            page.order,
        template:         page.template,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        form.put(`/admin/pages/${page.id}`);
    }

    return (
        <AppLayout breadcrumbs={[
            { title: 'Admin', href: '/admin/dashboard' },
            { title: 'Pages', href: '/admin/pages' },
            { title: 'Edit', href: `/admin/pages/${page.id}/edit` },
        ]}>
            <Head title={`Edit: ${page.title}`} />
            <form onSubmit={handleSubmit} className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Edit Page</h1>
                    <div className="flex gap-2">
                        <Select value={form.data.status} onValueChange={v => form.setData('status', v)}>
                            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="published">Published</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button type="submit" disabled={form.processing}>Update Page</Button>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        <Card>
                            <CardContent className="space-y-4 pt-4">
                                <div className="space-y-1">
                                    <Label>Title *</Label>
                                    <Input value={form.data.title} onChange={e => form.setData('title', e.target.value)} />
                                    {form.errors.title && <p className="text-xs text-red-500">{form.errors.title}</p>}
                                </div>
                                <div className="space-y-1">
                                    <Label>Slug</Label>
                                    <Input value={form.data.slug} onChange={e => form.setData('slug', e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <Label>Excerpt</Label>
                                    <Textarea value={form.data.excerpt} onChange={e => form.setData('excerpt', e.target.value)} rows={2} />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm">Content *</CardTitle></CardHeader>
                            <CardContent>
                                <RichTextEditor value={form.data.content} onChange={(v: string) => form.setData('content', v)} />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-4">
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm">Settings</CardTitle></CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label>Show in Menu</Label>
                                    <Switch checked={form.data.show_in_menu} onCheckedChange={v => form.setData('show_in_menu', v)} />
                                </div>
                                <div className="space-y-1">
                                    <Label>Order</Label>
                                    <Input type="number" value={form.data.order} onChange={e => form.setData('order', Number(e.target.value))} />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm">SEO</CardTitle></CardHeader>
                            <CardContent className="space-y-3">
                                <div className="space-y-1">
                                    <Label>Meta Title</Label>
                                    <Input value={form.data.meta_title} onChange={e => form.setData('meta_title', e.target.value)} maxLength={70} />
                                </div>
                                <div className="space-y-1">
                                    <Label>Meta Description</Label>
                                    <Textarea value={form.data.meta_description} onChange={e => form.setData('meta_description', e.target.value)} rows={3} maxLength={160} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}
