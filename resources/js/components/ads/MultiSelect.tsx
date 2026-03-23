import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Option = {
    id: number;
    name: string;
};

type Props = {
    label: string;
    options: Option[];
    values: number[];
    onChange: (values: number[]) => void;
};

export default function MultiSelect({ label, options, values, onChange }: Props) {
    const [search, setSearch] = useState('');

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();

        if (!term) {
            return options;
        }

        return options.filter((option) => option.name.toLowerCase().includes(term));
    }, [options, search]);

    const selected = options.filter((option) => values.includes(option.id));

    const toggle = (id: number) => {
        if (values.includes(id)) {
            onChange(values.filter((v) => v !== id));

            return;
        }

        onChange([...values, id]);
    };

    return (
        <div className="space-y-3">
            <Label>{label}</Label>
            <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search categories..."
            />
            <div className="grid max-h-44 gap-2 overflow-auto rounded-md border p-3">
                {filtered.map((option) => (
                    <label key={option.id} className="flex items-center gap-2 text-sm">
                        <Checkbox
                            checked={values.includes(option.id)}
                            onCheckedChange={() => toggle(option.id)}
                        />
                        {option.name}
                    </label>
                ))}
                {filtered.length === 0 && (
                    <p className="text-xs text-muted-foreground">No categories matched.</p>
                )}
            </div>
            {selected.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {selected.map((item) => (
                        <Badge key={item.id} variant="secondary">{item.name}</Badge>
                    ))}
                </div>
            )}
        </div>
    );
}
