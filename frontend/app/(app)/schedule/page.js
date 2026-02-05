'use client'
import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { scheduleAPI, employeeAPI } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { 
    Calendar as CalendarIcon, 
    ChevronLeft, 
    ChevronRight, 
    Plus, 
    Loader2, 
    Plane, 
    Thermometer, 
    User, 
    MoreHorizontal,
    Search,
    Filter
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// --- CONSTANTS & HELPERS ---
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const LEAVE_TYPES = {
    Vacation: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: Plane },
    Sick: { color: 'bg-rose-100 text-rose-700 border-rose-200', icon: Thermometer },
    Personal: { color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: User },
    Other: { color: 'bg-slate-100 text-slate-700 border-slate-200', icon: MoreHorizontal }
}

// Mock Public Holidays (Industry Standard: Fetch this from an API usually)
const PUBLIC_HOLIDAYS = [
    { date: '2026-01-01', name: "New Year's Day" },
    { date: '2026-01-26', name: "Republic Day" },
    { date: '2026-05-01', name: "Labor Day" },
    { date: '2026-08-15', name: "Independence Day" },
    { date: '2026-10-02', name: "Gandhi Jayanti" },
    { date: '2026-12-25', name: "Christmas" }
]

export default function SchedulePage() {
    // --- STATE ---
    const [loading, setLoading] = useState(true)
    const [viewDate, setViewDate] = useState(new Date()) // Controls the calendar month
    const [calendarEvents, setCalendarEvents] = useState([])
    const [requests, setRequests] = useState([])
    const [isAdmin, setIsAdmin] = useState(false)
    const [myBalance, setMyBalance] = useState(0)
    const [viewMode, setViewMode] = useState('team') // 'team' | 'my'

    // Sheet State
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [newRequest, setNewRequest] = useState({ type: 'Vacation', startDate: '', endDate: '', reason: '' })
    const [submitting, setSubmitting] = useState(false)

    // Derived
    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate()
    const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay()
    
    // --- DATA FETCHING ---
    const fetchData = async () => {
        try {
            const userString = localStorage.getItem('user')
            const user = userString ? JSON.parse(userString) : null
            const admin = user?.role === 'ADMIN'
            setIsAdmin(admin)

            const [calRes, reqRes] = await Promise.all([
                scheduleAPI.getCalendar(),
                scheduleAPI.getRequests()
            ])

            setCalendarEvents(calRes.data.data)
            setRequests(reqRes.data.data)

            if (!admin && user?.employeeId) {
                const empRes = await employeeAPI.getOne(user.employeeId)
                setMyBalance(empRes.data.data.leaveBalance)
            }
        } catch (error) {
            // silent fail
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchData() }, [])

    // --- HANDLERS ---
    const handlePrevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
    const handleNextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))
    
    const handleDayClick = (day) => {
        if (!isAdmin) {
            const dateStr = new Date(viewDate.getFullYear(), viewDate.getMonth(), day).toISOString().split('T')[0]
            setNewRequest({ ...newRequest, startDate: dateStr, endDate: dateStr })
            setIsSheetOpen(true)
        }
    }

    const handleSubmitRequest = async () => {
        setSubmitting(true)
        try {
            const payload = {
                ...newRequest,
                startDate: new Date(newRequest.startDate).toISOString(),
                endDate: new Date(newRequest.endDate).toISOString()
            }
            await scheduleAPI.submitRequest(payload)
            toast.success('Request submitted for approval')
            setIsSheetOpen(false)
            setNewRequest({ type: 'Vacation', startDate: '', endDate: '', reason: '' })
            fetchData()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed')
        } finally {
            setSubmitting(false)
        }
    }

    const handleAction = async (id, status) => {
        try {
            await scheduleAPI.actionRequest(id, status)
            toast.success(`Request ${status}`)
            fetchData()
        } catch(e) { toast.error('Action failed') }
    }

    // --- CALENDAR RENDER LOGIC ---
    const renderCalendarCells = () => {
        const cells = []
        const today = new Date()
        
        // Padding for previous month
        for (let i = 0; i < firstDayOfMonth; i++) {
            cells.push(<div key={`empty-${i}`} className="bg-muted/10 border-b border-r min-h-[120px]" />)
        }

        // Days
        for (let day = 1; day <= daysInMonth; day++) {
            const currentObj = new Date(viewDate.getFullYear(), viewDate.getMonth(), day)
            const dateStr = currentObj.toISOString().split('T')[0]
            const isToday = currentObj.toDateString() === today.toDateString()
            const isWeekend = currentObj.getDay() === 0 || currentObj.getDay() === 6
            const holiday = PUBLIC_HOLIDAYS.find(h => h.date === dateStr)

            // Filter Events for this day
            const dayEvents = calendarEvents.filter(ev => {
                const start = new Date(ev.startDate).setHours(0,0,0,0)
                const end = new Date(ev.endDate).setHours(0,0,0,0)
                const current = currentObj.setHours(0,0,0,0)
                return current >= start && current <= end
            })

            cells.push(
                <div 
                    key={day} 
                    onClick={() => handleDayClick(day)}
                    className={cn(
                        "relative border-b border-r p-2 min-h-[120px] transition-colors group cursor-pointer",
                        isWeekend ? "bg-muted/20" : "bg-background",
                        holiday ? "bg-amber-50/50 dark:bg-amber-900/10" : "hover:bg-muted/10"
                    )}
                >
                    <div className="flex justify-between items-start">
                        <span className={cn(
                            "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                            isToday ? "bg-violet-600 text-white" : "text-muted-foreground",
                            holiday ? "text-amber-600" : ""
                        )}>
                            {day}
                        </span>
                        {holiday && (
                            <span className="text-[10px] font-medium text-amber-600 truncate max-w-[80px] hidden md:block">
                                {holiday.name}
                            </span>
                        )}
                        {!isAdmin && !holiday && !isWeekend && (
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity -mt-1 -mr-1"
                            >
                                <Plus className="h-3 w-3" />
                            </Button>
                        )}
                    </div>

                    <div className="mt-2 space-y-1">
                        {dayEvents.slice(0, 3).map((ev, i) => (
                            <div key={i} className={cn("text-[10px] px-1.5 py-0.5 rounded border truncate flex items-center gap-1", LEAVE_TYPES[ev.type]?.color)}>
                                <Avatar className="h-3 w-3">
                                    {/* Fallback avatar logic inline if src missing */}
                                    <div className="bg-primary/20 text-primary w-full h-full flex items-center justify-center text-[8px]">
                                        {ev.employeeId?.firstName?.[0]}
                                    </div>
                                </Avatar>
                                <span>{ev.employeeId?.firstName}</span>
                            </div>
                        ))}
                        {dayEvents.length > 3 && (
                            <div className="text-[10px] text-muted-foreground pl-1">
                                +{dayEvents.length - 3} more
                            </div>
                        )}
                    </div>
                </div>
            )
        }
        return cells
    }

    if (loading) return <div className="flex justify-center h-screen items-center"><Loader2 className="w-8 h-8 animate-spin text-violet-600" /></div>

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)]">
            {/* --- HEADER BAR --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
                    <p className="text-sm text-muted-foreground">
                        {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
                    </p>
                </div>

                <div className="flex items-center gap-3 bg-card p-1 rounded-lg border shadow-sm">
                    <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="w-px h-6 bg-border" />
                    <Button variant="ghost" size="sm" onClick={() => setViewDate(new Date())}>
                        Today
                    </Button>
                    <div className="w-px h-6 bg-border" />
                    <Button variant="ghost" size="icon" onClick={handleNextMonth}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex gap-3">
                    {!isAdmin && (
                        <Card className="flex items-center gap-4 px-4 py-2 bg-violet-50 border-violet-100 dark:bg-violet-900/20 dark:border-violet-800">
                            <div className="text-right">
                                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Balance</div>
                                <div className="text-xl font-bold text-violet-700 dark:text-violet-300">{myBalance} <span className="text-xs">days</span></div>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-violet-200 dark:bg-violet-800 flex items-center justify-center">
                                <Plane className="h-4 w-4 text-violet-700 dark:text-violet-300" />
                            </div>
                        </Card>
                    )}
                    
                    {!isAdmin && (
                        <Button onClick={() => setIsSheetOpen(true)} className="h-auto px-6 bg-violet-600 hover:bg-violet-700 shadow-md">
                            <Plus className="h-4 w-4 mr-2" /> Request
                        </Button>
                    )}
                </div>
            </div>

            {/* --- MAIN CONTENT AREA --- */}
            <div className="flex flex-1 gap-6 overflow-hidden">
                
                {/* CALENDAR (Main) */}
                <div className="flex-1 flex flex-col bg-card border rounded-xl shadow-sm overflow-hidden">
                    {/* Filter Bar */}
                    <div className="p-3 border-b flex items-center justify-between bg-muted/20">
                        <Tabs value={viewMode} onValueChange={setViewMode} className="w-[200px]">
                            <TabsList>
                                <TabsTrigger value="team">Team View</TabsTrigger>
                                <TabsTrigger value="my">My Schedule</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <div className="flex gap-2">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <Input placeholder="Filter employee..." className="h-8 w-[180px] pl-8 text-xs" />
                            </div>
                            <Button variant="outline" size="sm" className="h-8">
                                <Filter className="h-3.5 w-3.5 mr-2" /> Filter
                            </Button>
                        </div>
                    </div>

                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 border-b bg-muted/40">
                        {DAYS.map(d => (
                            <div key={d} className="p-3 text-xs font-semibold text-center text-muted-foreground uppercase tracking-wide">
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="grid grid-cols-7 auto-rows-fr h-full min-h-[600px]">
                            {renderCalendarCells()}
                        </div>
                    </div>
                </div>

                {/* --- SIDEBAR (Context) --- */}
                <div className="w-[320px] flex flex-col gap-4 overflow-y-auto">
                    {/* PENDING APPROVALS (Admin) or MY REQUESTS (Staff) */}
                    <Card className="flex-1 flex flex-col overflow-hidden">
                        <CardHeader className="pb-3 border-b bg-muted/10">
                            <CardTitle className="text-base flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4 text-violet-500" />
                                {isAdmin ? 'Inbox' : 'My Requests'}
                            </CardTitle>
                        </CardHeader>
                        <div className="flex-1 overflow-y-auto p-0">
                            {requests.filter(r => isAdmin ? r.status === 'PENDING' : true).length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground text-sm">
                                    No active requests.
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {requests.filter(r => isAdmin ? r.status === 'PENDING' : true).map(req => (
                                        <div key={req._id} className="p-4 hover:bg-muted/30 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-6 w-6">
                                                        <div className="bg-primary/10 text-primary w-full h-full flex items-center justify-center text-[10px]">
                                                            {req.employeeId?.firstName?.[0]}
                                                        </div>
                                                    </Avatar>
                                                    <span className="text-sm font-medium">{req.employeeId?.firstName}</span>
                                                </div>
                                                <Badge variant="outline" className={cn("text-[10px]", 
                                                    req.status === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-200' : 
                                                    req.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                                                )}>
                                                    {req.status}
                                                </Badge>
                                            </div>
                                            <div className="text-xs text-muted-foreground mb-2">
                                                {formatDate(req.startDate)} — {formatDate(req.endDate)}
                                            </div>
                                            {req.reason && (
                                                <div className="text-xs bg-muted p-2 rounded mb-3">
                                                    "{req.reason}"
                                                </div>
                                            )}
                                            {isAdmin && req.status === 'PENDING' && (
                                                <div className="flex gap-2">
                                                    <Button size="sm" className="w-full h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => handleAction(req._id, 'APPROVED')}>Approve</Button>
                                                    <Button size="sm" variant="outline" className="w-full h-7 text-xs text-red-600 hover:bg-red-50" onClick={() => handleAction(req._id, 'REJECTED')}>Reject</Button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* UPCOMING HOLIDAYS WIDGET */}
                    <Card>
                        <CardHeader className="pb-3 border-b bg-muted/10">
                            <CardTitle className="text-sm">Upcoming Holidays</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y">
                                {PUBLIC_HOLIDAYS.slice(0, 3).map((h, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 text-sm">
                                        <span className="text-muted-foreground">{h.name}</span>
                                        <span className="font-medium">{new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* --- REQUEST SLIDE-OVER SHEET --- */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="sm:max-w-[480px]">
                    <SheetHeader className="mb-6">
                        <SheetTitle>Request Time Off</SheetTitle>
                        <SheetDescription>
                            Submit a request for leave. Approvals typically take 24 hours.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="space-y-6">
                        {/* Type Selector */}
                        <div>
                            <label className="text-sm font-medium mb-3 block">Leave Type</label>
                            <div className="grid grid-cols-2 gap-3">
                                {Object.entries(LEAVE_TYPES).map(([key, config]) => {
                                    const Icon = config.icon
                                    return (
                                        <div 
                                            key={key}
                                            onClick={() => setNewRequest({ ...newRequest, type: key })}
                                            className={cn(
                                                "cursor-pointer p-3 rounded-lg border-2 flex items-center gap-3 transition-all",
                                                newRequest.type === key 
                                                    ? "border-violet-600 bg-violet-50/50" 
                                                    : "border-transparent bg-muted/50 hover:bg-muted"
                                            )}
                                        >
                                            <div className={cn("h-8 w-8 rounded-full flex items-center justify-center", config.color)}>
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <span className="text-sm font-medium">{key}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">From</label>
                                <Input type="date" value={newRequest.startDate} onChange={e => setNewRequest({...newRequest, startDate: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">To</label>
                                <Input type="date" value={newRequest.endDate} onChange={e => setNewRequest({...newRequest, endDate: e.target.value})} />
                            </div>
                        </div>

                        {/* Duration Calc */}
                        {newRequest.startDate && newRequest.endDate && (
                            <div className="p-4 bg-muted/30 rounded-lg border border-dashed flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Total Duration</span>
                                <Badge variant="secondary" className="text-base px-3">
                                    {Math.max(0, Math.ceil((new Date(newRequest.endDate) - new Date(newRequest.startDate)) / (1000 * 60 * 60 * 24)) + 1)} Days
                                </Badge>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Reason</label>
                            <Input 
                                placeholder="E.g. Doctor appointment, Family trip..." 
                                value={newRequest.reason} 
                                onChange={e => setNewRequest({...newRequest, reason: e.target.value})}
                            />
                        </div>
                    </div>

                    <SheetFooter className="mt-8 pt-4 border-t">
                        <SheetClose asChild>
                            <Button variant="ghost">Cancel</Button>
                        </SheetClose>
                        <Button onClick={handleSubmitRequest} disabled={submitting} className="bg-violet-600 hover:bg-violet-700 min-w-[120px]">
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Request'}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    )
}