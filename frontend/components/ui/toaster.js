'use client'
import { Toaster as Sonner } from 'sonner'

export function Toaster() {
    return (
        <Sonner
            position="bottom-right"
            toastOptions={{
                className: 'rounded-lg border bg-card text-card-foreground shadow-lg',
            }}
        />
    )
}
