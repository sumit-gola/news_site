import { Head } from '@inertiajs/react';
import { BarChart3, FolderOpen, ToggleLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/manager/dashboard' },
];

interface Props {
    stats: {
        total_categories: number;
        active_categories: number;
    };
}

export default function ManagerDashboard({ stats }: Props) {
    const statCards = [
        {
            title: 'Total Categories',
            value: stats.total_categories,
            icon: FolderOpen,
            color: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        },
        {
            title: 'Active Categories',
            value: stats.active_categories,
            icon: ToggleLeft,
            color: 'text-green-600 dark:text-green-400',
            bgColor: 'bg-green-100 dark:bg-green-900/30',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manager Dashboard" />
            <div className="flex flex-1 flex-col gap-6 p-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Manager Dashboard</h1>
                    <p className="text-muted-foreground text-sm">
                        Manage categories and oversee content.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {statCards.map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <Card key={stat.title}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                                    <div className={`${stat.bgColor} rounded-lg p-2`}>
                                        <Icon className={`size-4 ${stat.color}`} />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stat.value}</div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="size-5" />
                            Quick Actions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground text-sm">
                            Use the sidebar to access category management.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
