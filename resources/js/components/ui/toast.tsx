/**
 * Lightweight toast notification system — no external dependencies.
 * Usage: toast.success('Done!') | toast.error('Oops!') | toast.info('Note')
 */
import * as React from "react"
import { cn } from "@/lib/utils"
import { CheckCircle2, XCircle, Info, X } from "lucide-react"

type ToastVariant = "success" | "error" | "info"

interface ToastItem {
    id: string
    message: string
    variant: ToastVariant
}

// ── Global event bus ──────────────────────────────────────────────────────────
type ToastListener = (items: ToastItem[]) => void
let listeners: ToastListener[] = []
let toasts: ToastItem[] = []

function notify() {
    listeners.forEach((l) => l([...toasts]))
}

export const toast = {
    success: (message: string) => addToast(message, "success"),
    error:   (message: string) => addToast(message, "error"),
    info:    (message: string) => addToast(message, "info"),
}

function addToast(message: string, variant: ToastVariant) {
    const id = Math.random().toString(36).slice(2)
    toasts = [...toasts, { id, message, variant }]
    notify()
    setTimeout(() => removeToast(id), 4000)
}

function removeToast(id: string) {
    toasts = toasts.filter((t) => t.id !== id)
    notify()
}

// ── ToastProvider — mount once in your app root ───────────────────────────────
export function ToastProvider() {
    const [items, setItems] = React.useState<ToastItem[]>([])

    React.useEffect(() => {
        listeners.push(setItems)
        return () => {
            listeners = listeners.filter((l) => l !== setItems)
        }
    }, [])

    if (items.length === 0) return null

    return (
        <div className="fixed right-4 bottom-4 z-[100] flex flex-col gap-2">
            {items.map((item) => (
                <ToastItem key={item.id} item={item} onClose={() => removeToast(item.id)} />
            ))}
        </div>
    )
}

const icons: Record<ToastVariant, React.ReactNode> = {
    success: <CheckCircle2 className="size-4 shrink-0 text-green-600" />,
    error:   <XCircle      className="size-4 shrink-0 text-red-600" />,
    info:    <Info         className="size-4 shrink-0 text-blue-600" />,
}

const variantClass: Record<ToastVariant, string> = {
    success: "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950",
    error:   "border-red-200   bg-red-50   dark:border-red-800   dark:bg-red-950",
    info:    "border-blue-200  bg-blue-50  dark:border-blue-800  dark:bg-blue-950",
}

function ToastItem({ item, onClose }: { item: ToastItem; onClose: () => void }) {
    return (
        <div
            className={cn(
                "flex min-w-[280px] max-w-sm items-start gap-3 rounded-lg border px-4 py-3 shadow-lg",
                "animate-in slide-in-from-right-5 fade-in duration-200",
                variantClass[item.variant]
            )}
        >
            {icons[item.variant]}
            <p className="flex-1 text-sm font-medium text-foreground">{item.message}</p>
            <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground ml-1 shrink-0 transition-colors"
            >
                <X className="size-3.5" />
            </button>
        </div>
    )
}
