'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import {
  Search,
  EyeOff,
  Eye,
  Menu,
  Moon,
  Sun,
  User,
  CreditCard,
  Keyboard,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { GlobalSearch } from '@/components/global-search'
import { toast } from 'sonner'

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { isPrivacyMode, togglePrivacyMode, openSearch } = useAppStore()
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light'
    setTheme(savedTheme)
    document.documentElement.classList.toggle('dark', savedTheme === 'dark')
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  const handlePrivacyToggle = () => {
    togglePrivacyMode()
    toast(isPrivacyMode ? 'Privacy mode disabled' : 'Privacy mode enabled', {
      description: isPrivacyMode ? '' : 'Sensitive numbers are hidden.',
    })
  }

  const handleLogout = () => {
    // 1. Clear all local storage
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('staffdeck-storage') // Clear zustand store if needed
    
    // 2. Show feedback
    toast.success('Logged out successfully')
    
    // 3. Redirect to login
    router.push('/login')
  }

  // Breadcrumb logic
  const breadcrumbs = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean)
    const crumbs = [{ label: 'Home', path: '/dashboard' }]

    segments.forEach((segment, index) => {
      const path = '/' + segments.slice(0, index + 1).join('/')
      const label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')

      if (path !== '/dashboard') crumbs.push({ label, path })
    })

    return crumbs
  }, [pathname])

  return (
    <>
      <header className="sticky top-0 z-40 h-14 border-b bg-background/80 backdrop-blur-md">
        <div className="flex h-full items-center justify-between px-4 md:px-6">
          {/* ... Left side (Breadcrumbs) remains the same ... */}
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 -ml-2 hover:bg-accent rounded-md" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>

            <nav className="flex items-center gap-1 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <div key={`${crumb.path}-${index}`} className="flex items-center gap-1">
                  {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  <span className={index === breadcrumbs.length - 1 ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                    {crumb.label}
                  </span>
                </div>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={openSearch} className="hidden md:flex">
              <Search className="h-5 w-5" />
            </Button>

            <Button variant="ghost" size="icon" onClick={handlePrivacyToggle}>
              {isPrivacyMode ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </Button>

            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {/* User Menu Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </PopoverTrigger>

              <PopoverContent align="end" className="w-56 p-1">
                <button
                  className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
                  onClick={() => router.push('/settings')}
                >
                  <User className="h-4 w-4" />
                  Profile
                </button>

                <button
                  className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
                  onClick={() => router.push('/billing')} // You'll need to create this page if you want it
                >
                  <CreditCard className="h-4 w-4" />
                  Billing
                </button>

                <button
                  className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
                  onClick={() => router.push('/settings')}
                >
                  <Keyboard className="h-4 w-4" />
                  Keyboard Shortcuts
                </button>

                <div className="my-1 h-px bg-border" />

                <button
                  className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </header>

      <GlobalSearch />
    </>
  )
}