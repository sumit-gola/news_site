import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AdPosition } from '@/types';

type Props = {
    value: AdPosition;
    onChange: (value: AdPosition) => void;
};

const positions: Array<{ label: string; value: AdPosition }> = [
    { label: 'Header Banner', value: 'header' },
    { label: 'Sidebar', value: 'sidebar' },
    { label: 'Inline (inside article)', value: 'inline' },
    { label: 'Footer', value: 'footer' },
    { label: 'Popup', value: 'popup' },
];

export default function PositionSelector({ value, onChange }: Props) {
    return (
        <Select value={value} onValueChange={(v) => onChange(v as AdPosition)}>
            <SelectTrigger>
                <SelectValue placeholder="Select position" />
            </SelectTrigger>
            <SelectContent>
                {positions.map((position) => (
                    <SelectItem key={position.value} value={position.value}>
                        {position.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
