import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { AdCategoryOption, AdSlotItem, AdvertiserClient, BreadcrumbItem } from '@/types';
import AdForm from '../../../components/ads/AdForm';

type Props = {
    advertisers: AdvertiserClient[];
    categories: AdCategoryOption[];
    slots: AdSlotItem[];
    fallbackAds: Array<{ id: number; title: string }>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Advertisements', href: '/admin/advertisements' },
    { title: 'Add New Ad', href: '/admin/advertisements/create' },
];

export default function CreateAdvertisement({ advertisers, categories, slots, fallbackAds }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Advertisement" />
            <div className="p-6">
                <AdForm
                    mode="create"
                    action="/admin/advertisements"
                    advertisers={advertisers}
                    categories={categories}
                    slots={slots}
                    fallbackAds={fallbackAds}
                />
            </div>
        </AppLayout>
    );
}
