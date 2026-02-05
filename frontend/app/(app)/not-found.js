'use client'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { AlertCircle } from 'lucide-react'

export default function NotFound() {
    const router = useRouter()

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30 mb-4">
                <AlertCircle className="h-8 w-8 text-rose-600 dark:text-rose-400" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight mb-2">Page not found</h1>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
                The page you're looking for doesn't exist or has been moved.
            </p>
            <Button onClick={() => router.push('/dashboard')}>
                Back to Dashboard
            </Button>
        </div>
    )
}
