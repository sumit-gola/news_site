import { Head, useForm } from '@inertiajs/react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { RichTextEditor } from '@/components/rich-text-editor';
import type { Article, BreadcrumbItem, Category } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Dashboard', href: '/reporter/dashboard' },
  { title: 'Articles', href: '/articles' },
  { title: 'Edit', href: '/articles' },
];

export default function EditArticle({ article, categories }: { article: Article; categories: Category[] }) {
  const { data, setData, put, processing, errors } = useForm({
    title: article.title,
    excerpt: article.excerpt ?? '',
    content: article.content,
    featured_image: article.featured_image ?? '',
    category_ids: article.categories?.map((c) => String(c.id)) ?? [],
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    put(`/articles/${article.id}`);
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Edit Article" />
      <div className="grid gap-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Edit Article</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={data.title}
                  onChange={(e) => setData('title', e.target.value)}
                  placeholder="News headline"
                />
                {errors.title && <p className="text-destructive text-xs">{errors.title}</p>}
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={data.excerpt}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('excerpt', e.target.value)}
                  placeholder="Short summary"
                  className="h-24"
                />
                {errors.excerpt && <p className="text-destructive text-xs">{errors.excerpt}</p>}
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="content">Content</Label>
                <RichTextEditor
                  value={data.content}
                  onChange={(value) => setData('content', value)}
                  placeholder="Write your article here..."
                />
                {errors.content && <p className="text-destructive text-xs">{errors.content}</p>}
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="categories">Categories</Label>
                <select
                  id="categories"
                  multiple
                  value={data.category_ids}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setData(
                      'category_ids',
                      Array.from(e.target.selectedOptions, (option) => option.value)
                    )
                  }
                  className="border-input bg-transparent text-base rounded-md border px-3 py-2 shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={String(category.id)}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.category_ids && <p className="text-destructive text-xs">{errors.category_ids}</p>}
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={processing}>
                  Save
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
