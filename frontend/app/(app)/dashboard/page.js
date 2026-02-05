'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Wallet, CalendarClock, BadgeCheck, Loader2 } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useAppStore } from '@/store/useAppStore'
import { dashboardAPI } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { Avatar } from '@/components/ui/avatar'
import { toast } from 'sonner'

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
}

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
}

export default function DashboardPage() {
    const { isPrivacyMode } = useAppStore()
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState(null)
    const [payrollTrend, setPayrollTrend] = useState([])

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Get user from storage to check role
                const userString = localStorage.getItem('user')
                const user = userString ? JSON.parse(userString) : null
                const isAdmin = user?.role === 'ADMIN'

                // 2. Always fetch stats
                const statsPromise = dashboardAPI.getStats()
                
                // 3. Only fetch trends if Admin (Prevents 403 error)
                const trendPromise = isAdmin 
                    ? dashboardAPI.getPayrollTrend() 
                    : Promise.resolve({ data: { data: [] } }) // Return empty default if not admin

                const [statsRes, trendRes] = await Promise.all([statsPromise, trendPromise])

                setStats(statsRes.data?.data || null)
                setPayrollTrend(trendRes.data?.data || [])
            } catch (error) {
                console.error('Dashboard fetch error:', error)
                // Don't toast on 403s if they slip through, only real errors
                if (error.response?.status !== 403) {
                    toast.error('Failed to load dashboard data')
                }
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
            </div>
        )
    }

    const kpiCards = [
        {
            title: 'Total employees',
            value: stats?.totalEmployees || 0,
            delta: '+0 this month', // Backend doesn't support delta yet, placeholder
            icon: Users,
            iconColor: 'text-violet-600',
            iconBg: 'bg-violet-100 dark:bg-violet-900/30'
        },
        {
            title: 'Next payroll run',
            value: formatCurrency(stats?.nextPayrollCost || 0),
            delta: 'Due in 3 days',
            icon: Wallet,
            iconColor: 'text-emerald-600',
            iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
            isPrivate: true
        },
        {
            title: 'Active leaves',
            value: stats?.onLeaveCount || 0,
            delta: 'Returning soon',
            icon: CalendarClock,
            iconColor: 'text-amber-600',
            iconBg: 'bg-amber-100 dark:bg-amber-900/30'
        },
        {
            title: 'Pending offers',
            value: '0', // Placeholder as backend doesn't track offers yet
            delta: 'View details',
            icon: BadgeCheck,
            iconColor: 'text-blue-600',
            iconBg: 'bg-blue-100 dark:bg-blue-900/30'
        }
    ]

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Overview of your team and upcoming activities
                </p>
            </div>

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6"
            >
                {kpiCards.map((card, index) => {
                    const Icon = card.icon
                    const displayValue = card.isPrivate && isPrivacyMode ? 'Hidden' : card.value

                    return (
                        <motion.div key={card.title} variants={item}>
                            <Card className="hover:shadow-md transition-shadow">
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-muted-foreground">
                                                {card.title}
                                            </p>
                                            <h3 className="text-2xl font-semibold tracking-tight mt-2 tabular-nums">
                                                {displayValue}
                                            </h3>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {card.delta}
                                            </p>
                                        </div>
                                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.iconBg}`}>
                                            <Icon className={`h-5 w-5 ${card.iconColor}`} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )
                })}
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-2"
                >
                    <Card>
                        <CardHeader>
                            <CardTitle>Payroll trend</CardTitle>
                            <CardDescription>Monthly payroll totals over the last 12 months</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={payrollTrend}>
                                        <defs>
                                            <linearGradient id="payrollGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="rgb(139, 92, 246)" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="rgb(139, 92, 246)" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                                        <XAxis
                                            dataKey="month"
                                            stroke="hsl(var(--muted-foreground))"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            stroke="hsl(var(--muted-foreground))"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => isPrivacyMode ? '***' : `$${value / 1000}k`}
                                        />
                                        <Tooltip
                                            content={({ active, payload }) => {
                                                if (!active || !payload || !payload.length) return null

                                                return (
                                                    <div className="rounded-lg border bg-popover p-3 shadow-lg">
                                                        <div className="text-xs font-medium text-muted-foreground mb-1">
                                                            {payload[0].payload.month}
                                                        </div>
                                                        <div className="text-sm font-semibold tabular-nums">
                                                            {isPrivacyMode ? 'Hidden in privacy mode' : formatCurrency(payload[0].value)}
                                                        </div>
                                                    </div>
                                                )
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="amount"
                                            stroke="rgb(139, 92, 246)"
                                            strokeWidth={2}
                                            fill="url(#payrollGradient)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {stats?.recentOnLeave && stats.recentOnLeave.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <Card className="h-full">
                            <CardHeader>
                                <CardTitle>Currently on leave</CardTitle>
                                <CardDescription>Team members currently marked as on leave</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {stats.recentOnLeave.map((emp) => (
                                        <div key={emp._id} className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <div className="flex h-full w-full items-center justify-center bg-violet-100 text-violet-600 font-medium">
                                                    {emp.firstName?.[0]}{emp.lastName?.[0]}
                                                </div>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium truncate">{emp.firstName} {emp.lastName}</div>
                                                <div className="text-xs text-muted-foreground truncate">{emp.role}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </div>
        </div>
    )
}
