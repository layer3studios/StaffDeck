'use client'

import * as React from "react"
import { cn } from "@/lib/utils"

// Create a Context to share state between Tabs, Triggers, and Content
const TabsContext = React.createContext({})

export function Tabs({ defaultValue, value, onValueChange, children, className }) {
    // Handle both controlled (value passed in) and uncontrolled (internal state) modes
    const [stateValue, setStateValue] = React.useState(defaultValue || value || "")
    
    const currentValue = value !== undefined ? value : stateValue

    const handleValueChange = (newValue) => {
        if (value === undefined) {
            setStateValue(newValue)
        }
        // Call the parent's handler if provided
        onValueChange?.(newValue)
    }

    return (
        <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
            <div className={className}>
                {children}
            </div>
        </TabsContext.Provider>
    )
}

export function TabsList({ children, className }) {
    return (
        <div className={cn(
            'inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground',
            className
        )}>
            {children}
        </div>
    )
}

export function TabsTrigger({ value, children, className, disabled }) {
    const context = React.useContext(TabsContext)
    
    if (!context) {
        throw new Error("TabsTrigger must be used within a Tabs component")
    }

    const isActive = context.value === value

    return (
        <button
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={disabled}
            onClick={() => context.onValueChange(value)} // Uses context, not props
            className={cn(
                'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
                isActive
                    ? 'bg-background text-foreground shadow-sm'
                    : 'hover:bg-background/50',
                className
            )}
        >
            {children}
        </button>
    )
}

export function TabsContent({ value, children, className }) {
    const context = React.useContext(TabsContext)

    if (!context) {
        throw new Error("TabsContent must be used within a Tabs component")
    }

    // Only render if this content matches the active tab
    if (context.value !== value) return null

    return (
        <div
            role="tabpanel"
            className={cn(
                "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                className
            )}
        >
            {children}
        </div>
    )
}