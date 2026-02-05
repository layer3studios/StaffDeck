'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { auditAPI } from '@/lib/api'
import { formatRelativeDate } from '@/lib/utils'
import { ShieldCheck, FileText, UserCheck, AlertCircle, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

const actionIcons = {
    'Employee updated': UserCheck,
    'Status changed': AlertCircle,
    'Document uploaded': FileText
}

const actionColors = {
    'Employee updated': 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
    'Status changed': 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
    'Document uploaded': 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30'
}

export default function AuditLogPage() {
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                // 1. Get user role
                const userString = localStorage.getItem('user')
                const user = userString ? JSON.parse(userString) : null
                const isAdmin = user?.role === 'ADMIN'

                // 2. Only fetch if Admin
                if (isAdmin) {
                    const response = await auditAPI.getLogs()
                    if (response.data && response.data.data) {
                        setLogs(response.data.data)
                    }
                } else {
                    // Non-admins see empty logs, no error
                    setLogs([]) 
                }
            } catch (error) {
                console.error('Audit log fetch error:', error)
                // Ignore 403s so they don't clog the console
                if (error.response?.status !== 403) {
                    toast.error('Failed to load audit logs')
                }
            } finally {
                setLoading(false)
            }
        }
        fetchLogs()
    }, [])

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                    <ShieldCheck className="h-6 w-6 text-violet-600" />
                    Audit Log
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Track all actions and changes in your organization
                </p>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
                </div>
            ) : logs.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <ShieldCheck className="h-12 w-12 text-muted-foreground/50 mb-3" />
                        <p className="text-sm font-medium">No audit logs accessible</p>
                        <p className="text-xs text-muted-foreground mt-1 text-center max-w-sm">
                            Only administrators can view system audit logs.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {logs.map((log, index) => {
                        const Icon = actionIcons[log.action] || FileText
                        const timestamp = log.createdAt || log.timestamp

                        return (
                            <motion.div
                                key={log.id || log._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-4">
                                            <div className={`flex h-10 w-10 items-center justify-center rounded-lg shrink-0 ${actionColors[log.action] || 'bg-gray-100 text-gray-600'}`}>
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-4 mb-1">
                                                    <div>
                                                        <span className="text-sm font-medium">{log.action}</span>
                                                        <span className="text-sm text-muted-foreground"> by </span>
                                                        <span className="text-sm font-medium">{log.actor}</span>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                        {formatRelativeDate(timestamp)}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-muted-foreground mb-2">
                                                    Target: <span className="font-medium text-foreground">{log.target}</span>
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {log.details}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}