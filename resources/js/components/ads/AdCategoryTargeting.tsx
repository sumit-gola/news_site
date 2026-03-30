import { Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { AdCategoryOption } from '@/types';

type Props = {
    categories: AdCategoryOption[];
    selected: number[];
    onChange: (ids: number[]) => void;
};

export default function AdCategoryTargeting({ categories, selected, onChange }: Props) {
    const [search, setSearch] = useState('');
    const allSelected = selected.length === categories.length && categories.length > 0;

    const filtered = useMemo(() => {
        if (!search.trim()) return categories;
        const q = search.toLowerCase();
        return categories.filter((c) => c.name.toLowerCase().includes(q));
    }, [categories, search]);

    const toggleAll = (checked: boolean) => {
        onChange(checked ? categories.map((c) => c.id) : []);
    };

    const toggleCategory = (id: number) => {
        if (selected.includes(id)) {
            onChange(selected.filter((s) => s !== id));
        } else {
            onChange([...selected, id]);
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Label>Category Targeting</Label>
                <label className="flex items-center gap-2 text-sm">
                    <Switch checked={allSelected} onCheckedChange={toggleAll} />
                    All Categories
                </label>
            </div>

            {selected.length > 0 && !allSelected && (
                <div className="flex flex-wrap gap-1">
                    {selected.map((id) => {
                        const cat = categories.find((c) => c.id === id);
                        if (!cat) return null;
                        return (
                            <Badge key={id} variant="secondary" className="gap-1">
                                {cat.name}
                                <button
                                    type="button"
                                    onClick={() => toggleCategory(id)}
                                    className="hover:text-destructive"
                                >
                                    <X className="size-3" />
                                </button>
                            </Badge>
                        );
                    })}
                </div>
            )}

            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search categories..."
                    className="pl-9"
                />
            </div>

            <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border p-2">
                {filtered.length === 0 && (
                    <p className="py-2 text-center text-xs text-muted-foreground">No categories found</p>
                )}
                {filtered.map((cat) => (
                    <label
                        key={cat.id}
                        className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent"
                    >
                        <Checkbox
                            checked={selected.includes(cat.id)}
                            onCheckedChange={() => toggleCategory(cat.id)}
                        />
                        {cat.name}
                    </label>
                ))}
            </div>

            <p className="text-xs text-muted-foreground">
                {selected.length === 0
                    ? 'No categories selected — ad shows on all categories'
                    : `${selected.length} categor${selected.length === 1 ? 'y' : 'ies'} selected`}
            </p>
        </div>
    );
}
