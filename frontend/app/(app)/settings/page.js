'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building2, Moon, Eye, User, CreditCard, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { settingsAPI, authAPI, billingAPI } from '@/lib/api'
import { useAppStore } from '@/store/useAppStore'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

export default function SettingsPage() {
  const { isPrivacyMode, togglePrivacyMode } = useAppStore()
  const [loading, setLoading] = useState(true)
  
  // State
  const [orgSettings, setOrgSettings] = useState({ name: '', domain: '', timezone: '' })
  const [userProfile, setUserProfile] = useState({ firstName: '', lastName: '', email: '' })
  const [billing, setBilling] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [orgRes, userRes, billingRes] = await Promise.allSettled([
            settingsAPI.get(),
            authAPI.getMe(),
            billingAPI.getDetails()
        ])

        if (orgRes.status === 'fulfilled') setOrgSettings(orgRes.value.data.data)
        if (userRes.status === 'fulfilled') setUserProfile(userRes.value.data.user)
        if (billingRes.status === 'fulfilled') setBilling(billingRes.value.data.data)

      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleOrgSave = async () => {
    try {
        await settingsAPI.update(orgSettings)
        toast.success('Organization settings saved')
    } catch(e) { toast.error('Failed to save') }
  }

  const handleProfileSave = async () => {
    try {
        await authAPI.updateProfile(userProfile)
        toast.success('Profile updated')
    } catch(e) { toast.error('Failed to update profile') }
  }

  if (loading) return <div className="flex justify-center h-96 items-center"><Loader2 className="animate-spin text-violet-600" /></div>

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your organization and account</p>
      </div>

      <Tabs defaultValue="general" className="max-w-3xl">
        <TabsList className="mb-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        {/* ORG SETTINGS */}
        <TabsContent value="general" className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-violet-600" /> Organization</CardTitle>
                    <CardDescription>Manage organization details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-xs font-medium text-muted-foreground">Name</label>
                        <Input value={orgSettings.name} onChange={e => setOrgSettings({...orgSettings, name: e.target.value})} className="mt-1.5" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground">Domain</label>
                        <Input value={orgSettings.domain} onChange={e => setOrgSettings({...orgSettings, domain: e.target.value})} className="mt-1.5" />
                    </div>
                    <Button onClick={handleOrgSave}>Save Changes</Button>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5 text-violet-600" /> Preferences</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium">Privacy Mode</div>
                            <div className="text-xs text-muted-foreground">Hide sensitive numbers</div>
                        </div>
                        <input type="checkbox" checked={isPrivacyMode} onChange={togglePrivacyMode} className="accent-violet-600 h-5 w-5" />
                    </div>
                </CardContent>
            </Card>
        </TabsContent>

        {/* PROFILE SETTINGS */}
        <TabsContent value="profile">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-violet-600" /> Your Profile</CardTitle>
                    <CardDescription>Update your personal information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground">First Name</label>
                            <Input value={userProfile.firstName} onChange={e => setUserProfile({...userProfile, firstName: e.target.value})} className="mt-1.5" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground">Last Name</label>
                            <Input value={userProfile.lastName} onChange={e => setUserProfile({...userProfile, lastName: e.target.value})} className="mt-1.5" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground">Email</label>
                        <Input value={userProfile.email} onChange={e => setUserProfile({...userProfile, email: e.target.value})} className="mt-1.5" />
                    </div>
                    <Button onClick={handleProfileSave}>Update Profile</Button>
                </CardContent>
            </Card>
        </TabsContent>

        {/* BILLING SETTINGS */}
        <TabsContent value="billing">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-violet-600" /> Subscription</CardTitle>
                    <CardDescription>Manage your plan and payment method</CardDescription>
                </CardHeader>
                <CardContent>
                    {billing ? (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                                <div>
                                    <div className="font-semibold text-lg">{billing.plan}</div>
                                    <div className="text-sm text-muted-foreground">
                                        Next billing: {new Date(billing.nextBillingDate).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="text-xl font-bold">${billing.amount / 100}/mo</div>
                            </div>
                            
                            <div>
                                <div className="text-sm font-medium mb-3">Payment Method</div>
                                <div className="flex items-center gap-3 p-3 border rounded-md">
                                    <div className="uppercase font-bold text-xs bg-slate-200 px-2 py-1 rounded">{billing.paymentMethod.brand}</div>
                                    <div className="text-sm">•••• •••• •••• {billing.paymentMethod.last4}</div>
                                </div>
                            </div>

                            <Button variant="outline" className="w-full">Update Payment Method</Button>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">Unable to load billing details</div>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}