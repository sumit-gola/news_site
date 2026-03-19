import { Head, router, usePage } from '@inertiajs/react';
import * as React from 'react';
import { Plus, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { Article, BreadcrumbItem, Category, Paginated } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Dashboard', href: '/reporter/dashboard' },
  { title: 'Articles', href: '/articles' },
];

export default function ArticlesIndex({ articles, categories, filters, statuses }: { articles: Paginated<Article>; categories: Category[]; filters: any; statuses: string[] }) {
  const { props } = usePage();

  const updateFilter = (key: string, value: string) => {
    router.get('/articles', { ...filters, [key]: value }, { preserveState: true, replace: true });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Articles" />
      <div className="grid gap-6 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Articles</h1>
            <p className="text-muted-foreground">Manage your articles and publishing workflow.</p>
          </div>
          <Button onClick={() => router.visit('/articles/create')}>
            <Plus className="mr-2 h-4 w-4" />
            New Article
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Input
            placeholder="Search articles..."
            value={filters.search || ''}
            onChange={(e) => updateFilter('search', e.target.value)}
          />

          <Select
            value={filters.status || ''}
            onValueChange={(value) => updateFilter('status', value)}
          >
            <option value="">All statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </Select>

          <Select
            value={filters.category_id || ''}
            onValueChange={(value) => updateFilter('category_id', value)}
          >
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Categories</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Published</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {articles.data.map((article) => (
              <TableRow key={article.id}>
                <TableCell>
                  <a className="font-medium text-primary" href={`/articles/${article.id}`}> {article.title}</a>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{article.status}</Badge>
                </TableCell>
                <TableCell>
                  {article.categories?.map((cat) => (
                    <Badge key={cat.id} className="mr-1">{cat.name}</Badge>
                  ))}
                </TableCell>
                <TableCell>{article.author?.name}</TableCell>
                <TableCell>{article.published_at ? new Date(article.published_at).toLocaleDateString() : '-'}</TableCell>
                <TableCell>
                  <Button size="sm" variant="secondary" onClick={() => router.visit(`/articles/${article.id}/edit`)}>
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AppLayout>
  );
}
