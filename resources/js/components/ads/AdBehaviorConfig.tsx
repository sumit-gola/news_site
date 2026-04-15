import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { DisplayBehavior, DisplayConfig } from '@/types';

type Props = {
    behavior: DisplayBehavior;
    config: DisplayConfig;
    onChange: (config: DisplayConfig) => void;
};

const positionGrid: Array<{ value: string; label: string }> = [
    { value: 'top-left', label: 'TL' },
    { value: 'top-center', label: 'TC' },
    { value: 'top-right', label: 'TR' },
    { value: 'center-left', label: 'CL' },
    { value: 'center', label: 'C' },
    { value: 'center-right', label: 'CR' },
    { value: 'bottom-left', label: 'BL' },
    { value: 'bottom-center', label: 'BC' },
    { value: 'bottom-right', label: 'BR' },
];

export default function AdBehaviorConfig({ behavior, config, onChange }: Props) {
    const update = (partial: Partial<DisplayConfig>) => onChange({ ...config, ...partial });

    if (behavior === 'standard') {
        return (
            <p className="text-sm text-muted-foreground">
                Standard ads display normally in their slot with no special behavior.
            </p>
        );
    }

    if (behavior === 'closable') {
        return (
            <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                    <Label>Dismiss Duration (hours)</Label>
                    <Input
                        type="number"
                        min={1}
                        max={720}
                        value={config.dismiss_duration_hours ?? 24}
                        onChange={(e) => update({ dismiss_duration_hours: Number(e.target.value) || 24 })}
                    />
                    <p className="text-xs text-muted-foreground">How long the ad stays hidden after dismissal</p>
                </div>
                <div className="space-y-1.5">
                    <Label>Show Close After (seconds)</Label>
                    <Input
                        type="number"
                        min={0}
                        max={30}
                        value={config.show_close_after_seconds ?? 0}
                        onChange={(e) => update({ show_close_after_seconds: Number(e.target.value) || 0 })}
                    />
                    <p className="text-xs text-muted-foreground">Delay before close button appears</p>
                </div>
                <div className="space-y-1.5">
                    <Label>Close Button Style</Label>
                    <Select
                        value={config.close_button_style ?? 'icon'}
                        onValueChange={(v) => update({ close_button_style: v as 'icon' | 'text' | 'icon_text' })}
                    >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="icon">Icon Only (X)</SelectItem>
                            <SelectItem value="text">Text ("Close")</SelectItem>
                            <SelectItem value="icon_text">Icon + Text</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        );
    }

    if (behavior === 'rotational') {
        return (
            <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                    <Label>Rotation Interval (seconds)</Label>
                    <Input
                        type="number"
                        min={3}
                        max={60}
                        value={config.interval_seconds ?? 5}
                        onChange={(e) => update({ interval_seconds: Number(e.target.value) || 5 })}
                    />
                </div>
                <div className="space-y-1.5">
                    <Label>Transition</Label>
                    <div className="flex gap-1">
                        {(['fade', 'slide', 'none'] as const).map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => update({ transition: t })}
                                className={cn(
                                    'rounded-md border px-3 py-1.5 text-sm capitalize transition-colors',
                                    (config.transition ?? 'fade') === t
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : 'border-input hover:bg-accent',
                                )}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex items-end gap-2 pb-1">
                    <Switch
                        checked={config.pause_on_hover ?? true}
                        onCheckedChange={(v) => update({ pause_on_hover: v })}
                    />
                    <Label>Pause on Hover</Label>
                </div>
            </div>
        );
    }

    if (behavior === 'sticky') {
        return (
            <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                    <Label>Offset Top (px)</Label>
                    <Input
                        type="number"
                        min={0}
                        value={config.offset_top ?? 0}
                        onChange={(e) => update({ offset_top: Number(e.target.value) || 0 })}
                    />
                </div>
                <div className="space-y-1.5">
                    <Label>Offset Bottom (px)</Label>
                    <Input
                        type="number"
                        min={0}
                        value={config.offset_bottom ?? 0}
                        onChange={(e) => update({ offset_bottom: Number(e.target.value) || 0 })}
                    />
                </div>
                <div className="space-y-1.5">
                    <Label>Z-Index</Label>
                    <Input
                        type="number"
                        min={1}
                        max={9999}
                        value={config.z_index ?? 50}
                        onChange={(e) => update({ z_index: Number(e.target.value) || 50 })}
                    />
                </div>
            </div>
        );
    }

    if (behavior === 'floating') {
        return (
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                    <Label>Initial Position</Label>
                    <div className="grid grid-cols-3 gap-1">
                        {positionGrid.map((pos) => (
                            <button
                                key={pos.value}
                                type="button"
                                onClick={() => update({ initial_position: pos.value as DisplayConfig['initial_position'] })}
                                className={cn(
                                    'rounded border p-2 text-xs font-medium transition-colors',
                                    (config.initial_position ?? 'bottom-right') === pos.value
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : 'border-input hover:bg-accent',
                                )}
                            >
                                {pos.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Switch
                            checked={config.draggable ?? true}
                            onCheckedChange={(v) => update({ draggable: v })}
                        />
                        <Label>Draggable</Label>
                    </div>
                    <div className="space-y-1.5">
                        <Label>Show After (seconds)</Label>
                        <Input
                            type="number"
                            min={0}
                            max={60}
                            value={config.show_after_seconds ?? 2}
                            onChange={(e) => update({ show_after_seconds: Number(e.target.value) || 0 })}
                        />
                    </div>
                </div>
            </div>
        );
    }

    if (behavior === 'interstitial') {
        return (
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                    <Label>Show After Page Views</Label>
                    <Input
                        type="number"
                        min={1}
                        max={100}
                        value={config.show_after_pageviews ?? 1}
                        onChange={(e) => update({ show_after_pageviews: Number(e.target.value) || 1 })}
                    />
                    <p className="text-xs text-muted-foreground">Number of page views before showing</p>
                </div>
                <div className="space-y-1.5">
                    <Label>Skip Button Delay (seconds)</Label>
                    <Input
                        type="number"
                        min={0}
                        max={30}
                        value={config.skip_after_seconds ?? 5}
                        onChange={(e) => update({ skip_after_seconds: Number(e.target.value) || 5 })}
                    />
                    <p className="text-xs text-muted-foreground">Seconds before skip button appears</p>
                </div>
            </div>
        );
    }

    if (behavior === 'expandable') {
        return (
            <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                    <Label>Collapsed Height (px)</Label>
                    <Input
                        type="number"
                        min={20}
                        value={config.collapsed_height ?? 90}
                        onChange={(e) => update({ collapsed_height: Number(e.target.value) || 90 })}
                    />
                </div>
                <div className="space-y-1.5">
                    <Label>Expanded Height (px)</Label>
                    <Input
                        type="number"
                        min={50}
                        value={config.expanded_height ?? 250}
                        onChange={(e) => update({ expanded_height: Number(e.target.value) || 250 })}
                    />
                </div>
                <div className="space-y-1.5">
                    <Label>Trigger</Label>
                    <div className="flex gap-1">
                        {(['hover', 'click'] as const).map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => update({ trigger: t })}
                                className={cn(
                                    'rounded-md border px-4 py-1.5 text-sm capitalize transition-colors',
                                    (config.trigger ?? 'hover') === t
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : 'border-input hover:bg-accent',
                                )}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (behavior === 'slide_in') {
        return (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1.5">
                    <Label>Direction</Label>
                    <div className="flex gap-1">
                        {(['bottom', 'right', 'left'] as const).map((d) => (
                            <button
                                key={d}
                                type="button"
                                onClick={() => update({ direction: d })}
                                className={cn(
                                    'rounded-md border px-3 py-1.5 text-sm capitalize transition-colors',
                                    (config.direction ?? 'bottom') === d
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : 'border-input hover:bg-accent',
                                )}
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="space-y-1.5">
                    <Label>Trigger Type</Label>
                    <Select
                        value={(config.trigger as string) ?? 'scroll_percent'}
                        onValueChange={(v) => update({ trigger: v as 'scroll_percent' | 'time' })}
                    >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="scroll_percent">Scroll %</SelectItem>
                            <SelectItem value="time">Time Delay</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <Label>
                        {(config.trigger as string) === 'time' ? 'Delay (seconds)' : 'Scroll %'}
                    </Label>
                    <Input
                        type="number"
                        min={0}
                        max={(config.trigger as string) === 'time' ? 120 : 100}
                        value={config.trigger_value ?? 50}
                        onChange={(e) => update({ trigger_value: Number(e.target.value) || 50 })}
                    />
                </div>
                <div className="space-y-1.5">
                    <Label>Animation Duration (ms)</Label>
                    <Input
                        type="number"
                        min={100}
                        max={2000}
                        value={config.animation_duration_ms ?? 300}
                        onChange={(e) => update({ animation_duration_ms: Number(e.target.value) || 300 })}
                    />
                </div>
            </div>
        );
    }

    return null;
}
