'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ROLE_LABELS } from '@/lib/constants/roles'
import type { UserRole } from '@/types/database'
import { toast } from 'sonner'

const ROLES: UserRole[] = ['admin', 'site_manager', 'receptionist', 'host']

export default function ChangeRoleButton({ userId, currentRole }: { userId: string; currentRole: UserRole }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function change(e: React.ChangeEvent<HTMLSelectElement>) {
    setLoading(true)
    const { error } = await supabase.from('users').update({ role: e.target.value }).eq('id', userId)
    if (error) toast.error(error.message)
    else toast.success('Role updated')
    setLoading(false)
    router.refresh()
  }

  return (
    <select
      defaultValue={currentRole}
      onChange={change}
      disabled={loading}
      className="text-xs border rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:opacity-50"
    >
      {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
    </select>
  )
}
