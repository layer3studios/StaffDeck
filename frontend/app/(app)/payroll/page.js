'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useAppStore } from '@/store/useAppStore'
import { dashboardAPI, payrollAPI } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Wallet, Download, CheckCircle2, Loader2, AlertTriangle, Plus, Minus } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

export default function PayrollPage() {
    const { isPrivacyMode } = useAppStore()
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState(null)
    const [runs, setRuns] = useState([])
    const [isAdmin, setIsAdmin] = useState(false)
    const [mySlips, setMySlips] = useState([])

    // Worksheet State (Admin Only)
    const [isWorksheetOpen, setIsWorksheetOpen] = useState(false)
    const [employees, setEmployees] = useState([]) // The editable list
    const [worksheetLoading, setWorksheetLoading] = useState(false)
    const [processing, setProcessing] = useState(false)

    // Current Period Target
    const today = new Date()
    const [targetMonth, setTargetMonth] = useState(today.getMonth())
    const [targetYear, setTargetYear] = useState(today.getFullYear())

    const fetchData = async () => {
        try {
            const userString = localStorage.getItem('user')
            const user = userString ? JSON.parse(userString) : null
            const admin = user?.role === 'ADMIN'
            setIsAdmin(admin)

            if (admin) {
                // Admin Flow
                const [statsRes, runsRes] = await Promise.all([dashboardAPI.getStats(), payrollAPI.getRuns()])
                setStats(statsRes.data?.data || null)
                setRuns(runsRes.data?.data || [])
            } else {
                // Staff Flow
                const slipsRes = await payrollAPI.getMySlips()
                setMySlips(slipsRes.data?.data || [])
            }
        } catch (error) {
            // Ignore 403s effectively
            if (error.response?.status !== 403) {
                toast.error('Failed to load data')
            }
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleOpenWorksheet = async () => {
        setIsWorksheetOpen(true)
        setWorksheetLoading(true)
        try {
            const res = await payrollAPI.getPreview()
            // Hydrate with local state fields (bonus/deduction)
            const editableData = res.data.data.map(item => ({
                ...item,
                bonus: 0,
                deduction: 0,
                note: ''
            }))
            setEmployees(editableData)
        } catch (error) {
            toast.error("Failed to load employee list")
            setIsWorksheetOpen(false)
        } finally {
            setWorksheetLoading(false)
        }
    }

    const handleAdjustment = (id, field, value) => {
        setEmployees(prev => prev.map(emp => {
            if (emp.employeeId === id) {
                return { ...emp, [field]: parseFloat(value) || 0 }
            }
            return emp
        }))
    }

    const calculateTotal = () => {
        return employees.reduce((sum, emp) => {
            const net = (emp.baseSalary || 0) + (emp.bonus || 0) - (emp.deduction || 0)
            return sum + Math.max(0, net)
        }, 0)
    }

    const handleConfirmRun = async () => {
        setProcessing(true)
        try {
            // Transform UI state to API payload
            const adjustments = employees
                .filter(e => e.bonus > 0 || e.deduction > 0)
                .map(e => ({
                    employeeId: e.employeeId,
                    bonus: e.bonus,
                    deduction: e.deduction,
                    note: e.note
                }))

            await payrollAPI.executeRun({
                periodMonth: targetMonth,
                periodYear: targetYear,
                adjustments
            })

            toast.success('Payroll processed successfully!')
            setIsWorksheetOpen(false)
            fetchData() // Refresh history
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to process payroll')
        } finally {
            setProcessing(false)
        }
    }

    const handleDownload = (runId) => {
        const token = localStorage.getItem('token')
        toast.promise(
            fetch(payrollAPI.downloadRun(runId), {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(resp => {
                if (!resp.ok) throw new Error('Download failed')
                return resp.blob()
            })
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `payroll-${runId}.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            }),
            {
                loading: 'Generating CSV...',
                success: 'Download started',
                error: 'Download failed'
            }
        )
    }

    if (loading) return <div className="flex justify-center h-96 items-center"><Loader2 className="w-8 h-8 animate-spin text-violet-600" /></div>

    const monthName = new Date(targetYear, targetMonth).toLocaleString('default', { month: 'long', year: 'numeric' })

    // --- STAFF VIEW RENDER ---
    if (!isAdmin) {
        return (
            <div>
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold tracking-tight">My Payslips</h1>
                    <p className="text-sm text-muted-foreground mt-1">History of your compensation</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Payment History</CardTitle>
                        <CardDescription>Records of funds transferred to your account</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {mySlips.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">No payslips found yet.</div>
                        ) : (
                            <div className="border rounded-md">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted/50 text-muted-foreground">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">Date Paid</th>
                                            <th className="px-4 py-3 font-medium">Period</th>
                                            <th className="px-4 py-3 font-medium">Status</th>
                                            <th className="px-4 py-3 font-medium text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {mySlips.map((slip) => (
                                            <tr key={slip._id} className="border-b last:border-0 hover:bg-muted/30">
                                                <td className="px-4 py-3">{formatDate(slip.paidDate)}</td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {formatDate(slip.periodStart)} - {formatDate(slip.periodEnd)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant="success" className="bg-green-100 text-green-700 hover:bg-green-100/80">Paid</Badge>
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold tabular-nums">
                                                    {formatCurrency(slip.amount, isPrivacyMode)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        )
    }

    // --- ADMIN VIEW RENDER ---
    return (
        <div>
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Payroll</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage monthly compensation and adjustments</p>
                </div>
                <Button onClick={handleOpenWorksheet} className="gap-2 bg-violet-600 hover:bg-violet-700">
                    <Wallet className="h-4 w-4" />
                    Start Payroll Run
                </Button>
            </div>

            <div className="grid gap-6">
                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Projected Cost</CardTitle></CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(stats?.projectedPayroll || 0, isPrivacyMode)}</div>
                            <p className="text-xs text-muted-foreground mt-1">Monthly base (excluding bonuses)</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Active Employees</CardTitle></CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.activeEmployees || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">Eligible for this period</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Last Settlement</CardTitle></CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{runs.length > 0 ? formatDate(runs[0].createdAt) : 'None'}</div>
                            <p className="text-xs text-muted-foreground mt-1">{runs.length > 0 ? formatCurrency(runs[0].totalAmount, isPrivacyMode) : '-'}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* History */}
                <Card>
                    <CardHeader>
                        <CardTitle>Run History</CardTitle>
                        <CardDescription>Past settlements</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {runs.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground text-sm">No payroll records found.</div>
                        ) : (
                            <div className="border rounded-md">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted/50 text-muted-foreground">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">Period</th>
                                            <th className="px-4 py-3 font-medium">Processed On</th>
                                            <th className="px-4 py-3 font-medium">Headcount</th>
                                            <th className="px-4 py-3 font-medium text-right">Total Paid</th>
                                            <th className="px-4 py-3 font-medium text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {runs.map((run) => (
                                            <tr key={run._id} className="border-b last:border-0 hover:bg-muted/30">
                                                <td className="px-4 py-3 font-medium">
                                                    {new Date(run.periodStart).toLocaleString('default', { month: 'short', year: 'numeric' })}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">{formatDate(run.createdAt)}</td>
                                                <td className="px-4 py-3">{run.employeeCount}</td>
                                                <td className="px-4 py-3 text-right tabular-nums font-medium">
                                                    {formatCurrency(run.totalAmount, isPrivacyMode)}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => handleDownload(run._id)}>
                                                        <Download className="h-4 w-4 mr-2" />
                                                        CSV
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* WORKSHEET DIALOG (The "Real" Logic) */}
            <Dialog open={isWorksheetOpen} onOpenChange={setIsWorksheetOpen}>
                <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
                    <DialogHeader className="p-6 pb-2">
                        <DialogTitle>Run Payroll: {monthName}</DialogTitle>
                        <DialogDescription>Review base salaries and add adjustments (bonuses/overtime).</DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-auto px-6">
                        {worksheetLoading ? (
                            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-violet-600" /></div>
                        ) : (
                            <div className="border rounded-md">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted sticky top-0 z-10">
                                        <tr>
                                            <th className="px-4 py-3 text-left w-[200px]">Employee</th>
                                            <th className="px-4 py-3 text-right">Base Pay</th>
                                            <th className="px-4 py-3 text-right w-[140px]">Bonus (+)</th>
                                            <th className="px-4 py-3 text-right w-[140px]">Deduction (-)</th>
                                            <th className="px-4 py-3 text-right font-bold">Net Pay</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {employees.map((emp) => {
                                            const net = Math.max(0, emp.baseSalary + emp.bonus - emp.deduction)
                                            return (
                                                <tr key={emp.employeeId} className="hover:bg-muted/30">
                                                    <td className="px-4 py-2">
                                                        <div className="font-medium">{emp.name}</div>
                                                        <div className="text-xs text-muted-foreground">{emp.role}</div>
                                                    </td>
                                                    <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">
                                                        {formatCurrency(emp.baseSalary)}
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <div className="relative">
                                                            <Plus className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-green-600" />
                                                            <Input 
                                                                type="number" 
                                                                className="pl-7 h-8 text-right bg-white dark:bg-zinc-900"
                                                                placeholder="0"
                                                                value={emp.bonus || ''}
                                                                onChange={(e) => handleAdjustment(emp.employeeId, 'bonus', e.target.value)}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <div className="relative">
                                                            <Minus className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-red-600" />
                                                            <Input 
                                                                type="number" 
                                                                className="pl-7 h-8 text-right bg-white dark:bg-zinc-900"
                                                                placeholder="0"
                                                                value={emp.deduction || ''}
                                                                onChange={(e) => handleAdjustment(emp.employeeId, 'deduction', e.target.value)}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2 text-right font-bold tabular-nums">
                                                        {formatCurrency(net)}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="p-6 border-t bg-muted/20 items-center">
                        <div className="flex-1 text-left">
                            <div className="text-sm text-muted-foreground">Total Payout Estimate</div>
                            <div className="text-2xl font-bold text-violet-600">
                                {formatCurrency(calculateTotal())}
                            </div>
                        </div>
                        <Button variant="outline" onClick={() => setIsWorksheetOpen(false)}>Cancel</Button>
                        <Button 
                            onClick={handleConfirmRun} 
                            disabled={processing || worksheetLoading || employees.length === 0}
                            className="bg-violet-600 hover:bg-violet-700 min-w-[140px]"
                        >
                            {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                            Confirm & Pay
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}