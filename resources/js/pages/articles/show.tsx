import { Head, router } from '@inertiajs/react';
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { Article, BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Dashboard', href: '/reporter/dashboard' },
  { title: 'Articles', href: '/articles' },
  { title: 'View', href: '' },
];

export default function ShowArticle({ article }: { article: Article }) {
  const publishedDate = article.published_at ? new Date(article.published_at).toLocaleDateString() : null;

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={article.title} />

      <div className="grid gap-6 p-6">
        <Card>
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle>{article.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{article.excerpt}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>By {article.author?.name ?? 'Unknown'}</span>
                {publishedDate && <span>• Published {publishedDate}</span>}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {article.categories?.map((category) => (
                <Badge key={category.id} variant="secondary">
                  {category.name}
                </Badge>
              ))}
              <Button size="sm" onClick={() => router.visit(`/articles/${article.id}/edit`)}>
                Edit
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: article.content }} />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
