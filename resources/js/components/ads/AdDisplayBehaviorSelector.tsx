import {
    Eye,
    Fullscreen,
    Grip,
    Layers,
    Maximize2,
    Monitor,
    PanelBottomClose,
    X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DisplayBehavior } from '@/types';

type Props = {
    value: DisplayBehavior;
    onChange: (value: DisplayBehavior) => void;
};

const behaviors: Array<{
    value: DisplayBehavior;
    label: string;
    description: string;
    icon: React.ElementType;
}> = [
    { value: 'standard', label: 'Standard', description: 'Static ad shown in its slot', icon: Monitor },
    { value: 'closable', label: 'Closable', description: 'User can dismiss with X button', icon: X },
    { value: 'rotational', label: 'Rotational', description: 'Cycles between ads in the slot', icon: Layers },
    { value: 'sticky', label: 'Sticky', description: 'Stays fixed while scrolling', icon: Grip },
    { value: 'floating', label: 'Floating', description: 'Floats over content, draggable', icon: Maximize2 },
    { value: 'interstitial', label: 'Interstitial', description: 'Full-screen overlay between pages', icon: Fullscreen },
    { value: 'expandable', label: 'Expandable', description: 'Expands on hover or click', icon: Eye },
    { value: 'slide_in', label: 'Slide In', description: 'Slides in from edge of screen', icon: PanelBottomClose },
];

export default function AdDisplayBehaviorSelector({ value, onChange }: Props) {
    return (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {behaviors.map((behavior) => {
                const Icon = behavior.icon;
                const selected = value === behavior.value;

                return (
                    <button
                        key={behavior.value}
                        type="button"
                        onClick={() => onChange(behavior.value)}
                        className={cn(
                            'flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-all hover:border-primary/50 hover:bg-accent/50',
                            selected
                                ? 'border-primary bg-primary/5 shadow-sm'
                                : 'border-muted',
                        )}
                    >
                        <div
                            className={cn(
                                'flex size-10 items-center justify-center rounded-full',
                                selected
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground',
                            )}
                        >
                            <Icon className="size-5" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">{behavior.label}</p>
                            <p className="text-xs text-muted-foreground">{behavior.description}</p>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
