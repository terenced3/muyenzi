import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Plus, CalendarCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Topbar from '@/components/layout/Topbar'
import Link from 'next/link'
import { formatDate, formatDateTime } from '@/lib/utils/format'
import { Card, CardContent } from '@/components/ui/card'
import type { VisitWithRelations } from '@/types/database'

export const metadata = { title: 'Invitations – Muyenzi' }

export default async function InvitationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('company_id').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const { data: visits } = await supabase
    .from('visits')
    .select('*, visitor:visitors(*), site:sites(*), host:users(*)')
    .eq('company_id', profile.company_id)
    .in('status', ['expected'])
    .gte('visit_date', new Date().toISOString().split('T')[0])
    .order('visit_date', { ascending: true })
    .limit(50)

  const typedVisits = (visits ?? []) as VisitWithRelations[]

  return (
    <div className="flex flex-col">
      <Topbar title="Invitations" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">{typedVisits.length} upcoming invitation{typedVisits.length !== 1 ? 's' : ''}</p>
          <Button asChild>
            <Link href="/dashboard/invitations/new">
              <Plus className="h-4 w-4 mr-2" /> New Invitation
            </Link>
          </Button>
        </div>

        {typedVisits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <CalendarCheck className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="font-semibold text-slate-900 mb-1">No upcoming invitations</h3>
            <p className="text-sm text-slate-500 mb-4">Pre-register a visitor to send them a QR code and access code.</p>
            <Button asChild><Link href="/dashboard/invitations/new"><Plus className="h-4 w-4 mr-2" />New Invitation</Link></Button>
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Visitor</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Host</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Site</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Visit Date</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Access Code</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {typedVisits.map(visit => (
                    <tr key={visit.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{visit.visitor.full_name}</p>
                        {visit.visitor.email && <p className="text-xs text-slate-500">{visit.visitor.email}</p>}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{visit.host?.full_name ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{visit.site.name}</td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(visit.visit_date)}</td>
                      <td className="px-4 py-3">
                        <code className="text-xs bg-slate-100 rounded px-1.5 py-0.5 font-mono font-semibold">{visit.access_code}</code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
