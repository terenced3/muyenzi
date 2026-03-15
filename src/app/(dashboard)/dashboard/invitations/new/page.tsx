import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Topbar from '@/components/layout/Topbar'
import InvitationForm from '@/components/invitations/InvitationForm'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = { title: 'New Invitation – Muyenzi' }

export default async function NewInvitationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('company_id').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const { data: sites } = await supabase.from('sites').select('id, name').eq('company_id', profile.company_id)
  const { data: hosts } = await supabase.from('users').select('id, full_name').eq('company_id', profile.company_id)

  return (
    <div className="flex flex-col">
      <Topbar title="New Invitation" />
      <div className="p-6 max-w-2xl">
        <Button variant="ghost" size="sm" className="mb-4 -ml-2" asChild>
          <Link href="/dashboard/invitations"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
        </Button>
        <InvitationForm
          companyId={profile.company_id}
          hostId={user.id}
          sites={sites ?? []}
          hosts={hosts ?? []}
        />
      </div>
    </div>
  )
}
