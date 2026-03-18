import { Head, usePage } from '@inertiajs/react';
import { Clock, FileText, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Link } from '@inertiajs/react';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/reporter/dashboard' },
];

export default function ReporterDashboard() {
    const stats = [
        {
            title: 'Draft Articles',
            value: 5,
            icon: FileText,
            color: 'text-gray-600 dark:text-gray-400',
            bgColor: 'bg-gray-100 dark:bg-gray-900/30'
        },
        {
            title: 'Pending Review',
            value: 3,
            icon: Clock,
            color: 'text-yellow-600 dark:text-yellow-400',
            bgColor: 'bg-yellow-100 dark:bg-yellow-900/30'
        },
        {
            title: 'Published',
            value: 18,
            icon: TrendingUp,
            color: 'text-green-600 dark:text-green-400',
            bgColor: 'bg-green-100 dark:bg-green-900/30'
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reporter Dashboard" />
            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Reporter Dashboard</h1>
                        <p className="text-muted-foreground text-sm">
                            Track your articles and publishing progress.
                        </p>
                    </div>
                    <Link href="/reporter/articles/create">
                        <Button>
                            <FileText className="mr-1.5 size-4" />
                            New Article
                        </Button>
                    </Link>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-3">
                    {stats.map((stat) => {
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
                                    <p className="text-muted-foreground text-xs">Total items</p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Performance Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                            <div className="text-center">
                                <p className="text-3xl font-bold">847</p>
                                <p className="text-muted-foreground text-xs">Total Views</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold">12</p>
                                <p className="text-muted-foreground text-xs">This Month</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold">4.2</p>
                                <p className="text-muted-foreground text-xs">Avg Rating</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold">94%</p>
                                <p className="text-muted-foreground text-xs">Approval Rate</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Articles */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Articles</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                                    <div>
                                        <p className="font-medium">Article Title {i}</p>
                                        <p className="text-muted-foreground text-sm">Created 2 days ago</p>
                                    </div>
                                    <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-900/20">Pending</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
