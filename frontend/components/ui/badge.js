import { cn } from '@/lib/utils'

export function Badge({ children, variant = 'default', className }) {
    const variants = {
        default: 'bg-primary text-primary-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
        success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        danger: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
        outline: 'border border-border text-foreground'
    }

    return (
        <div className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
            variants[variant],
            className
        )}>
            {children}
        </div>
    )
}
