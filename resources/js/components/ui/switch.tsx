import * as React from "react"
import { cn } from "@/lib/utils"

interface SwitchProps extends Omit<React.ComponentProps<"button">, "onChange"> {
    checked?: boolean
    defaultChecked?: boolean
    onCheckedChange?: (checked: boolean) => void
}

function Switch({
    checked,
    defaultChecked = false,
    onCheckedChange,
    className,
    disabled,
    ...props
}: SwitchProps) {
    const [internalChecked, setInternalChecked] = React.useState(defaultChecked)
    const isChecked = checked ?? internalChecked

    const handleClick = () => {
        if (disabled) return
        const next = !isChecked
        setInternalChecked(next)
        onCheckedChange?.(next)
    }

    return (
        <button
            data-slot="switch"
            role="switch"
            aria-checked={isChecked}
            data-state={isChecked ? "checked" : "unchecked"}
            disabled={disabled}
            onClick={handleClick}
            className={cn(
                "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-xs transition-colors",
                "focus-visible:ring-ring/50 focus-visible:outline-ring focus-visible:ring-[3px] focus-visible:outline-1",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
                className
            )}
            {...props}
        >
            <span
                data-slot="switch-thumb"
                className={cn(
                    "bg-background pointer-events-none block size-4 rounded-full shadow-lg ring-0 transition-transform",
                    isChecked ? "translate-x-4" : "translate-x-0"
                )}
            />
        </button>
    )
}

export { Switch }
