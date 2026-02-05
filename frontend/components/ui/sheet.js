'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Sheet({ open, onOpenChange, children }) {
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }

        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [open])

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                        onClick={() => onOpenChange(false)}
                    />
                    {children}
                </>
            )}
        </AnimatePresence>
    )
}

export function SheetContent({ children, className, side = 'right' }) {
    const sideVariants = {
        right: {
            initial: { x: '100%' },
            animate: { x: 0 },
            exit: { x: '100%' }
        },
        left: {
            initial: { x: '-100%' },
            animate: { x: 0 },
            exit: { x: '-100%' }
        }
    }

    const positionClasses = {
        right: 'right-0',
        left: 'left-0'
    }

    return (
        <motion.div
            initial={sideVariants[side].initial}
            animate={sideVariants[side].animate}
            exit={sideVariants[side].exit}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={cn(
                'fixed top-0 z-50 h-full w-full bg-background shadow-xl sm:max-w-[520px]',
                positionClasses[side],
                className
            )}
        >
            {children}
        </motion.div>
    )
}

export function SheetHeader({ children, className }) {
    return (
        <div className={cn('flex flex-col space-y-2 p-6 border-b', className)}>
            {children}
        </div>
    )
}

export function SheetTitle({ children, className }) {
    return (
        <h2 className={cn('text-lg font-semibold tracking-tight', className)}>
            {children}
        </h2>
    )
}

export function SheetDescription({ children, className }) {
    return (
        <p className={cn('text-sm text-muted-foreground', className)}>
            {children}
        </p>
    )
}

export function SheetClose({ onClose }) {
    return (
        <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label="Close"
        >
            <X className="h-5 w-5" />
        </button>
    )
}
