import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Topbar from '@/components/layout/Topbar'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ROLE_LABELS } from '@/lib/constants/roles'
import type { UserRole } from '@/types/database'
import ChangeRoleButton from './ChangeRoleButton'

export const metadata = { title: 'Team – Muyenzi' }

export default async function UsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('company_id, role').eq('id', user.id).single()
  if (!profile) redirect('/login')
  if (profile.role !== 'admin') redirect('/dashboard')

  const { data: users } = await supabase
    .from('users')
    .select('*')
    .eq('company_id', profile.company_id)
    .order('created_at', { ascending: true })

  const ROLE_COLORS: Record<UserRole, string> = {
    admin: 'bg-purple-50 text-purple-700 border-purple-200',
    site_manager: 'bg-blue-50 text-blue-700 border-blue-200',
    receptionist: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    host: 'bg-slate-50 text-slate-700 border-slate-200',
  }

  return (
    <div className="flex flex-col">
      <Topbar title="Team" />
      <div className="p-6 space-y-4">
        <p className="text-sm text-slate-500">{users?.length ?? 0} team member{users?.length !== 1 ? 's' : ''}</p>
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Member</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(users ?? []).map(u => {
                  const initials = u.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?'
                  return (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-slate-200">{initials}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-slate-900">{u.full_name}</span>
                          {u.id === user.id && <span className="text-xs text-slate-400">(you)</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[u.role as UserRole]}`}>
                          {ROLE_LABELS[u.role as UserRole]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {u.id !== user.id && (
                          <ChangeRoleButton userId={u.id} currentRole={u.role as UserRole} />
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
