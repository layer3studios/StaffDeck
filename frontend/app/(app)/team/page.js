'use client'
import { useState, useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { employeeAPI } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Search, UserPlus, Trash2, Loader2, MoreVertical } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export default function TeamPage() {
    const [isLoading, setIsLoading] = useState(true)
    const [employees, setEmployees] = useState([])
    const [isAdmin, setIsAdmin] = useState(false)
    
    // Add Employee Modal State
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [newEmp, setNewEmp] = useState({ firstName: '', lastName: '', email: '', role: 'Frontend Dev', department: 'Engineering', salary: 0 })
    const [isSubmitting, setIsSubmitting] = useState(false)

    const fetchEmployees = async () => {
        setIsLoading(true)
        try {
            const userString = localStorage.getItem('user')
            const user = userString ? JSON.parse(userString) : null
            setIsAdmin(user?.role === 'ADMIN')

            const response = await employeeAPI.getAll({ limit: 100 })
            // MongoDB returns _id, so we store it as is
            setEmployees(response.data.data.employees)
        } catch (error) {
            toast.error('Failed to load team')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchEmployees()
    }, [])

    const handleAddEmployee = async () => {
        setIsSubmitting(true)
        try {
            await employeeAPI.create({
                ...newEmp,
                salary: Number(newEmp.salary)
            })
            toast.success('Employee onboarded successfully')
            setIsAddOpen(false)
            fetchEmployees()
            // Reset form
            setNewEmp({ firstName: '', lastName: '', email: '', role: 'Frontend Dev', department: 'Engineering', salary: 0 })
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add employee')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleTerminate = async (id) => {
        if (!confirm("Are you sure you want to terminate this employee? They will lose access immediately.")) return;
        try {
            await employeeAPI.delete(id)
            toast.success('Employee terminated')
            fetchEmployees()
        } catch (error) {
            toast.error('Failed to terminate')
        }
    }

    return (
        <div>
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {isAdmin ? 'Manage your organization\'s workforce' : 'Meet your colleagues'}
                    </p>
                </div>
                {isAdmin && (
                    <Button onClick={() => setIsAddOpen(true)} className="gap-2 bg-violet-600 hover:bg-violet-700">
                        <UserPlus className="h-4 w-4" />
                        Add Member
                    </Button>
                )}
            </div>

            <Card>
                <div className="relative overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 text-muted-foreground border-b">
                            <tr>
                                <th className="px-4 py-3 font-medium">Name</th>
                                <th className="px-4 py-3 font-medium">Role</th>
                                <th className="px-4 py-3 font-medium">Department</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                                <th className="px-4 py-3 font-medium">Join Date</th>
                                {isAdmin && <th className="px-4 py-3 font-medium">Salary</th>}
                                {isAdmin && <th className="px-4 py-3 font-medium text-right">Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={isAdmin ? 7 : 5} className="h-32 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-violet-600"/></td></tr>
                            ) : employees.length === 0 ? (
                                <tr><td colSpan={isAdmin ? 7 : 5} className="h-32 text-center text-muted-foreground">No employees found.</td></tr>
                            ) : employees.map((emp) => (
                                // CRITICAL FIX: Use emp._id (MongoDB standard)
                                <tr key={emp._id} className="border-b last:border-0 hover:bg-muted/30">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <Avatar src={emp.avatar} alt={`${emp.firstName} ${emp.lastName}`} />
                                            <div>
                                                <div className="font-medium">{emp.firstName} {emp.lastName}</div>
                                                <div className="text-xs text-muted-foreground">{emp.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">{emp.role}</td>
                                    <td className="px-4 py-3"><Badge variant="outline">{emp.department}</Badge></td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium 
                                            ${emp.status === 'Active' ? 'bg-green-100 text-green-700' : 
                                              emp.status === 'On Leave' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                            {emp.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">{formatDate(emp.joinDate)}</td>
                                    {isAdmin && <td className="px-4 py-3 tabular-nums font-medium">{formatCurrency(emp.salary)}</td>}
                                    {isAdmin && (
                                        <td className="px-4 py-3 text-right">
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                                                </PopoverTrigger>
                                                <PopoverContent align="end" className="w-40 p-1">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => handleTerminate(emp._id)} 
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" /> Terminate
                                                    </Button>
                                                </PopoverContent>
                                            </Popover>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Add Employee Dialog */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Onboard New Employee</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">First Name</label>
                                <Input value={newEmp.firstName} onChange={e => setNewEmp({...newEmp, firstName: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Last Name</label>
                                <Input value={newEmp.lastName} onChange={e => setNewEmp({...newEmp, lastName: e.target.value})} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email (Login ID)</label>
                            <Input type="email" value={newEmp.email} onChange={e => setNewEmp({...newEmp, email: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Role</label>
                                <Select value={newEmp.role} onValueChange={v => setNewEmp({...newEmp, role: v})}>
                                    <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Frontend Dev">Frontend Dev</SelectItem>
                                        <SelectItem value="Backend Dev">Backend Dev</SelectItem>
                                        <SelectItem value="Product Manager">Product Manager</SelectItem>
                                        <SelectItem value="Designer">Designer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Department</label>
                                <Select value={newEmp.department} onValueChange={v => setNewEmp({...newEmp, department: v})}>
                                    <SelectTrigger><SelectValue placeholder="Select dept" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Engineering">Engineering</SelectItem>
                                        <SelectItem value="Product">Product</SelectItem>
                                        <SelectItem value="Design">Design</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Annual Salary</label>
                            <Input type="number" value={newEmp.salary} onChange={e => setNewEmp({...newEmp, salary: e.target.value})} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddEmployee} disabled={isSubmitting} className="bg-violet-600 hover:bg-violet-700">
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Onboard Employee'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}