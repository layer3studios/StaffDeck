'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect } from 'react'

export function Dialog({ open, onOpenChange, children }) {
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
                        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                        onClick={() => onOpenChange(false)}
                    />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        {children}
                    </div>
                </>
            )}
        </AnimatePresence>
    )
}

export function DialogContent({ children, className }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className={`relative bg-background rounded-lg shadow-xl max-w-md w-full ${className || ''}`}
            onClick={(e) => e.stopPropagation()}
        >
            {children}
        </motion.div>
    )
}

export function DialogHeader({ children, onClose }) {
    return (
        <div className="flex items-start justify-between p-6 pb-4">
            <div className="flex-1">{children}</div>
            {onClose && (
                <button
                    onClick={onClose}
                    className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
                    aria-label="Close"
                >
                    <X className="h-5 w-5" />
                </button>
            )}
        </div>
    )
}

export function DialogTitle({ children }) {
    return (
        <h2 className="text-lg font-semibold tracking-tight">{children}</h2>
    )
}

export function DialogDescription({ children }) {
    return (
        <p className="text-sm text-muted-foreground mt-2">{children}</p>
    )
}

export function DialogFooter({ children }) {
    return (
        <div className="flex items-center justify-end gap-2 p-6 pt-4 border-t">
            {children}
        </div>
    )
}
