import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="bg-red-100 p-4 rounded-full mb-6">
        <AlertCircle className="h-10 w-10 text-red-600" />
      </div>
      <h2 className="text-3xl font-bold tracking-tight mb-2">Page Not Found</h2>
      <p className="text-muted-foreground mb-8 max-w-[400px]">
        The page you are looking for does not exist or has been moved to another URL.
      </p>
      <Link href="/dashboard">
        <Button className="bg-violet-600 hover:bg-violet-700">
          Return to Dashboard
        </Button>
      </Link>
    </div>
  )
}