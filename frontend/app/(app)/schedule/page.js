'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { scheduleAPI, employeeAPI } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { 
    Calendar as CalendarIcon, 
    ChevronLeft, ChevronRight, 
    Plus, Loader2, CheckCircle2, XCircle, 
    Plane, Thermometer, User, Clock
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Configuration for visual polish
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const LEAVE_TYPES = {
    Vacation: { label: 'Vacation', icon: Plane, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    Sick: { label: 'Sick Leave', icon: Thermometer, color: 'text-rose-600 bg-rose-50 border-rose-200' },
    Personal: { label: 'Personal', icon: User, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    Other: { label: 'Other', icon: Clock, color: 'text-slate-600 bg-slate-50 border-slate-200' }
}

export default function SchedulePage() {
    // --- STATE ---
    const [loading, setLoading] = useState(true)
    const [isAdmin, setIsAdmin] = useState(false)
    const [viewDate, setViewDate] = useState(new Date())
    
    // Data
    const [calendarEvents, setCalendarEvents] = useState([])
    const [requests, setRequests] = useState([])
    const [myBalance, setMyBalance] = useState(0)

    // Modal
    const [isRequestOpen, setIsRequestOpen] = useState(false)
    const [newRequest, setNewRequest] = useState({ type: 'Vacation', startDate: '', endDate: '', reason: '' })
    const [submitting, setSubmitting] = useState(false)

    // --- INITIALIZATION ---
    const fetchData = async () => {
        try {
            const userString = localStorage.getItem('user')
            const user = userString ? JSON.parse(userString) : null
            const admin = user?.role === 'ADMIN'
            setIsAdmin(admin)

            // Parallel Data Fetching
            const [calRes, reqRes] = await Promise.all([
                scheduleAPI.getCalendar(), // Get Approved Leaves
                scheduleAPI.getRequests()  // Get My Requests (or All if Admin)
            ])

            setCalendarEvents(calRes.data.data)
            setRequests(reqRes.data.data)

            // If Staff, fetch balance
            if (!admin && user?.employeeId) {
                const empRes = await employeeAPI.getOne(user.employeeId)
                setMyBalance(empRes.data.data.leaveBalance || 0)
            }

        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchData() }, [])

    // --- ACTIONS ---
    const handleSubmit = async () => {
        if (!newRequest.startDate || !newRequest.endDate) return toast.error("Dates are required")
        
        setSubmitting(true)
        try {
            await scheduleAPI.submitRequest({
                ...newRequest,
                startDate: new Date(newRequest.startDate).toISOString(),
                endDate: new Date(newRequest.endDate).toISOString()
            })
            toast.success("Request submitted")
            setIsRequestOpen(false)
            fetchData()
        } catch (e) {
            toast.error(e.response?.data?.message || "Failed to submit")
        } finally {
            setSubmitting(false)
        }
    }

    const handleAction = async (id, status) => {
        try {
            await scheduleAPI.actionRequest(id, status)
            toast.success(`Request ${status}`)
            fetchData()
        } catch (e) {
            toast.error("Action failed")
        }
    }

    // --- CALENDAR RENDERER ---
    const renderCalendar = () => {
        const year = viewDate.getFullYear()
        const month = viewDate.getMonth()
        const daysInMonth = new Date(year, month + 1, 0).getDate()
        const firstDay = new Date(year, month, 1).getDay() // 0 = Sun

        const cells = []
        // Empty cells for padding
        for (let i = 0; i < firstDay; i++) {
            cells.push(<div key={`empty-${i}`} className="bg-muted/5 min-h-[100px] border-b border-r" />)
        }
        // Day cells
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = new Date(year, month, day).toISOString().split('T')[0]
            const isToday = new Date().toDateString() === new Date(year, month, day).toDateString()
            
            // Find events for this day
            const daysEvents = calendarEvents.filter(ev => {
                const s = ev.startDate.split('T')[0]
                const e = ev.endDate.split('T')[0]
                return dateStr >= s && dateStr <= e
            })

            cells.push(
                <div key={day} className={cn("min-h-[100px] border-b border-r p-2 bg-background hover:bg-muted/5 transition-colors")}>
                    <div className="flex justify-between items-start mb-2">
                        <span className={cn("text-xs font-semibold h-6 w-6 flex items-center justify-center rounded-full", isToday ? "bg-violet-600 text-white" : "text-muted-foreground")}>
                            {day}
                        </span>
                    </div>
                    <div className="space-y-1">
                        {daysEvents.map((ev, i) => (
                            <div key={i} className={cn("text-[10px] px-1.5 py-0.5 rounded border truncate font-medium flex items-center gap-1", LEAVE_TYPES[ev.type]?.color)}>
                                <div className="w-1 h-1 rounded-full bg-current" />
                                {ev.employeeId?.firstName}
                            </div>
                        ))}
                    </div>
                </div>
            )
        }
        return cells
    }

    if (loading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-violet-600 h-8 w-8" /></div>

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Schedule</h1>
                    <p className="text-sm text-muted-foreground">Manage leaves and view team availability</p>
                </div>
                {!isAdmin && (
                    <Button onClick={() => setIsRequestOpen(true)} className="bg-violet-600 hover:bg-violet-700 shadow-sm">
                        <Plus className="h-4 w-4 mr-2" /> New Request
                    </Button>
                )}
            </div>

            {/* Main Layout: Split View */}
            <div className="flex flex-1 gap-6 overflow-hidden">
                
                {/* LEFT: Calendar (70%) */}
                <Card className="flex-[3] flex flex-col overflow-hidden border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <div className="p-4 border-b flex items-center justify-between bg-muted/20">
                        <div className="flex items-center gap-4">
                            <h2 className="text-lg font-semibold w-40">{MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}</h2>
                            <div className="flex items-center border rounded-md bg-background">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))}><ChevronLeft className="h-4 w-4" /></Button>
                                <div className="w-px h-4 bg-border" />
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))}><ChevronRight className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    </div>
                    
                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 border-b bg-muted/40">
                        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
                            <div key={d} className="py-2 text-center text-[10px] font-bold text-muted-foreground">{d}</div>
                        ))}
                    </div>

                    {/* Grid */}
                    <div className="flex-1 overflow-y-auto bg-muted/5">
                        <div className="grid grid-cols-7 auto-rows-fr min-h-[600px] bg-background">
                            {renderCalendar()}
                        </div>
                    </div>
                </Card>

                {/* RIGHT: Action Center (30%) */}
                <div className="flex-1 flex flex-col gap-4 min-w-[300px]">
                    
                    {/* Balance Card (Staff Only) */}
                    {!isAdmin && (
                        <Card className="bg-gradient-to-br from-violet-600 to-indigo-600 text-white border-0 shadow-md">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-violet-100 text-xs font-bold uppercase tracking-wider">Available Balance</p>
                                        <h3 className="text-4xl font-bold mt-1">{myBalance}</h3>
                                        <p className="text-violet-200 text-xs mt-1">days remaining</p>
                                    </div>
                                    <div className="bg-white/20 p-2 rounded-lg"><Plane className="h-5 w-5 text-white" /></div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Requests List */}
                    <Card className="flex-1 flex flex-col overflow-hidden shadow-sm">
                        <CardHeader className="py-3 px-4 border-b bg-muted/20">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Clock className="h-4 w-4 text-violet-500" />
                                {isAdmin ? 'Pending Approvals' : 'My Requests'}
                            </CardTitle>
                        </CardHeader>
                        <div className="flex-1 overflow-y-auto p-0">
                            {requests.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground text-xs">No records found</div>
                            ) : (
                                <div className="divide-y">
                                    {requests.map(req => (
                                        <div key={req._id} className="p-4 hover:bg-muted/5 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-3">
                                                    {isAdmin && <Avatar className="h-8 w-8" src={req.employeeId?.avatar} fallback={req.employeeId?.firstName[0]} />}
                                                    <div>
                                                        <div className="font-medium text-sm">{req.type}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className={cn("text-[10px]", 
                                                    req.status === 'APPROVED' ? "bg-green-50 text-green-700 border-green-200" :
                                                    req.status === 'REJECTED' ? "bg-red-50 text-red-700 border-red-200" : "bg-amber-50 text-amber-700 border-amber-200"
                                                )}>{req.status}</Badge>
                                            </div>
                                            
                                            {req.reason && <div className="text-xs bg-muted/50 p-2 rounded mb-2">"{req.reason}"</div>}

                                            {/* Admin Actions */}
                                            {isAdmin && req.status === 'PENDING' && (
                                                <div className="flex gap-2 mt-2">
                                                    <Button size="sm" className="h-7 text-xs flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleAction(req._id, 'APPROVED')}>
                                                        Approve
                                                    </Button>
                                                    <Button size="sm" variant="outline" className="h-7 text-xs flex-1 text-red-600 hover:bg-red-50" onClick={() => handleAction(req._id, 'REJECTED')}>
                                                        Reject
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            {/* Request Modal */}
            <Dialog open={isRequestOpen} onOpenChange={setIsRequestOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>New Leave Request</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <label className="text-xs font-medium uppercase text-muted-foreground">Leave Type</label>
                            <Select value={newRequest.type} onValueChange={v => setNewRequest({...newRequest, type: v})}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Vacation">Vacation</SelectItem>
                                    <SelectItem value="Sick">Sick Leave</SelectItem>
                                    <SelectItem value="Personal">Personal</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><label className="text-xs font-medium uppercase text-muted-foreground">From</label><Input type="date" value={newRequest.startDate} onChange={e => setNewRequest({...newRequest, startDate: e.target.value})} /></div>
                            <div className="space-y-2"><label className="text-xs font-medium uppercase text-muted-foreground">To</label><Input type="date" value={newRequest.endDate} onChange={e => setNewRequest({...newRequest, endDate: e.target.value})} /></div>
                        </div>
                        <div className="space-y-2"><label className="text-xs font-medium uppercase text-muted-foreground">Reason</label><Input value={newRequest.reason} onChange={e => setNewRequest({...newRequest, reason: e.target.value})} placeholder="Optional..." /></div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsRequestOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={submitting}>Submit Request</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}