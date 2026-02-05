import { cn, getInitials } from '@/lib/utils'
import Image from 'next/image'
import { useState } from 'react'

export function Avatar({ src, alt, fallback, className }) {
    const [imageError, setImageError] = useState(false)

    return (
        <div className={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted', className)}>
            {src && !imageError ? (
                <Image
                    src={src}
                    alt={alt || 'Avatar'}
                    fill
                    className="object-cover"
                    onError={() => setImageError(true)}
                />
            ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary/10 text-xs font-semibold text-primary">
                    {fallback || getInitials(alt)}
                </div>
            )}
        </div>
    )
}
