import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PaginatedData } from '@/types';

interface Tag { id: number; name: string; slug: string; articles_count: number }

export default function TagsIndex({ tags, filters }: { tags: PaginatedData<Tag>; filters: { search?: string } }) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName]   = useState('');

    const createForm = useForm({ name: '' });

    function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        createForm.post('/admin/tags', {
            onSuccess: () => createForm.reset(),
        });
    }

    function startEdit(tag: Tag) {
        setEditingId(tag.id);
        setEditName(tag.name);
    }

    function handleUpdate(tag: Tag) {
        router.put(`/admin/tags/${tag.id}`, { name: editName }, {
            onSuccess: () => setEditingId(null),
        });
    }

    function handleDelete(tag: Tag) {
        if (confirm(`Delete tag "${tag.name}"? Articles will keep their content but lose this tag.`)) {
            router.delete(`/admin/tags/${tag.id}`);
        }
    }

    return (
        <AppLayout breadcrumbs={[{ title: 'Admin', href: '/admin/dashboard' }, { title: 'Tags', href: '/admin/tags' }]}>
            <Head title="Tags" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Tags</h1>
                    <Badge variant="secondary">{tags.total} tags</Badge>
                </div>

                {/* Create Form */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Create New Tag</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreate} className="flex gap-2">
                            <Input
                                placeholder="Tag name…"
                                value={createForm.data.name}
                                onChange={e => createForm.setData('name', e.target.value)}
                                className="max-w-xs"
                            />
                            <Button type="submit" disabled={createForm.processing} size="sm">
                                <Plus className="mr-1 size-4" />
                                Add Tag
                            </Button>
                        </form>
                        {createForm.errors.name && <p className="mt-1 text-xs text-red-500">{createForm.errors.name}</p>}
                    </CardContent>
                </Card>

                {/* Search */}
                <Input
                    placeholder="Search tags…"
                    defaultValue={filters.search}
                    onChange={e => router.get('/admin/tags', { search: e.target.value }, { preserveState: true, replace: true })}
                    className="max-w-xs"
                />

                {/* Tag List */}
                <Card>
                    <CardContent className="p-0">
                        {tags.data.length === 0 ? (
                            <p className="px-4 py-8 text-center text-sm text-muted-foreground">No tags found.</p>
                        ) : (
                            <div className="divide-y">
                                {tags.data.map((tag) => (
                                    <div key={tag.id} className="flex items-center gap-3 px-4 py-3">
                                        {editingId === tag.id ? (
                                            <>
                                                <Input
                                                    value={editName}
                                                    onChange={e => setEditName(e.target.value)}
                                                    className="h-7 max-w-xs"
                                                    onKeyDown={e => e.key === 'Enter' && handleUpdate(tag)}
                                                    autoFocus
                                                />
                                                <Button size="sm" onClick={() => handleUpdate(tag)}>Save</Button>
                                                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex-1">
                                                    <span className="font-medium">{tag.name}</span>
                                                    <span className="ml-2 text-xs text-muted-foreground">/{tag.slug}</span>
                                                </div>
                                                <Badge variant="secondary" className="text-xs">{tag.articles_count} articles</Badge>
                                                <Button size="icon" variant="ghost" className="size-7" onClick={() => startEdit(tag)}>
                                                    <Pencil className="size-3" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="size-7 text-red-500 hover:text-red-600" onClick={() => handleDelete(tag)}>
                                                    <Trash2 className="size-3" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
