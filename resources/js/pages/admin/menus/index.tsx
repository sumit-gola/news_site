import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MenuItemData {
    id?: number; label: string; url: string; type: string; target: string; children: MenuItemData[];
}
interface Menu { id: number; name: string; location: string; is_active: boolean; items: MenuItemData[] }

export default function MenusIndex({ menus }: { menus: Menu[] }) {
    const [activeMenu, setActiveMenu] = useState<Menu | null>(menus[0] ?? null);
    const [items, setItems] = useState<MenuItemData[]>(activeMenu?.items ?? []);

    const createForm = useForm({ name: '', location: '' });

    function selectMenu(menu: Menu) {
        setActiveMenu(menu);
        setItems(menu.items ?? []);
    }

    function addItem() {
        setItems(prev => [...prev, { label: '', url: '', type: 'custom', target: '_self', children: [] }]);
    }

    function removeItem(idx: number) {
        setItems(prev => prev.filter((_, i) => i !== idx));
    }

    function updateItem(idx: number, field: string, value: string) {
        setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
    }

    function addChild(parentIdx: number) {
        setItems(prev => prev.map((item, i) =>
            i === parentIdx ? { ...item, children: [...item.children, { label: '', url: '', type: 'custom', target: '_self', children: [] }] } : item
        ));
    }

    function removeChild(parentIdx: number, childIdx: number) {
        setItems(prev => prev.map((item, i) =>
            i === parentIdx ? { ...item, children: item.children.filter((_, ci) => ci !== childIdx) } : item
        ));
    }

    function updateChild(parentIdx: number, childIdx: number, field: string, value: string) {
        setItems(prev => prev.map((item, i) =>
            i === parentIdx ? {
                ...item,
                children: item.children.map((child, ci) => ci === childIdx ? { ...child, [field]: value } : child)
            } : item
        ));
    }

    function saveMenu() {
        if (!activeMenu) return;
        router.post(`/admin/menus/${activeMenu.id}/items`, { items }, {
            onSuccess: () => alert('Menu saved!'),
        });
    }

    function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        createForm.post('/admin/menus', { onSuccess: () => createForm.reset() });
    }

    function delMenu(menu: Menu) {
        if (confirm(`Delete menu "${menu.name}"?`)) router.delete(`/admin/menus/${menu.id}`);
    }

    return (
        <AppLayout breadcrumbs={[{ title: 'Admin', href: '/admin/dashboard' }, { title: 'Menus', href: '/admin/menus' }]}>
            <Head title="Menu Builder" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <h1 className="text-2xl font-bold">Menu Builder</h1>

                <div className="grid gap-6 lg:grid-cols-4">
                    {/* Sidebar: menu list */}
                    <div className="space-y-4">
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm">Create Menu</CardTitle></CardHeader>
                            <CardContent>
                                <form onSubmit={handleCreate} className="space-y-2">
                                    <Input placeholder="Name" value={createForm.data.name} onChange={e => createForm.setData('name', e.target.value)} />
                                    <Input placeholder="Location (e.g. header)" value={createForm.data.location} onChange={e => createForm.setData('location', e.target.value)} />
                                    <Button type="submit" size="sm" className="w-full" disabled={createForm.processing}>
                                        <Plus className="mr-1 size-3" />Create
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm">Menus</CardTitle></CardHeader>
                            <CardContent className="space-y-1 p-2">
                                {menus.map(menu => (
                                    <div key={menu.id} className={`flex items-center justify-between rounded px-2 py-1.5 text-sm cursor-pointer hover:bg-muted ${activeMenu?.id === menu.id ? 'bg-muted font-medium' : ''}`} onClick={() => selectMenu(menu)}>
                                        <span>{menu.name}</span>
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs text-muted-foreground">{menu.location}</span>
                                            <Button size="icon" variant="ghost" className="size-5 text-red-500" onClick={e => { e.stopPropagation(); delMenu(menu); }}>
                                                <Trash2 className="size-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {menus.length === 0 && <p className="text-xs text-muted-foreground px-2">No menus yet.</p>}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Builder */}
                    <div className="space-y-4 lg:col-span-3">
                        {!activeMenu ? (
                            <Card>
                                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                                    Select or create a menu to start building.
                                </CardContent>
                            </Card>
                        ) : (
                            <>
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold">{activeMenu.name}</h2>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={addItem}><Plus className="mr-1 size-4" />Add Item</Button>
                                        <Button size="sm" onClick={saveMenu}>Save Menu</Button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {items.map((item, idx) => (
                                        <Card key={idx}>
                                            <CardContent className="pt-4 space-y-3">
                                                <div className="flex items-start gap-3">
                                                    <GripVertical className="mt-2 size-4 shrink-0 text-muted-foreground" />
                                                    <div className="grid flex-1 gap-2 sm:grid-cols-3">
                                                        <div>
                                                            <Label className="text-xs">Label</Label>
                                                            <Input value={item.label} onChange={e => updateItem(idx, 'label', e.target.value)} className="h-8" />
                                                        </div>
                                                        <div>
                                                            <Label className="text-xs">URL</Label>
                                                            <Input value={item.url} onChange={e => updateItem(idx, 'url', e.target.value)} className="h-8" placeholder="/path or https://..." />
                                                        </div>
                                                        <div>
                                                            <Label className="text-xs">Target</Label>
                                                            <Select value={item.target} onValueChange={v => updateItem(idx, 'target', v)}>
                                                                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="_self">Same Tab</SelectItem>
                                                                    <SelectItem value="_blank">New Tab</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                    <Button size="icon" variant="ghost" className="size-7 mt-4 shrink-0 text-red-500" onClick={() => removeItem(idx)}>
                                                        <Trash2 className="size-3" />
                                                    </Button>
                                                </div>

                                                {/* Children */}
                                                {item.children.map((child, ci) => (
                                                    <div key={ci} className="ml-6 flex items-start gap-3 border-l pl-3">
                                                        <ChevronRight className="mt-2 size-3 shrink-0 text-muted-foreground" />
                                                        <div className="grid flex-1 gap-2 sm:grid-cols-2">
                                                            <Input value={child.label} onChange={e => updateChild(idx, ci, 'label', e.target.value)} placeholder="Submenu label" className="h-7 text-sm" />
                                                            <Input value={child.url} onChange={e => updateChild(idx, ci, 'url', e.target.value)} placeholder="/path" className="h-7 text-sm" />
                                                        </div>
                                                        <Button size="icon" variant="ghost" className="size-6 mt-0.5 text-red-400" onClick={() => removeChild(idx, ci)}>
                                                            <Trash2 className="size-3" />
                                                        </Button>
                                                    </div>
                                                ))}

                                                <Button variant="ghost" size="sm" className="ml-6 h-6 text-xs" onClick={() => addChild(idx)}>
                                                    <Plus className="mr-1 size-3" />Add Submenu
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))}

                                    {items.length === 0 && (
                                        <Card>
                                            <CardContent className="py-8 text-center text-sm text-muted-foreground">
                                                No items yet. Click "Add Item" to start.
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
