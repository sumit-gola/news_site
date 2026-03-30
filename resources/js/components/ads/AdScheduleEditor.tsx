import { X } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { ScheduleRules } from '@/types';

type Props = {
    startDate: string;
    endDate: string;
    onStartDateChange: (v: string) => void;
    onEndDateChange: (v: string) => void;
    scheduleRules: ScheduleRules;
    onScheduleRulesChange: (rules: ScheduleRules) => void;
    maxTotalImpressions: number | null;
    maxDailyImpressions: number | null;
    onMaxTotalChange: (v: number | null) => void;
    onMaxDailyChange: (v: number | null) => void;
    totalImpressions?: number;
};

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const commonTimezones = [
    'Asia/Kolkata',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Dubai',
    'Europe/London',
    'Europe/Berlin',
    'Europe/Paris',
    'America/New_York',
    'America/Chicago',
    'America/Los_Angeles',
    'Pacific/Auckland',
    'Australia/Sydney',
    'UTC',
];

export default function AdScheduleEditor({
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
    scheduleRules,
    onScheduleRulesChange,
    maxTotalImpressions,
    maxDailyImpressions,
    onMaxTotalChange,
    onMaxDailyChange,
    totalImpressions = 0,
}: Props) {
    const [blackoutInput, setBlackoutInput] = useState('');

    const updateRules = (partial: Partial<ScheduleRules>) =>
        onScheduleRulesChange({ ...scheduleRules, ...partial });

    const days = scheduleRules.days_of_week ?? [];
    const toggleDay = (day: number) => {
        const next = days.includes(day) ? days.filter((d) => d !== day) : [...days, day];
        updateRules({ days_of_week: next });
    };

    const setPresetDays = (preset: 'all' | 'weekdays' | 'weekends') => {
        const map: Record<string, number[]> = {
            all: [0, 1, 2, 3, 4, 5, 6],
            weekdays: [1, 2, 3, 4, 5],
            weekends: [0, 6],
        };
        updateRules({ days_of_week: map[preset] });
    };

    const timeSlots = scheduleRules.time_slots ?? [];
    const addTimeSlot = () => {
        updateRules({ time_slots: [...timeSlots, { start_time: '08:00', end_time: '18:00' }] });
    };
    const removeTimeSlot = (idx: number) => {
        updateRules({ time_slots: timeSlots.filter((_, i) => i !== idx) });
    };
    const updateTimeSlot = (idx: number, field: 'start_time' | 'end_time', val: string) => {
        const next = [...timeSlots];
        next[idx] = { ...next[idx], [field]: val };
        updateRules({ time_slots: next });
    };

    const blackoutDates = scheduleRules.blackout_dates ?? [];
    const addBlackout = () => {
        if (blackoutInput && !blackoutDates.includes(blackoutInput)) {
            updateRules({ blackout_dates: [...blackoutDates, blackoutInput] });
            setBlackoutInput('');
        }
    };
    const removeBlackout = (date: string) => {
        updateRules({ blackout_dates: blackoutDates.filter((d) => d !== date) });
    };

    const impressionCapPercent =
        maxTotalImpressions && maxTotalImpressions > 0
            ? Math.min(100, Math.round((totalImpressions / maxTotalImpressions) * 100))
            : 0;

    return (
        <div className="space-y-4">
            {/* Date Range */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Campaign Dates</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="sched_start">Start Date & Time</Label>
                        <Input
                            id="sched_start"
                            type="datetime-local"
                            value={startDate}
                            onChange={(e) => onStartDateChange(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="sched_end">End Date & Time</Label>
                        <Input
                            id="sched_end"
                            type="datetime-local"
                            value={endDate}
                            onChange={(e) => onEndDateChange(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Day-of-Week & Timezone */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Days & Timezone</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="space-y-2">
                        <Label>Active Days</Label>
                        <div className="flex flex-wrap gap-1">
                            {weekdays.map((label, idx) => (
                                <button
                                    key={label}
                                    type="button"
                                    onClick={() => toggleDay(idx)}
                                    className={cn(
                                        'rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
                                        days.includes(idx)
                                            ? 'border-primary bg-primary text-primary-foreground'
                                            : 'border-input hover:bg-accent',
                                    )}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Button type="button" size="sm" variant="outline" onClick={() => setPresetDays('all')}>All Days</Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => setPresetDays('weekdays')}>Weekdays</Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => setPresetDays('weekends')}>Weekends</Button>
                        </div>
                    </div>
                    <div className="max-w-xs space-y-1.5">
                        <Label>Timezone</Label>
                        <select
                            className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm"
                            value={scheduleRules.timezone ?? 'Asia/Kolkata'}
                            onChange={(e) => updateRules({ timezone: e.target.value })}
                        >
                            {commonTimezones.map((tz) => (
                                <option key={tz} value={tz}>{tz}</option>
                            ))}
                        </select>
                    </div>
                </CardContent>
            </Card>

            {/* Time Slots */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm">Time-of-Day Slots</CardTitle>
                    <Button type="button" size="sm" variant="outline" onClick={addTimeSlot}>+ Add Slot</Button>
                </CardHeader>
                <CardContent className="space-y-2">
                    {timeSlots.length === 0 && (
                        <p className="text-xs text-muted-foreground">No time slots defined — ad runs all day.</p>
                    )}
                    {timeSlots.map((slot, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                            <Input
                                type="time"
                                value={slot.start_time}
                                onChange={(e) => updateTimeSlot(idx, 'start_time', e.target.value)}
                                className="w-32"
                            />
                            <span className="text-xs text-muted-foreground">to</span>
                            <Input
                                type="time"
                                value={slot.end_time}
                                onChange={(e) => updateTimeSlot(idx, 'end_time', e.target.value)}
                                className="w-32"
                            />
                            <Button type="button" size="icon" variant="ghost" onClick={() => removeTimeSlot(idx)}>
                                <X className="size-4" />
                            </Button>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Blackout Dates */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Blackout Dates</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex gap-2">
                        <Input
                            type="date"
                            value={blackoutInput}
                            onChange={(e) => setBlackoutInput(e.target.value)}
                            className="w-44"
                        />
                        <Button type="button" size="sm" variant="outline" onClick={addBlackout}>Add</Button>
                    </div>
                    {blackoutDates.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {blackoutDates.map((date) => (
                                <Badge key={date} variant="secondary" className="gap-1">
                                    {date}
                                    <button type="button" onClick={() => removeBlackout(date)} className="hover:text-destructive">
                                        <X className="size-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Impression Caps */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Impression Caps</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label>Total Impressions Cap</Label>
                        <Input
                            type="number"
                            min={0}
                            value={maxTotalImpressions ?? ''}
                            onChange={(e) => onMaxTotalChange(e.target.value ? Number(e.target.value) : null)}
                            placeholder="Unlimited"
                        />
                        {maxTotalImpressions && maxTotalImpressions > 0 && (
                            <div className="space-y-1">
                                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full rounded-full bg-primary transition-all"
                                        style={{ width: `${impressionCapPercent}%` }}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {totalImpressions.toLocaleString()} / {maxTotalImpressions.toLocaleString()} ({impressionCapPercent}%)
                                </p>
                            </div>
                        )}
                    </div>
                    <div className="space-y-1.5">
                        <Label>Daily Impressions Cap</Label>
                        <Input
                            type="number"
                            min={0}
                            value={maxDailyImpressions ?? ''}
                            onChange={(e) => onMaxDailyChange(e.target.value ? Number(e.target.value) : null)}
                            placeholder="Unlimited"
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
