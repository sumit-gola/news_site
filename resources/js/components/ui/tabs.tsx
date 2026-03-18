import * as React from "react"
import { cn } from "@/lib/utils"

interface TabsContextValue {
    activeTab: string
    setActiveTab: (tab: string) => void
}

const TabsContext = React.createContext<TabsContextValue>({
    activeTab: "",
    setActiveTab: () => {},
})

interface TabsProps {
    defaultValue: string
    value?: string
    onValueChange?: (value: string) => void
    className?: string
    children: React.ReactNode
}

function Tabs({ defaultValue, value, onValueChange, className, children }: TabsProps) {
    const [internalTab, setInternalTab] = React.useState(defaultValue)
    const activeTab = value ?? internalTab

    const setActiveTab = React.useCallback(
        (tab: string) => {
            setInternalTab(tab)
            onValueChange?.(tab)
        },
        [onValueChange]
    )

    return (
        <TabsContext.Provider value={{ activeTab, setActiveTab }}>
            <div data-slot="tabs" className={cn("flex flex-col gap-2", className)}>
                {children}
            </div>
        </TabsContext.Provider>
    )
}

function TabsList({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="tabs-list"
            className={cn(
                "bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-1",
                className
            )}
            {...props}
        />
    )
}

interface TabsTriggerProps extends React.ComponentProps<"button"> {
    value: string
}

function TabsTrigger({ value, className, ...props }: TabsTriggerProps) {
    const { activeTab, setActiveTab } = React.useContext(TabsContext)
    const isActive = activeTab === value

    return (
        <button
            data-slot="tabs-trigger"
            data-state={isActive ? "active" : "inactive"}
            onClick={() => setActiveTab(value)}
            className={cn(
                "data-[state=active]:bg-background data-[state=active]:text-foreground focus-visible:ring-ring/50 focus-visible:outline-ring inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium whitespace-nowrap transition-all focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50",
                className
            )}
            {...props}
        />
    )
}

interface TabsContentProps extends React.ComponentProps<"div"> {
    value: string
}

function TabsContent({ value, className, ...props }: TabsContentProps) {
    const { activeTab } = React.useContext(TabsContext)

    if (activeTab !== value) return null

    return (
        <div
            data-slot="tabs-content"
            data-state="active"
            className={cn("flex-1 outline-none", className)}
            {...props}
        />
    )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
