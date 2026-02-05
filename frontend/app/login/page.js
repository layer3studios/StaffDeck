'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { authAPI } from '@/lib/api'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

export default function LoginPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [isRegister, setIsRegister] = useState(false)
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: ''
    })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const response = isRegister
                ? await authAPI.register(formData)
                : await authAPI.login(formData.email, formData.password)

            if (response.data.success) {
                localStorage.setItem('token', response.data.token)
                localStorage.setItem('user', JSON.stringify(response.data.user))

                toast.success(isRegister ? 'Account created successfully' : 'Welcome back!')
                router.push('/dashboard')
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Authentication failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-purple-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-violet-950 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <Card className="shadow-xl">
                    <CardHeader className="text-center space-y-2">
                        <div className="flex justify-center mb-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 text-white font-bold text-2xl shadow-lg">
                                S
                            </div>
                        </div>
                        <CardTitle className="text-2xl">
                            {isRegister ? 'Create Account' : 'Welcome back'}
                        </CardTitle>
                        <CardDescription>
                            {isRegister
                                ? 'Sign up to get started with StaffDeck'
                                : 'Sign in to your StaffDeck account'
                            }
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {isRegister && (
                                <>
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground">First Name</label>
                                        <Input
                                            value={formData.firstName}
                                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                            required
                                            className="mt-1.5"
                                            placeholder="John"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground">Last Name</label>
                                        <Input
                                            value={formData.lastName}
                                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                            required
                                            className="mt-1.5"
                                            placeholder="Doe"
                                        />
                                    </div>
                                </>
                            )}

                            <div>
                                <label className="text-xs font-medium text-muted-foreground">Email</label>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                    className="mt-1.5"
                                    placeholder="you@example.com"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium text-muted-foreground">Password</label>
                                <Input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    className="mt-1.5"
                                    placeholder="••••••••"
                                    minLength={6}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                loading={loading}
                                disabled={loading}
                            >
                                {isRegister ? 'Create Account' : 'Sign In'}
                            </Button>
                        </form>

                        <div className="mt-4 text-center text-sm">
                            <button
                                type="button"
                                onClick={() => setIsRegister(!isRegister)}
                                className="text-violet-600 hover:underline"
                            >
                                {isRegister
                                    ? 'Already have an account? Sign in'
                                    : "Don't have an account? Sign up"
                                }
                            </button>
                        </div>

                        {!isRegister && (
                            <div className="mt-6 p-4 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-200 dark:border-violet-800">
                                <p className="text-xs font-semibold text-violet-900 dark:text-violet-100 mb-2">
                                    Demo Credentials:
                                </p>
                                <p className="text-xs text-violet-700 dark:text-violet-300">
                                    Email: <code className="bg-violet-100 dark:bg-violet-900/40 px-1 py-0.5 rounded">admin@staffdeck.io</code>
                                </p>
                                <p className="text-xs text-violet-700 dark:text-violet-300 mt-1">
                                    Password: <code className="bg-violet-100 dark:bg-violet-900/40 px-1 py-0.5 rounded">admin123</code>
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <p className="text-center text-xs text-muted-foreground mt-6">
                    People ops that feels effortless.
                </p>
            </motion.div>
        </div>
    )
}
