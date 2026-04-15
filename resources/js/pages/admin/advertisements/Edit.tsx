import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { AdCategoryOption, AdFormData, AdSlotItem, AdvertiserClient, BreadcrumbItem } from '@/types';
import AdForm from '../../../components/ads/AdForm';

type Props = {
    advertisement: Partial<AdFormData> & { id: number };
    advertisers: AdvertiserClient[];
    categories: AdCategoryOption[];
    slots: AdSlotItem[];
    fallbackAds: Array<{ id: number; title: string }>;
    events: Array<{ id: number; event_type: string; meta: Record<string, unknown> | null; created_at: string }>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Advertisements', href: '/admin/advertisements' },
    { title: 'Edit Ad', href: '#' },
];

export default function EditAdvertisement({ advertisement, advertisers, categories, slots, fallbackAds, events }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Advertisement" />
            <div className="p-6">
                <AdForm
                    mode="edit"
                    action={`/admin/advertisements/${advertisement.id}`}
                    advertisers={advertisers}
                    categories={categories}
                    slots={slots}
                    fallbackAds={fallbackAds}
                    events={events}
                    initial={advertisement}
                />
            </div>
        </AppLayout>
    );
}
