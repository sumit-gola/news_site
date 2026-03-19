import { Head, useForm } from '@inertiajs/react';
import { Loader2, Tags } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Category } from '@/types';

interface PageProps {
    category: Category;
    parentCategories: Category[];
}

export default function CategoryEdit({ category, parentCategories }: PageProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard',  href: '/dashboard' },
        { title: 'Categories', href: '/categories' },
        { title: category.name, href: `/categories/${category.slug}/edit` },
    ];

    const { data, setData, put, processing, errors } = useForm({
        name:        category.name,
        description: category.description ?? '',
        parent_id:   category.parent_id ? String(category.parent_id) : '',
        color:       category.color,
        is_active:   category.is_active,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/categories/${category.slug}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit – ${category.name}`} />

            <div className="flex flex-1 flex-col gap-6 p-6">
                <div className="flex items-center gap-3">
                    <Tags className="text-muted-foreground size-6" />
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Edit Category</h1>
                        <p className="text-muted-foreground text-sm">Update "{category.name}".</p>
                    </div>
                </div>

                <form onSubmit={submit} className="max-w-xl space-y-5">
                    <div className="grid gap-1.5">
                        <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                        />
                        {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="description">Description</Label>
                        <textarea
                            id="description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={3}
                            className="border-input bg-background text-foreground placeholder:text-muted-foreground w-full rounded-md border px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-1"
                        />
                        {errors.description && <p className="text-destructive text-xs">{errors.description}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-1.5">
                            <Label htmlFor="parent_id">Parent Category</Label>
                            <select
                                id="parent_id"
                                value={data.parent_id}
                                onChange={(e) => setData('parent_id', e.target.value)}
                                className="border-input bg-background text-foreground flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1"
                            >
                                <option value="">None (main category)</option>
                                {parentCategories
                                    .filter((c) => c.id !== category.id)
                                    .map((c) => (
                                        <option key={c.id} value={String(c.id)}>{c.name}</option>
                                    ))}
                            </select>
                            {errors.parent_id && <p className="text-destructive text-xs">{errors.parent_id}</p>}
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="color">Color</Label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    id="color"
                                    value={data.color}
                                    onChange={(e) => setData('color', e.target.value)}
                                    className="h-9 w-10 cursor-pointer rounded-md border p-1"
                                />
                                <Input
                                    value={data.color}
                                    onChange={(e) => setData('color', e.target.value)}
                                    className="font-mono text-xs"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Switch
                            id="is_active"
                            checked={data.is_active}
                            onCheckedChange={(v) => setData('is_active', v)}
                        />
                        <Label htmlFor="is_active">Active</Label>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <Button type="submit" disabled={processing}>
                            {processing && <Loader2 className="mr-1.5 size-4 animate-spin" />}
                            Save Changes
                        </Button>
                        <Button type="button" variant="outline" onClick={() => history.back()}>
                            Cancel
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
