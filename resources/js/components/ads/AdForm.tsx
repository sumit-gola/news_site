import { useForm } from '@inertiajs/react';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import type {
    AdCategoryOption,
    AdFormData,
    AdPage,
    AdSlotItem,
    AdvertiserClient,
} from '@/types';
import DateRangePicker from './DateRangePicker';
import MultiSelect from './MultiSelect';
import PositionSelector from './PositionSelector';

type Props = {
    mode: 'create' | 'edit';
    action: string;
    advertisers: AdvertiserClient[];
    categories: AdCategoryOption[];
    slots: AdSlotItem[];
    initial?: Partial<AdFormData>;
};

const pageOptions: Array<{ label: string; value: AdPage }> = [
    { label: 'Home', value: 'home' },
    { label: 'Article Page', value: 'article' },
    { label: 'Category Page', value: 'category' },
    { label: 'Search Page', value: 'search' },
];

export default function AdForm({ mode, action, advertisers, categories, slots, initial }: Props) {
    const form = useForm<AdFormData>({
        advertiser_id: initial?.advertiser_id ?? null,
        ad_slot_id: initial?.ad_slot_id ?? null,
        title: initial?.title ?? '',
        ad_type: initial?.ad_type ?? 'image',
        image_path: initial?.image_path ?? '',
        image_file: null,
        html_code: initial?.html_code ?? '',
        script_code: initial?.script_code ?? '',
        target_url: initial?.target_url ?? '',
        open_in_new_tab: initial?.open_in_new_tab ?? false,
        width: initial?.width ?? null,
        height: initial?.height ?? null,
        position: initial?.position ?? 'sidebar',
        pages: initial?.pages ?? ['home'],
        category_ids: initial?.category_ids ?? [],
        start_date: initial?.start_date ?? '',
        end_date: initial?.end_date ?? '',
        priority: initial?.priority ?? 1,
        rotation_type: initial?.rotation_type ?? 'random',
        status: initial?.status ?? 'active',
    });

    const selectedAdvertiser = useMemo(
        () => advertisers.find((item) => item.id === form.data.advertiser_id),
        [advertisers, form.data.advertiser_id],
    );

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        const basePayload = (data: AdFormData) => ({
            ...data,
            width: data.width || null,
            height: data.height || null,
            image_file: data.image_file,
        });

        if (mode === 'create') {
            form.transform(basePayload);
            form.post(action, { forceFormData: true });

            return;
        }

        form.transform((data) => ({
            ...basePayload(data),
            _method: 'put',
        }));

        form.post(action, {
            forceFormData: true,
        });
    };

    const togglePage = (page: AdPage) => {
        const exists = form.data.pages.includes(page);

        if (exists) {
            form.setData('pages', form.data.pages.filter((p) => p !== page));

            return;
        }

        form.setData('pages', [...form.data.pages, page]);
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Basic Info</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5 md:col-span-2">
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} />
                        {form.errors.title && <p className="text-xs text-destructive">{form.errors.title}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label>Client Name</Label>
                        <Select
                            value={form.data.advertiser_id ? String(form.data.advertiser_id) : 'none'}
                            onValueChange={(v) => form.setData('advertiser_id', v === 'none' ? null : Number(v))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select client" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">No linked client</SelectItem>
                                {advertisers.map((advertiser) => (
                                    <SelectItem key={advertiser.id} value={String(advertiser.id)}>{advertiser.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Client Email</Label>
                        <Input value={selectedAdvertiser?.email ?? ''} readOnly placeholder="Auto from client" />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Client Phone</Label>
                        <Input value={selectedAdvertiser?.phone ?? ''} readOnly placeholder="Auto from client" />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Advertisement Type</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue={form.data.ad_type} value={form.data.ad_type} onValueChange={(v) => form.setData('ad_type', v as AdFormData['ad_type'])}>
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="image">Image Ad</TabsTrigger>
                            <TabsTrigger value="html">HTML Ad</TabsTrigger>
                            <TabsTrigger value="script">Script Ad</TabsTrigger>
                        </TabsList>

                        <TabsContent value="image" className="space-y-3 pt-3">
                            <Label htmlFor="image_file">Upload Image</Label>
                            <Input
                                id="image_file"
                                type="file"
                                accept="image/*"
                                onChange={(e) => form.setData('image_file', e.target.files?.[0] ?? null)}
                            />
                            {form.data.image_path && (
                                <img src={form.data.image_path.startsWith('http') ? form.data.image_path : `/storage/${form.data.image_path}`} alt="Preview" className="h-28 rounded-md border" />
                            )}
                            {form.errors.image_file && <p className="text-xs text-destructive">{form.errors.image_file}</p>}
                        </TabsContent>

                        <TabsContent value="html" className="space-y-3 pt-3">
                            <Label htmlFor="html_code">HTML Code</Label>
                            <Textarea id="html_code" rows={6} value={form.data.html_code} onChange={(e) => form.setData('html_code', e.target.value)} />
                            {form.errors.html_code && <p className="text-xs text-destructive">{form.errors.html_code}</p>}
                        </TabsContent>

                        <TabsContent value="script" className="space-y-3 pt-3">
                            <Label htmlFor="script_code">Script Code</Label>
                            <Textarea id="script_code" rows={6} value={form.data.script_code} onChange={(e) => form.setData('script_code', e.target.value)} />
                            {form.errors.script_code && <p className="text-xs text-destructive">{form.errors.script_code}</p>}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Targeting</CardTitle></CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5 md:col-span-2">
                        <Label htmlFor="target_url">Target URL</Label>
                        <Input id="target_url" value={form.data.target_url} onChange={(e) => form.setData('target_url', e.target.value)} placeholder="https://example.com/landing" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Switch checked={form.data.open_in_new_tab} onCheckedChange={(v) => form.setData('open_in_new_tab', v)} />
                        <span className="text-sm">Open in new tab</span>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Size & Position</CardTitle></CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="width">Width</Label>
                        <Input id="width" type="number" value={form.data.width ?? ''} onChange={(e) => form.setData('width', e.target.value ? Number(e.target.value) : null)} />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="height">Height</Label>
                        <Input id="height" type="number" value={form.data.height ?? ''} onChange={(e) => form.setData('height', e.target.value ? Number(e.target.value) : null)} />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Position</Label>
                        <PositionSelector value={form.data.position} onChange={(v) => form.setData('position', v)} />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Ad Slot</Label>
                        <Select value={form.data.ad_slot_id ? String(form.data.ad_slot_id) : 'none'} onValueChange={(v) => form.setData('ad_slot_id', v === 'none' ? null : Number(v))}>
                            <SelectTrigger><SelectValue placeholder="Select slot" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">No slot</SelectItem>
                                {slots.map((slot) => (
                                    <SelectItem key={slot.id} value={String(slot.id)}>{slot.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <Label>Page Selection</Label>
                        <div className="flex flex-wrap gap-2">
                            {pageOptions.map((page) => {
                                const active = form.data.pages.includes(page.value);

                                return (
                                    <Button key={page.value} type="button" variant={active ? 'default' : 'outline'} onClick={() => togglePage(page.value)}>
                                        {page.label}
                                    </Button>
                                );
                            })}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {form.data.pages.map((page) => (
                                <Badge key={page} variant="secondary" className="capitalize">{page}</Badge>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Category Targeting</CardTitle></CardHeader>
                <CardContent>
                    <MultiSelect
                        label="Categories"
                        options={categories}
                        values={form.data.category_ids}
                        onChange={(value) => form.setData('category_ids', value)}
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Scheduling</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <DateRangePicker
                        startDate={form.data.start_date}
                        endDate={form.data.end_date}
                        onStartDateChange={(value) => form.setData('start_date', value)}
                        onEndDateChange={(value) => form.setData('end_date', value)}
                    />
                    <div className="flex items-center gap-2">
                        <Switch checked={form.data.status === 'active'} onCheckedChange={(v) => form.setData('status', v ? 'active' : 'inactive')} />
                        <span className="text-sm">Status: {form.data.status === 'active' ? 'Active' : 'Inactive'}</span>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Priority & Rotation</CardTitle></CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="priority">Priority</Label>
                        <Input id="priority" type="number" min={1} max={999} value={form.data.priority} onChange={(e) => form.setData('priority', Number(e.target.value))} />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Rotation Type</Label>
                        <Select value={form.data.rotation_type} onValueChange={(v) => form.setData('rotation_type', v as AdFormData['rotation_type'])}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="sequential">Sequential</SelectItem>
                                <SelectItem value="random">Random</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => window.history.back()}>Cancel</Button>
                <Button type="submit" disabled={form.processing}>{mode === 'create' ? 'Save Advertisement' : 'Update Advertisement'}</Button>
            </div>
        </form>
    );
}
