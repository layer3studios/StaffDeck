'use client'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function AuthCheck({ children }) {
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        const token = localStorage.getItem('token')

        if (!token && pathname !== '/login') {
            router.push('/login')
        } else if (token && pathname === '/login') {
            router.push('/dashboard')
        }
    }, [pathname, router])

    return children
}
