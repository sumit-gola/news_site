import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { AdPosition } from '@/types';

type Props = {
    value: AdPosition;
    onChange: (value: AdPosition) => void;
};

type PositionZone = {
    value: AdPosition;
    label: string;
    shortLabel: string;
    gridArea: string;
};

const zones: PositionZone[] = [
    { value: 'notification_bar', label: 'Notification Bar', shortLabel: 'Notif Bar', gridArea: '1 / 1 / 2 / 5' },
    { value: 'header', label: 'Header Banner', shortLabel: 'Header', gridArea: '2 / 1 / 3 / 5' },
    { value: 'below_nav', label: 'Below Navigation', shortLabel: 'Below Nav', gridArea: '3 / 1 / 4 / 5' },
    { value: 'sticky_top', label: 'Sticky Top Bar', shortLabel: 'Sticky Top', gridArea: '4 / 1 / 5 / 5' },
    { value: 'left_sidebar_top', label: 'Left Sidebar Top', shortLabel: 'L-Side Top', gridArea: '5 / 1 / 6 / 2' },
    { value: 'in_article', label: 'In-Article', shortLabel: 'In Article', gridArea: '5 / 2 / 6 / 4' },
    { value: 'right_sidebar_top', label: 'Right Sidebar Top', shortLabel: 'R-Side Top', gridArea: '5 / 4 / 6 / 5' },
    { value: 'left_sidebar_bottom', label: 'Left Sidebar Bottom', shortLabel: 'L-Side Bot', gridArea: '6 / 1 / 7 / 2' },
    { value: 'between_articles', label: 'Between Articles', shortLabel: 'Between', gridArea: '6 / 2 / 7 / 4' },
    { value: 'right_sidebar_bottom', label: 'Right Sidebar Bottom', shortLabel: 'R-Side Bot', gridArea: '6 / 4 / 7 / 5' },
    { value: 'inline', label: 'Inline Content', shortLabel: 'Inline', gridArea: '7 / 2 / 8 / 4' },
    { value: 'sidebar', label: 'Sidebar (Generic)', shortLabel: 'Sidebar', gridArea: '7 / 4 / 8 / 5' },
    { value: 'footer', label: 'Footer Banner', shortLabel: 'Footer', gridArea: '8 / 1 / 9 / 5' },
    { value: 'sticky_bottom', label: 'Sticky Bottom Bar', shortLabel: 'Sticky Bot', gridArea: '9 / 1 / 10 / 5' },
    { value: 'popup', label: 'Popup', shortLabel: 'Popup', gridArea: '10 / 1 / 11 / 2' },
    { value: 'full_screen_overlay', label: 'Full-Screen Overlay', shortLabel: 'Fullscreen', gridArea: '10 / 2 / 11 / 3' },
    { value: 'floating_bottom_left', label: 'Floating Bottom Left', shortLabel: 'Float BL', gridArea: '10 / 3 / 11 / 4' },
    { value: 'floating_bottom_right', label: 'Floating Bottom Right', shortLabel: 'Float BR', gridArea: '10 / 4 / 11 / 5' },
];

export default function PositionSelector({ value, onChange }: Props) {
    return (
        <TooltipProvider delayDuration={200}>
            <div className="space-y-2">
                <div
                    className="grid gap-1 rounded-lg border bg-muted/30 p-2"
                    style={{
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gridTemplateRows: 'repeat(10, minmax(32px, auto))',
                    }}
                >
                    {zones.map((zone) => {
                        const selected = value === zone.value;

                        return (
                            <Tooltip key={zone.value}>
                                <TooltipTrigger asChild>
                                    <button
                                        type="button"
                                        onClick={() => onChange(zone.value)}
                                        style={{ gridArea: zone.gridArea }}
                                        className={cn(
                                            'flex items-center justify-center rounded border px-1 py-1 text-[10px] font-medium leading-tight transition-all hover:bg-accent',
                                            selected
                                                ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                                                : 'border-border bg-background text-muted-foreground hover:border-primary/50',
                                        )}
                                    >
                                        {zone.shortLabel}
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                    <p>{zone.label}</p>
                                </TooltipContent>
                            </Tooltip>
                        );
                    })}
                </div>
                <p className="text-xs text-muted-foreground">
                    Selected: <span className="font-medium text-foreground">{zones.find((z) => z.value === value)?.label ?? value}</span>
                </p>
            </div>
        </TooltipProvider>
    );
}

