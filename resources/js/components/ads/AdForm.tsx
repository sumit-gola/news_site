import { useForm } from '@inertiajs/react';
import { AlertTriangle, Film, ImageIcon, Code2, MonitorSmartphone } from 'lucide-react';
import { useMemo, useState } from 'react';
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

type EventItem = {
    id: number;
    event_type: string;
    meta: Record<string, unknown> | null;
    created_at: string;
};

type FallbackOption = {
    id: number;
    title: string;
};

type Props = {
    mode: 'create' | 'edit';
    action: string;
    advertisers: AdvertiserClient[];
    categories: AdCategoryOption[];
    slots: AdSlotItem[];
    fallbackAds?: FallbackOption[];
    events?: EventItem[];
    initial?: Partial<AdFormData>;
};

const pageOptions: Array<{ label: string; value: AdPage }> = [
    { label: 'Home', value: 'home' },
    { label: 'Article', value: 'article' },
    { label: 'Category', value: 'category' },
    { label: 'Search', value: 'search' },
];

const deviceOptions: Array<'desktop' | 'tablet' | 'mobile'> = ['desktop', 'tablet', 'mobile'];
const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function splitCsv(value: string): string[] {
    return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}

export default function AdForm({ mode, action, advertisers, categories, slots, fallbackAds = [], events = [], initial }: Props) {
    const [creativeMode, setCreativeMode] = useState<'image' | 'html' | 'script' | 'video'>(
        initial?.video_embed_url ? 'video' : (initial?.ad_type ?? 'image'),
    );

    const form = useForm<AdFormData>({
        advertiser_id: initial?.advertiser_id ?? null,
        ad_slot_id: initial?.ad_slot_id ?? null,
        fallback_ad_id: initial?.fallback_ad_id ?? null,
        title: initial?.title ?? '',
        ad_type: initial?.ad_type ?? 'image',
        image_path: initial?.image_path ?? '',
        image_file: null,
        video_embed_url: initial?.video_embed_url ?? '',
        html_code: initial?.html_code ?? '',
        script_code: initial?.script_code ?? '',
        target_url: initial?.target_url ?? '',
        open_in_new_tab: initial?.open_in_new_tab ?? false,
        width: initial?.width ?? null,
        height: initial?.height ?? null,
        position: initial?.position ?? 'sidebar',
        pages: initial?.pages ?? ['home'],
        category_ids: initial?.category_ids ?? [],
        device_targets: initial?.device_targets ?? ['desktop', 'tablet', 'mobile'],
        geo_countries: initial?.geo_countries ?? [],
        language_locales: initial?.language_locales ?? [],
        audience_tags: initial?.audience_tags ?? [],
        utm_source: initial?.utm_source ?? '',
        utm_medium: initial?.utm_medium ?? '',
        utm_campaign: initial?.utm_campaign ?? '',
        utm_term: initial?.utm_term ?? '',
        utm_content: initial?.utm_content ?? '',
        start_date: initial?.start_date ?? '',
        end_date: initial?.end_date ?? '',
        recurrence_type: initial?.recurrence_type ?? 'always',
        recurrence_days: initial?.recurrence_days ?? [],
        frequency_cap_type: initial?.frequency_cap_type ?? 'none',
        frequency_cap_value: initial?.frequency_cap_value ?? null,
        priority: initial?.priority ?? 1,
        workflow_status: initial?.workflow_status ?? 'draft',
        reviewer_notes: initial?.reviewer_notes ?? '',
        internal_comments: initial?.internal_comments ?? '',
        is_pinned: initial?.is_pinned ?? false,
        is_house_ad: initial?.is_house_ad ?? false,
        is_fallback: initial?.is_fallback ?? false,
        supported_sizes: initial?.supported_sizes ?? [],
        variant_enabled: initial?.variant_enabled ?? false,
        variant_split: initial?.variant_split ?? 50,
        winner_metric: initial?.winner_metric ?? 'ctr',
        rotation_type: initial?.rotation_type ?? 'random',
        status: initial?.status ?? 'active',
    });

    const selectedAdvertiser = useMemo(
        () => advertisers.find((item) => item.id === form.data.advertiser_id),
        [advertisers, form.data.advertiser_id],
    );

    const targetingScore = useMemo(() => {
        let score = 0;

        if (form.data.pages.length > 0) {
            score += 20;
        }

        if (form.data.category_ids.length > 0) {
            score += 15;
        }

        if (form.data.device_targets.length < 3) {
            score += 15;
        }

        if (form.data.geo_countries.length > 0) {
            score += 20;
        }

        if (form.data.language_locales.length > 0) {
            score += 10;
        }

        if (form.data.audience_tags.length > 0) {
            score += 20;
        }

        return score;
    }, [form.data]);

    const submit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const basePayload = (data: AdFormData) => ({
            ...data,
            ad_type: creativeMode === 'video' ? 'html' : data.ad_type,
            width: data.width || null,
            height: data.height || null,
            image_file: data.image_file,
            geo_countries: data.geo_countries.map((item) => item.toUpperCase()),
            language_locales: data.language_locales.map((item) => item.toLowerCase()),
        });

        if (mode === 'create') {
            form.transform(basePayload);
            form.post(action, { forceFormData: true });

            return;
        }

        form.transform((data) => ({ ...basePayload(data), _method: 'put' }));
        form.post(action, { forceFormData: true });
    };

    const togglePage = (page: AdPage) => {
        if (form.data.pages.includes(page)) {
            form.setData('pages', form.data.pages.filter((p) => p !== page));

            return;
        }

        form.setData('pages', [...form.data.pages, page]);
    };

    const toggleDevice = (device: 'desktop' | 'tablet' | 'mobile') => {
        if (form.data.device_targets.includes(device)) {
            form.setData('device_targets', form.data.device_targets.filter((item) => item !== device));

            return;
        }

        form.setData('device_targets', [...form.data.device_targets, device]);
    };

    const toggleRecurrenceDay = (day: number) => {
        if (form.data.recurrence_days.includes(day)) {
            form.setData('recurrence_days', form.data.recurrence_days.filter((item) => item !== day));

            return;
        }

        form.setData('recurrence_days', [...form.data.recurrence_days, day]);
    };

    const statusWarning = !form.data.target_url && form.data.ad_type !== 'script';
    const sizeWarning = !form.data.width || !form.data.height;

    return (
        <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-3">
                <div className="space-y-4 lg:col-span-2">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Core Setup</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-3 md:grid-cols-2">
                            <div className="space-y-1.5 md:col-span-2">
                                <Label htmlFor="title">Title</Label>
                                <Input id="title" value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} />
                                {form.errors.title && <p className="text-xs text-destructive">{form.errors.title}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label>Client</Label>
                                <Select
                                    value={form.data.advertiser_id ? String(form.data.advertiser_id) : 'none'}
                                    onValueChange={(v) => form.setData('advertiser_id', v === 'none' ? null : Number(v))}
                                >
                                    <SelectTrigger><SelectValue placeholder="Select advertiser" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No linked client</SelectItem>
                                        {advertisers.map((advertiser) => (
                                            <SelectItem key={advertiser.id} value={String(advertiser.id)}>{advertiser.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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

                            <div className="space-y-1.5 md:col-span-2">
                                <Label>Fallback Ad</Label>
                                <Select value={form.data.fallback_ad_id ? String(form.data.fallback_ad_id) : 'none'} onValueChange={(v) => form.setData('fallback_ad_id', v === 'none' ? null : Number(v))}>
                                    <SelectTrigger><SelectValue placeholder="Optional fallback" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No fallback ad</SelectItem>
                                        {fallbackAds.map((item) => (
                                            <SelectItem key={item.id} value={String(item.id)}>{item.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5 md:col-span-2">
                                <Label htmlFor="target_url">Target URL</Label>
                                <Input id="target_url" value={form.data.target_url} onChange={(e) => form.setData('target_url', e.target.value)} placeholder="https://example.com/campaign" />
                            </div>

                            <div className="flex flex-wrap items-center gap-5 md:col-span-2">
                                <label className="flex items-center gap-2 text-sm"><Switch checked={form.data.open_in_new_tab} onCheckedChange={(v) => form.setData('open_in_new_tab', v)} />Open in new tab</label>
                                <label className="flex items-center gap-2 text-sm"><Switch checked={form.data.is_house_ad} onCheckedChange={(v) => form.setData('is_house_ad', v)} />House ad</label>
                                <label className="flex items-center gap-2 text-sm"><Switch checked={form.data.is_pinned} onCheckedChange={(v) => form.setData('is_pinned', v)} />Pin ad</label>
                                <label className="flex items-center gap-2 text-sm"><Switch checked={form.data.is_fallback} onCheckedChange={(v) => form.setData('is_fallback', v)} />Use as fallback</label>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Creative & Preview</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Tabs defaultValue={creativeMode} value={creativeMode} onValueChange={(v) => {
                                const next = v as 'image' | 'html' | 'script' | 'video';

                                setCreativeMode(next);

                                if (next !== 'video') {
                                    form.setData('ad_type', next);
                                }
                            }}>
                                <TabsList className="grid w-full grid-cols-4">
                                    <TabsTrigger value="image" className="gap-1"><ImageIcon className="size-3.5" />Image</TabsTrigger>
                                    <TabsTrigger value="html" className="gap-1"><Code2 className="size-3.5" />HTML</TabsTrigger>
                                    <TabsTrigger value="script" className="gap-1"><Code2 className="size-3.5" />Script</TabsTrigger>
                                    <TabsTrigger value="video" className="gap-1"><Film className="size-3.5" />Video</TabsTrigger>
                                </TabsList>

                                <TabsContent value="image" className="space-y-2 pt-3">
                                    <Label htmlFor="image_file">Upload Image</Label>
                                    <Input id="image_file" type="file" accept="image/*" onChange={(e) => form.setData('image_file', e.target.files?.[0] ?? null)} />
                                    {form.data.image_path && (
                                        <img src={form.data.image_path.startsWith('http') ? form.data.image_path : `/storage/${form.data.image_path}`} alt="Preview" className="h-28 rounded-md border object-cover" />
                                    )}
                                </TabsContent>

                                <TabsContent value="html" className="space-y-2 pt-3">
                                    <Label htmlFor="html_code">HTML Code</Label>
                                    <Textarea id="html_code" rows={6} value={form.data.html_code} onChange={(e) => form.setData('html_code', e.target.value)} />
                                </TabsContent>

                                <TabsContent value="script" className="space-y-2 pt-3">
                                    <p className="rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200">Script creatives can execute third-party code. Use only trusted sources.</p>
                                    <Label htmlFor="script_code">Script Code</Label>
                                    <Textarea id="script_code" rows={6} value={form.data.script_code} onChange={(e) => form.setData('script_code', e.target.value)} />
                                </TabsContent>

                                <TabsContent value="video" className="space-y-2 pt-3">
                                    <Label htmlFor="video_embed_url">Video Embed URL</Label>
                                    <Input id="video_embed_url" value={form.data.video_embed_url} onChange={(e) => form.setData('video_embed_url', e.target.value)} placeholder="https://www.youtube.com/embed/..." />
                                </TabsContent>
                            </Tabs>

                            <div className="grid gap-3 md:grid-cols-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="width">Width</Label>
                                    <Input id="width" type="number" value={form.data.width ?? ''} onChange={(e) => form.setData('width', e.target.value ? Number(e.target.value) : null)} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="height">Height</Label>
                                    <Input id="height" type="number" value={form.data.height ?? ''} onChange={(e) => form.setData('height', e.target.value ? Number(e.target.value) : null)} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="sizes">Multi Sizes (CSV)</Label>
                                    <Input
                                        id="sizes"
                                        value={form.data.supported_sizes.join(', ')}
                                        onChange={(e) => form.setData('supported_sizes', splitCsv(e.target.value))}
                                        placeholder="300x250, 728x90"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Position</Label>
                                    <PositionSelector value={form.data.position} onChange={(v) => form.setData('position', v)} />
                                </div>
                            </div>

                            <div className="grid gap-2 rounded-lg border p-3 md:grid-cols-3">
                                <div className="rounded border p-2 text-center text-xs">Desktop Preview</div>
                                <div className="rounded border p-2 text-center text-xs">Tablet Preview</div>
                                <div className="rounded border p-2 text-center text-xs">Mobile Preview</div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Targeting & UTM</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Page Selection</Label>
                                <div className="flex flex-wrap gap-2">
                                    {pageOptions.map((page) => {
                                        const active = form.data.pages.includes(page.value);

                                        return (
                                            <Button key={page.value} type="button" size="sm" variant={active ? 'default' : 'outline'} onClick={() => togglePage(page.value)}>
                                                {page.label}
                                            </Button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Device Targets</Label>
                                <div className="flex gap-2">
                                    {deviceOptions.map((device) => {
                                        const active = form.data.device_targets.includes(device);

                                        return (
                                            <Button key={device} type="button" size="sm" variant={active ? 'default' : 'outline'} onClick={() => toggleDevice(device)}>
                                                <MonitorSmartphone className="mr-1 size-3" />{device}
                                            </Button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="grid gap-3 md:grid-cols-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="geo">Country Codes (CSV)</Label>
                                    <Input id="geo" value={form.data.geo_countries.join(', ')} onChange={(e) => form.setData('geo_countries', splitCsv(e.target.value))} placeholder="IN, US" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="locale">Locales (CSV)</Label>
                                    <Input id="locale" value={form.data.language_locales.join(', ')} onChange={(e) => form.setData('language_locales', splitCsv(e.target.value))} placeholder="en, hi" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="audience">Audience Tags (CSV)</Label>
                                    <Input id="audience" value={form.data.audience_tags.join(', ')} onChange={(e) => form.setData('audience_tags', splitCsv(e.target.value))} placeholder="sports-fans, premium" />
                                </div>
                            </div>

                            <MultiSelect label="Category Targeting" options={categories} values={form.data.category_ids} onChange={(value) => form.setData('category_ids', value)} />

                            <div className="grid gap-3 md:grid-cols-5">
                                <Input value={form.data.utm_source} onChange={(e) => form.setData('utm_source', e.target.value)} placeholder="utm_source" />
                                <Input value={form.data.utm_medium} onChange={(e) => form.setData('utm_medium', e.target.value)} placeholder="utm_medium" />
                                <Input value={form.data.utm_campaign} onChange={(e) => form.setData('utm_campaign', e.target.value)} placeholder="utm_campaign" />
                                <Input value={form.data.utm_term} onChange={(e) => form.setData('utm_term', e.target.value)} placeholder="utm_term" />
                                <Input value={form.data.utm_content} onChange={(e) => form.setData('utm_content', e.target.value)} placeholder="utm_content" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Scheduling, Workflow, Variants</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <DateRangePicker
                                startDate={form.data.start_date}
                                endDate={form.data.end_date}
                                onStartDateChange={(value) => form.setData('start_date', value)}
                                onEndDateChange={(value) => form.setData('end_date', value)}
                            />

                            <div className="grid gap-3 md:grid-cols-4">
                                <div className="space-y-1.5">
                                    <Label>Recurrence</Label>
                                    <Select value={form.data.recurrence_type} onValueChange={(v) => form.setData('recurrence_type', v as AdFormData['recurrence_type'])}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="always">Always</SelectItem>
                                            <SelectItem value="weekdays">Weekdays</SelectItem>
                                            <SelectItem value="weekends">Weekends</SelectItem>
                                            <SelectItem value="custom">Custom</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Frequency Cap Type</Label>
                                    <Select value={form.data.frequency_cap_type} onValueChange={(v) => form.setData('frequency_cap_type', v as AdFormData['frequency_cap_type'])}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            <SelectItem value="session">Per Session</SelectItem>
                                            <SelectItem value="day">Per Day</SelectItem>
                                            <SelectItem value="user">Per User</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Cap Value</Label>
                                    <Input type="number" value={form.data.frequency_cap_value ?? ''} onChange={(e) => form.setData('frequency_cap_value', e.target.value ? Number(e.target.value) : null)} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Workflow</Label>
                                    <Select value={form.data.workflow_status} onValueChange={(v) => form.setData('workflow_status', v as AdFormData['workflow_status'])}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="pending_review">Pending Review</SelectItem>
                                            <SelectItem value="approved">Approved</SelectItem>
                                            <SelectItem value="rejected">Rejected</SelectItem>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="paused">Paused</SelectItem>
                                            <SelectItem value="archived">Archived</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {form.data.recurrence_type === 'custom' && (
                                <div className="flex flex-wrap gap-2">
                                    {weekdays.map((day, idx) => {
                                        const active = form.data.recurrence_days.includes(idx);

                                        return (
                                            <Button key={day} type="button" size="sm" variant={active ? 'default' : 'outline'} onClick={() => toggleRecurrenceDay(idx)}>
                                                {day}
                                            </Button>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="grid gap-3 md:grid-cols-3">
                                <div className="space-y-1.5">
                                    <Label>Priority</Label>
                                    <Input type="number" min={1} max={999} value={form.data.priority} onChange={(e) => form.setData('priority', Number(e.target.value || 1))} />
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
                                <div className="space-y-1.5">
                                    <Label>Status</Label>
                                    <Select value={form.data.status} onValueChange={(v) => form.setData('status', v as AdFormData['status'])}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="paused">Paused</SelectItem>
                                            <SelectItem value="expired">Expired</SelectItem>
                                            <SelectItem value="archived">Archived</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="rounded-md border p-3">
                                <div className="mb-2 flex items-center gap-2">
                                    <Switch checked={form.data.variant_enabled} onCheckedChange={(v) => form.setData('variant_enabled', v)} />
                                    <span className="text-sm font-medium">Enable A/B Variant</span>
                                </div>
                                {form.data.variant_enabled && (
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <div className="space-y-1.5">
                                            <Label>Variant Split (%)</Label>
                                            <Input type="number" min={1} max={99} value={form.data.variant_split} onChange={(e) => form.setData('variant_split', Number(e.target.value || 50))} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label>Winner Metric</Label>
                                            <Select value={form.data.winner_metric} onValueChange={(v) => form.setData('winner_metric', v as AdFormData['winner_metric'])}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ctr">CTR</SelectItem>
                                                    <SelectItem value="clicks">Clicks</SelectItem>
                                                    <SelectItem value="impressions">Impressions</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <Textarea rows={3} value={form.data.reviewer_notes} onChange={(e) => form.setData('reviewer_notes', e.target.value)} placeholder="Reviewer notes" />
                            <Textarea rows={3} value={form.data.internal_comments} onChange={(e) => form.setData('internal_comments', e.target.value)} placeholder="Internal comments" />
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-4">
                    <Card className="sticky top-20">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Quality Checks</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            {statusWarning && (
                                <div className="flex gap-2 rounded-md border border-amber-300 bg-amber-50 p-2 text-amber-800 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200">
                                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                                    Missing target URL may reduce click-through tracking.
                                </div>
                            )}
                            {sizeWarning && (
                                <div className="flex gap-2 rounded-md border border-amber-300 bg-amber-50 p-2 text-amber-800 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200">
                                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                                    Width/height not set. Size mismatch may occur in fixed slots.
                                </div>
                            )}

                            <div className="rounded-md border p-3">
                                <p className="text-xs text-muted-foreground">Targeting Completeness</p>
                                <p className="text-lg font-semibold">{targetingScore}%</p>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    {form.data.pages.map((page) => <Badge key={page} variant="secondary" className="capitalize">{page}</Badge>)}
                                    {form.data.device_targets.map((device) => <Badge key={device} variant="outline" className="capitalize">{device}</Badge>)}
                                </div>
                            </div>

                            {selectedAdvertiser && (
                                <div className="rounded-md border p-3 text-xs">
                                    <p className="font-medium">Advertiser Contact</p>
                                    <p>{selectedAdvertiser.email ?? 'No email'}</p>
                                    <p>{selectedAdvertiser.phone ?? 'No phone'}</p>
                                </div>
                            )}

                            {events.length > 0 && (
                                <div className="rounded-md border p-3">
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Audit Trail</p>
                                    <div className="space-y-2">
                                        {events.map((event) => (
                                            <div key={event.id} className="rounded border p-2 text-xs">
                                                <p className="font-medium">{event.event_type.replaceAll('_', ' ')}</p>
                                                <p className="text-muted-foreground">{new Date(event.created_at).toLocaleString()}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-2 pt-1">
                                <Button type="button" variant="outline" onClick={() => window.history.back()}>Cancel</Button>
                                <Button type="submit" disabled={form.processing}>{mode === 'create' ? 'Save Ad' : 'Update Ad'}</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </form>
    );
}
