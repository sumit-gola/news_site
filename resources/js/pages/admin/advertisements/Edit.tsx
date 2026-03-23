import { Head } from '@inertiajs/react';
import AdForm from '@/components/ads/AdForm';
import AppLayout from '@/layouts/app-layout';
import type { AdCategoryOption, AdFormData, AdSlotItem, AdvertiserClient, BreadcrumbItem } from '@/types';

type Props = {
    advertisement: Partial<AdFormData> & { id: number };
    advertisers: AdvertiserClient[];
    categories: AdCategoryOption[];
    slots: AdSlotItem[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Advertisements', href: '/admin/advertisements' },
    { title: 'Edit Ad', href: '#' },
];

export default function EditAdvertisement({ advertisement, advertisers, categories, slots }: Props) {
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
                    initial={advertisement}
                />
            </div>
        </AppLayout>
    );
}
