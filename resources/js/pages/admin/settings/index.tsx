import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type SettingsGroup = Record<string, string>;
type AllSettings = Record<string, SettingsGroup>;

const TABS = [
    { key: 'general', label: 'General' },
    { key: 'seo',     label: 'SEO' },
    { key: 'social',  label: 'Social' },
    { key: 'email',   label: 'Email' },
];

export default function SettingsIndex({ settings }: { settings: AllSettings }) {
    const [activeTab, setActiveTab] = useState('general');

    return (
        <AppLayout breadcrumbs={[{ title: 'Admin', href: '/admin/dashboard' }, { title: 'Settings', href: '/admin/settings' }]}>
            <Head title="Settings" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <h1 className="text-2xl font-bold">Site Settings</h1>

                {/* Tabs */}
                <div className="flex gap-1 border-b">
                    {TABS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab.key ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'general' && <GeneralSettings settings={settings.general ?? {}} />}
                {activeTab === 'seo'     && <SeoSettings settings={settings.seo ?? {}} />}
                {activeTab === 'social'  && <SocialSettings settings={settings.social ?? {}} />}
                {activeTab === 'email'   && <EmailSettings settings={settings.email ?? {}} />}
            </div>
        </AppLayout>
    );
}

function SettingsForm({ group, children, settings }: { group: string; children: React.ReactNode; settings: SettingsGroup }) {
    const form = useForm({ group, settings });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        form.post('/admin/settings');
    }

    return (
        <form onSubmit={handleSubmit}>
            {children}
            <div className="mt-4">
                <Button type="submit" disabled={form.processing}>Save {group.charAt(0).toUpperCase() + group.slice(1)} Settings</Button>
            </div>
        </form>
    );
}

function GeneralSettings({ settings }: { settings: SettingsGroup }) {
    const form = useForm({ group: 'general', settings: { ...settings } });
    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        form.post('/admin/settings');
    }
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Card>
                <CardHeader><CardTitle className="text-base">General</CardTitle><CardDescription>Basic site identity</CardDescription></CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                    <Field label="Site Name" value={form.data.settings.site_name ?? ''} onChange={v => form.setData('settings', { ...form.data.settings, site_name: v })} />
                    <Field label="Site Tagline" value={form.data.settings.site_tagline ?? ''} onChange={v => form.setData('settings', { ...form.data.settings, site_tagline: v })} />
                    <Field label="Admin Email" value={form.data.settings.admin_email ?? ''} onChange={v => form.setData('settings', { ...form.data.settings, admin_email: v })} />
                    <Field label="Footer Text" value={form.data.settings.footer_text ?? ''} onChange={v => form.setData('settings', { ...form.data.settings, footer_text: v })} />
                    <div className="sm:col-span-2">
                        <Label>Site Description</Label>
                        <Textarea value={form.data.settings.site_description ?? ''} onChange={e => form.setData('settings', { ...form.data.settings, site_description: e.target.value })} rows={3} className="mt-1" />
                    </div>
                </CardContent>
            </Card>
            <Button type="submit" disabled={form.processing}>Save General Settings</Button>
        </form>
    );
}

function SeoSettings({ settings }: { settings: SettingsGroup }) {
    const form = useForm({ group: 'seo', settings: { ...settings } });
    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        form.post('/admin/settings');
    }
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Card>
                <CardHeader><CardTitle className="text-base">SEO</CardTitle><CardDescription>Meta tags and analytics</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                    <Field label="Default Meta Title (max 70)" value={form.data.settings.meta_title ?? ''} onChange={v => form.setData('settings', { ...form.data.settings, meta_title: v })} />
                    <div>
                        <Label>Default Meta Description (max 160)</Label>
                        <Textarea value={form.data.settings.meta_description ?? ''} onChange={e => form.setData('settings', { ...form.data.settings, meta_description: e.target.value })} rows={3} className="mt-1" maxLength={160} />
                    </div>
                    <Field label="Default Meta Keywords" value={form.data.settings.meta_keywords ?? ''} onChange={v => form.setData('settings', { ...form.data.settings, meta_keywords: v })} />
                    <Field label="Google Analytics ID (G-XXXXXXXX)" value={form.data.settings.google_analytics ?? ''} onChange={v => form.setData('settings', { ...form.data.settings, google_analytics: v })} />
                </CardContent>
            </Card>
            <Button type="submit" disabled={form.processing}>Save SEO Settings</Button>
        </form>
    );
}

function SocialSettings({ settings }: { settings: SettingsGroup }) {
    const form = useForm({ group: 'social', settings: { ...settings } });
    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        form.post('/admin/settings');
    }
    const socials = ['facebook', 'twitter', 'instagram', 'youtube', 'linkedin'];
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Card>
                <CardHeader><CardTitle className="text-base">Social Media</CardTitle><CardDescription>Your social media profile URLs</CardDescription></CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                    {socials.map(s => (
                        <Field key={s} label={s.charAt(0).toUpperCase() + s.slice(1)} value={form.data.settings[s] ?? ''} onChange={v => form.setData('settings', { ...form.data.settings, [s]: v })} placeholder={`https://...`} />
                    ))}
                </CardContent>
            </Card>
            <Button type="submit" disabled={form.processing}>Save Social Settings</Button>
        </form>
    );
}

function EmailSettings({ settings }: { settings: SettingsGroup }) {
    const form = useForm({ group: 'email', settings: { ...settings } });
    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        form.post('/admin/settings');
    }
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Card>
                <CardHeader><CardTitle className="text-base">Email</CardTitle><CardDescription>From address for system emails</CardDescription></CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                    <Field label="From Name" value={form.data.settings.from_name ?? ''} onChange={v => form.setData('settings', { ...form.data.settings, from_name: v })} />
                    <Field label="From Address" value={form.data.settings.from_address ?? ''} onChange={v => form.setData('settings', { ...form.data.settings, from_address: v })} />
                </CardContent>
            </Card>
            <Button type="submit" disabled={form.processing}>Save Email Settings</Button>
        </form>
    );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
    return (
        <div className="space-y-1">
            <Label>{label}</Label>
            <Input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
        </div>
    );
}
