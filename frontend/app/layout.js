import './globals.css'
import { Toaster } from '@/components/ui/toaster'

export const metadata = {
    title: 'StaffDeck - People ops that feels effortless.',
    description: 'HR SaaS Application for modern teams',
}

export default function RootLayout({ children }) {
    return (
        <html lang="en" suppressHydrationWarning>
            
            <body suppressHydrationWarning={true}> 
                {children}
                <Toaster />
            </body>
        </html>
    )
}