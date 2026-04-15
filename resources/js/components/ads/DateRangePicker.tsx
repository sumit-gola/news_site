import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
    startDate: string;
    endDate: string;
    onStartDateChange: (value: string) => void;
    onEndDateChange: (value: string) => void;
};

export default function DateRangePicker({
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
}: Props) {
    return (
        <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                    id="start_date"
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => onStartDateChange(e.target.value)}
                />
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                    id="end_date"
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => onEndDateChange(e.target.value)}
                />
            </div>
        </div>
    );
}
