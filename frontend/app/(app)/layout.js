'use client'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { EmployeeSheet } from '@/components/employee-sheet'

export default function AppLayout({ children }) {
    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />

            <div className="flex flex-1 flex-col overflow-hidden">
                <Header />

                <main className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-950">
                    <div className="container mx-auto p-4 md:p-6">
                        {children}
                    </div>
                </main>
            </div>

            <EmployeeSheet />
        </div>
    )
}
