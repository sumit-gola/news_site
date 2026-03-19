import { Head } from '@inertiajs/react';
import { FolderOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/reporter/dashboard' },
];

interface Props {
    stats: {
        total_categories: number;
    };
}

export default function ReporterDashboard({ stats }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reporter Dashboard" />
            <div className="flex flex-1 flex-col gap-6 p-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Reporter Dashboard</h1>
                    <p className="text-muted-foreground text-sm">
                        Browse available categories.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Categories Available</CardTitle>
                            <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/30">
                                <FolderOpen className="size-4 text-green-600 dark:text-green-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_categories}</div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
