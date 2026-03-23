import { Head } from '@inertiajs/react';
import PublicLayout from '@/layouts/public-layout';
import type { Category } from '@/types';

type StaticPageData = {
    slug: string;
    title: string;
    description: string;
    content: string[];
};

type Props = {
    page: StaticPageData;
    navCategories: Category[];
};

export default function StaticPage({ page, navCategories }: Props) {
    return (
        <PublicLayout navCategories={navCategories}>
            <Head title={page.title}>
                <meta name="description" content={page.description} />
            </Head>

            <div className="mx-auto max-w-4xl px-4 py-10">
                <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    <p className="text-xs font-black uppercase tracking-widest text-red-600">Information</p>
                    <h1 className="mt-2 text-3xl font-black tracking-tight">{page.title}</h1>
                    <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{page.description}</p>

                    <div className="mt-6 space-y-4 text-gray-700 dark:text-gray-300">
                        {page.content.map((paragraph) => (
                            <p key={paragraph}>{paragraph}</p>
                        ))}
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
