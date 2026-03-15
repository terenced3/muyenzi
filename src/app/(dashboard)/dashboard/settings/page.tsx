'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Topbar from '@/components/layout/Topbar'
import { useUser } from '@/context/UserContext'
import { toast } from 'sonner'

const companySchema = z.object({ name: z.string().min(2) })
const profileSchema = z.object({ full_name: z.string().min(2) })

export default function SettingsPage() {
  const { user, refresh } = useUser()
  const supabase = createClient()

  const companyForm = useForm({ resolver: zodResolver(companySchema) })
  const profileForm = useForm({ resolver: zodResolver(profileSchema) })

  useEffect(() => {
    if (user) {
      companyForm.reset({ name: user.company?.name ?? '' })
      profileForm.reset({ full_name: user.full_name })
    }
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  async function saveCompany(data: { name: string }) {
    await supabase.from('companies').update({ name: data.name }).eq('id', user!.company_id)
    toast.success('Company name updated')
    refresh()
  }

  async function saveProfile(data: { full_name: string }) {
    await supabase.from('users').update({ full_name: data.full_name }).eq('id', user!.id)
    toast.success('Profile updated')
    refresh()
  }

  return (
    <div className="flex flex-col">
      <Topbar title="Settings" />
      <div className="p-6 max-w-2xl space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Company Settings</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={companyForm.handleSubmit(saveCompany)} className="space-y-4">
              <div className="space-y-2">
                <Label>Company name</Label>
                <Input {...companyForm.register('name')} />
              </div>
              <Button type="submit" disabled={companyForm.formState.isSubmitting}>Save</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">My Profile</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={profileForm.handleSubmit(saveProfile)} className="space-y-4">
              <div className="space-y-2">
                <Label>Full name</Label>
                <Input {...profileForm.register('full_name')} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email ?? ''} disabled className="bg-slate-50" />
                <p className="text-xs text-slate-500">Email cannot be changed here</p>
              </div>
              <Button type="submit" disabled={profileForm.formState.isSubmitting}>Save</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
