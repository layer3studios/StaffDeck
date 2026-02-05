'use client'
import { useState, useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { employeeAPI } from '@/lib/api'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from '@/components/ui/sheet'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Copy, MoreVertical, Lock, FileText, Download, Trash2, Loader2 } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast } from 'sonner'

export function EmployeeSheet() {
    const { employeeSheet, closeEmployeeSheet, setEmployeeSheetTab, isPrivacyMode } = useAppStore()
    const { isOpen, activeEmployeeId, activeTab } = employeeSheet

    const [employee, setEmployee] = useState(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (isOpen && activeEmployeeId) {
            const fetchEmployee = async () => {
                setLoading(true)
                try {
                    const response = await employeeAPI.getOne(activeEmployeeId)
                    const data = response.data.data
                    setEmployee({
                        ...data,
                        id: data._id,
                        name: `${data.firstName} ${data.lastName}`
                    })
                } catch (err) {
                    console.error(err)
                    toast.error('Failed to load employee details')
                } finally {
                    setLoading(false)
                }
            }
            fetchEmployee()
        } else {
            setEmployee(null)
        }
    }, [isOpen, activeEmployeeId])

    if (!isOpen) return null

    if (loading) {
        return (
            <Sheet open={isOpen} onOpenChange={closeEmployeeSheet}>
                <SheetContent>
                    <SheetClose onClose={closeEmployeeSheet} />
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
                    </div>
                </SheetContent>
            </Sheet>
        )
    }

    if (!employee && !loading) {
        return (
            <Sheet open={isOpen} onOpenChange={closeEmployeeSheet}>
                <SheetContent>
                    <SheetClose onClose={closeEmployeeSheet} />
                    <div className="flex flex-col items-center justify-center h-full">
                        <p className="text-lg font-semibold mb-2">Employee not found</p>
                        <Button onClick={closeEmployeeSheet}>Back to Team</Button>
                    </div>
                </SheetContent>
            </Sheet>
        )
    }

    const handleCopyId = () => {
        navigator.clipboard.writeText(employee.id)
        toast('Copied to clipboard')
    }

    const statusVariant = {
        'Active': 'success',
        'On Leave': 'warning',
        'Terminated': 'danger'
    }

    return (
        <Sheet open={isOpen} onOpenChange={closeEmployeeSheet}>
            <SheetContent className="sm:max-w-xl w-full">
                <SheetHeader className="mb-6">
                    <div className="flex items-start gap-4">
                        <Avatar src={employee.avatar} alt={employee.name} className="h-16 w-16" />
                        <div className="flex-1 min-w-0">
                            <SheetTitle className="text-xl mb-1">{employee.name}</SheetTitle>
                            <SheetDescription className="text-sm">{employee.role}</SheetDescription>
                            <div className="mt-2">
                                <Badge variant={statusVariant[employee.status]}>{employee.status}</Badge>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={handleCopyId}>
                                <Copy className="h-4 w-4" />
                            </Button>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent align="end" className="w-40 p-1">
                                    <Button variant="ghost" size="sm" className="w-full justify-start font-normal" onClick={() => { toast('Marked (Mock)') }}>
                                        Mark On Leave
                                    </Button>
                                    <Button variant="ghost" size="sm" className="w-full justify-start text-destructive hover:text-destructive font-normal" onClick={() => { toast('Terminated (Mock)') }}>
                                        Terminate
                                    </Button>
                                    <Button variant="ghost" size="sm" className="w-full justify-start text-destructive hover:text-destructive font-normal" onClick={() => { toast('Removed (Mock)') }}>
                                        Remove
                                    </Button>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                </SheetHeader>

                <Tabs value={activeTab} onValueChange={setEmployeeSheetTab} className="w-full">
                    <TabsList className="w-full grid grid-cols-3">
                        <TabsTrigger value="Overview">Overview</TabsTrigger>
                        <TabsTrigger value="Payroll">Payroll</TabsTrigger>
                        <TabsTrigger value="Documents">Documents</TabsTrigger>
                    </TabsList>

                    <TabsContent value="Overview" className="mt-6 space-y-4">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground">Name</label>
                            <Input value={employee.name} className="mt-1.5" readOnly />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground">Email</label>
                            <Input value={employee.email} className="mt-1.5" type="email" readOnly />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground">Role</label>
                            <Input value={employee.role} className="mt-1.5" readOnly />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground">Department</label>
                            <Input value={employee.department} className="mt-1.5" disabled />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground">Employee ID</label>
                            <Input value={employee.id} className="mt-1.5" disabled />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground">Join Date</label>
                            <Input value={formatDate(employee.joinDate)} className="mt-1.5" disabled />
                        </div>
                        <div className="pt-4 flex gap-2">
                            <Button className="flex-1" disabled onClick={() => toast('Edit not implemented yet')}>Save changes</Button>
                            <Button variant="outline" onClick={closeEmployeeSheet}>Close</Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="Payroll" className="mt-6 space-y-4">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground">Annual Salary</label>
                            {isPrivacyMode || employee.salary === null ? (
                                <div className="mt-1.5 flex items-center gap-2 h-9 px-3 rounded-md border bg-muted">
                                    <Lock className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Hidden</span>
                                </div>
                            ) : (
                                <Input value={formatCurrency(employee.salary)} className="mt-1.5" readOnly />
                            )}
                        </div>
                        <div className="p-4 rounded-lg border bg-card">
                            <p className="text-sm text-muted-foreground text-center">Payroll history requires integration with PayrollRun API.</p>
                        </div>
                    </TabsContent>

                    <TabsContent value="Documents" className="mt-6 space-y-4">
                        <div className="p-4 rounded-lg border bg-card">
                            <p className="text-sm text-muted-foreground text-center">No documents found for this employee.</p>
                        </div>
                        <Button className="w-full" variant="outline" onClick={() => toast('Upload dialog opened')}>
                            Upload document
                        </Button>
                    </TabsContent>
                </Tabs>
            </SheetContent>
        </Sheet>
    )
}
