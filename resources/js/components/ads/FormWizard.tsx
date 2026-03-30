import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type WizardStep = {
    id: string;
    label: string;
    icon?: React.ElementType;
};

type Props = {
    steps: WizardStep[];
    currentStep: string;
    completedSteps: string[];
    onStepChange: (stepId: string) => void;
    children: React.ReactNode;
    onBack?: () => void;
    onNext?: () => void;
    onSubmit?: () => void;
    isLastStep?: boolean;
    isFirstStep?: boolean;
    processing?: boolean;
};

export default function FormWizard({
    steps,
    currentStep,
    completedSteps,
    onStepChange,
    children,
    onBack,
    onNext,
    onSubmit,
    isLastStep = false,
    isFirstStep = false,
    processing = false,
}: Props) {
    const currentIndex = steps.findIndex((s) => s.id === currentStep);
    const progress = steps.length > 0 ? ((currentIndex + 1) / steps.length) * 100 : 0;

    return (
        <div className="flex min-h-[600px] gap-6">
            {/* Left sidebar navigation */}
            <div className="hidden w-56 shrink-0 lg:block">
                <nav className="sticky top-20 space-y-1">
                    {steps.map((step, idx) => {
                        const isCurrent = step.id === currentStep;
                        const isCompleted = completedSteps.includes(step.id);
                        const Icon = step.icon;

                        return (
                            <button
                                key={step.id}
                                type="button"
                                onClick={() => onStepChange(step.id)}
                                className={cn(
                                    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                                    isCurrent
                                        ? 'bg-primary/10 font-medium text-primary'
                                        : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                                )}
                            >
                                <div
                                    className={cn(
                                        'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium',
                                        isCompleted
                                            ? 'bg-primary text-primary-foreground'
                                            : isCurrent
                                              ? 'border-2 border-primary text-primary'
                                              : 'border border-muted-foreground/30 text-muted-foreground',
                                    )}
                                >
                                    {isCompleted ? (
                                        <Check className="size-3.5" />
                                    ) : Icon ? (
                                        <Icon className="size-3.5" />
                                    ) : (
                                        idx + 1
                                    )}
                                </div>
                                <span className="truncate">{step.label}</span>
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Main content area */}
            <div className="flex min-w-0 flex-1 flex-col">
                {/* Progress bar */}
                <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                        className="h-full rounded-full bg-primary transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Mobile step indicator */}
                <div className="mb-4 flex items-center justify-between lg:hidden">
                    <p className="text-sm font-medium">
                        Step {currentIndex + 1} of {steps.length}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {steps[currentIndex]?.label}
                    </p>
                </div>

                {/* Step content */}
                <div className="flex-1">{children}</div>

                {/* Bottom navigation */}
                <div className="mt-6 flex items-center justify-between border-t pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onBack}
                        disabled={isFirstStep}
                    >
                        Back
                    </Button>

                    <div className="flex gap-2">
                        {isLastStep ? (
                            <Button type="button" onClick={onSubmit} disabled={processing}>
                                {processing ? 'Saving...' : 'Save Ad'}
                            </Button>
                        ) : (
                            <Button type="button" onClick={onNext}>
                                Next
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
