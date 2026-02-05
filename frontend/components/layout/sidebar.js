'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import {
    LayoutDashboard,
    Users,
    Wallet,
    CalendarClock,
    FolderOpen,
    Settings,
    ShieldCheck,
    ChevronLeft,
    ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

const navigation = [
    {
        group: 'Main',
        items: [
            { label: 'Dashboard', route: '/dashboard', icon: LayoutDashboard },
            { label: 'Team', route: '/team', icon: Users },
            { label: 'Payroll', route: '/payroll', icon: Wallet },
            { label: 'Schedule', route: '/schedule', icon: CalendarClock },
        ]
    },
    {
        group: 'Admin',
        items: [
            { label: 'Documents', route: '/documents', icon: FolderOpen },
            { label: 'Settings', route: '/settings', icon: Settings },
            { label: 'Audit Log', route: '/audit-log', icon: ShieldCheck },
        ]
    }
]

export function Sidebar() {
    const pathname = usePathname()
    const { isSidebarCollapsed, toggleSidebar } = useAppStore()

    return (
        <aside
            className={cn(
                'hidden md:flex flex-col border-r bg-card transition-all duration-300',
                isSidebarCollapsed ? 'w-[72px]' : 'w-[240px]'
            )}
        >
            <div className="flex h-14 items-center border-b px-4">
                {!isSidebarCollapsed && (
                    <h1 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                        StaffDeck
                    </h1>
                )}
                {isSidebarCollapsed && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 text-white font-bold">
                        S
                    </div>
                )}
            </div>

            <nav className="flex-1 space-y-6 p-4 overflow-y-auto">
                {navigation.map((section) => (
                    <div key={section.group}>
                        {!isSidebarCollapsed && (
                            <h2 className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                                {section.group}
                            </h2>
                        )}
                        <div className="space-y-1">
                            {section.items.map((item) => {
                                const Icon = item.icon
                                const isActive = pathname === item.route

                                return (
                                    <Link
                                        key={item.route}
                                        href={item.route}
                                        className={cn(
                                            'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors relative',
                                            isActive
                                                ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400'
                                                : 'text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-foreground'
                                        )}
                                        title={isSidebarCollapsed ? item.label : undefined}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeNav"
                                                className="absolute right-0 top-0 bottom-0 w-[3px] bg-violet-600 rounded-l"
                                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                            />
                                        )}
                                        <Icon className="h-5 w-5 shrink-0" />
                                        {!isSidebarCollapsed && <span>{item.label}</span>}
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="border-t p-4">
                <button
                    onClick={toggleSidebar}
                    className="flex w-full items-center justify-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-foreground transition-colors"
                    aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {isSidebarCollapsed ? (
                        <ChevronRight className="h-5 w-5" />
                    ) : (
                        <>
                            <ChevronLeft className="h-5 w-5 mr-2" />
                            <span>Collapse</span>
                        </>
                    )}
                </button>
            </div>
        </aside>
    )
}
