'use client'
import { useEffect, useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Search, FileText, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import { employeeAPI } from '@/lib/api'

const pages = [
  { label: 'Dashboard', route: '/dashboard' },
  { label: 'Team', route: '/team' },
  { label: 'Payroll', route: '/payroll' },
  { label: 'Schedule', route: '/schedule' },
  { label: 'Documents', route: '/documents' },
  { label: 'Settings', route: '/settings' },
  { label: 'Audit Log', route: '/audit-log' },
]

export function GlobalSearch() {
  const { isSearchOpen, closeSearch, openEmployeeSheet } = useAppStore()
  const [query, setQuery] = useState('')
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!isSearchOpen) {
      setQuery('')
      setEmployees([])
    }
  }, [isSearchOpen])

  useEffect(() => {
    const run = async () => {
      if (!isSearchOpen || !query.trim()) {
        setEmployees([])
        return
      }

      setLoading(true)
      try {
        const res = await employeeAPI.getAll({ search: query, limit: 5, page: 1 })
        const list = res?.data?.data?.employees || []
        setEmployees(list.map(emp => ({
          ...emp,
          id: emp._id,
          name: `${emp.firstName} ${emp.lastName}`
        })))
      } catch {
        setEmployees([])
      } finally {
        setLoading(false)
      }
    }

    const t = setTimeout(run, 250)
    return () => clearTimeout(t)
  }, [query, isSearchOpen])

  const filteredPages = query
    ? pages.filter(p => p.label.toLowerCase().includes(query.toLowerCase()))
    : []

  const handleEmployeeClick = (employeeId) => {
    closeSearch()
    router.push('/team')
    setTimeout(() => openEmployeeSheet(employeeId), 100)
  }

  const handlePageClick = (route) => {
    closeSearch()
    router.push(route)
  }

  return (
    <Dialog open={isSearchOpen} onOpenChange={closeSearch}>
      <DialogContent className="max-w-[640px] p-0">
        <div className="flex items-center border-b px-4 py-3">
          <Search className="h-5 w-5 text-muted-foreground mr-3" />
          <Input
            placeholder="Search employees or pages…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0 px-0"
            autoFocus
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>

        <div className="max-h-[400px] overflow-y-auto p-2">
          {!query && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">Search employees or navigate to pages</p>
            </div>
          )}

          {employees.length > 0 && (
            <div className="mb-4">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Employees</div>
              <div className="space-y-1">
                {employees.map((emp) => (
                  <motion.button
                    key={emp.id}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => handleEmployeeClick(emp.id)}
                    className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-accent transition-colors text-left"
                  >
                    <Avatar src={emp.avatar} alt={emp.name} className="h-8 w-8" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{emp.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{emp.role}</div>
                    </div>
                    <Badge variant="outline" className="text-xs">{emp.department}</Badge>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {filteredPages.length > 0 && (
            <div>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Pages</div>
              <div className="space-y-1">
                {filteredPages.map((p) => (
                  <motion.button
                    key={p.route}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => handlePageClick(p.route)}
                    className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-accent transition-colors text-left"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{p.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
