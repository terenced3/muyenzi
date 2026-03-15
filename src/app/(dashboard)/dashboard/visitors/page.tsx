import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Topbar from '@/components/layout/Topbar'
import Link from 'next/link'
import { formatDateTime, formatDuration } from '@/lib/utils/format'
import { Card, CardContent } from '@/components/ui/card'
import type { VisitWithRelations } from '@/types/database'
import ExportMenu from '@/components/shared/ExportMenu'

export const metadata = { title: 'Visitors – Muyenzi' }

export default async function VisitorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; site?: string; status?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('company_id').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const params = await searchParams
  const query = params.q ?? ''
  const siteFilter = params.site ?? ''
  const statusFilter = params.status ?? ''

  let visitsQuery = supabase
    .from('visits')
    .select('*, visitor:visitors(*), site:sites(*), host:users(*)')
    .eq('company_id', profile.company_id)
    .order('created_at', { ascending: false })
    .limit(100)

  if (siteFilter) visitsQuery = visitsQuery.eq('site_id', siteFilter)
  if (statusFilter) visitsQuery = visitsQuery.eq('status', statusFilter)

  const { data: visits } = await visitsQuery
  const { data: sites } = await supabase.from('sites').select('id, name').eq('company_id', profile.company_id)

  const typedVisits = (visits ?? []) as VisitWithRelations[]
  const filtered = query
    ? typedVisits.filter(v =>
        v.visitor.full_name.toLowerCase().includes(query.toLowerCase()) ||
        v.visitor.email?.toLowerCase().includes(query.toLowerCase()) ||
        v.visitor.company_name?.toLowerCase().includes(query.toLowerCase())
      )
    : typedVisits

  const STATUS_LABELS: Record<string, string> = {
    expected: 'Expected', checked_in: 'Checked In', checked_out: 'Checked Out',
    cancelled: 'Cancelled', no_show: 'No Show',
  }
  const STATUS_CLASSES: Record<string, string> = {
    expected: 'bg-blue-50 text-blue-700 border-blue-200',
    checked_in: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    checked_out: 'bg-slate-50 text-slate-700 border-slate-200',
    cancelled: 'bg-red-50 text-red-700 border-red-200',
    no_show: 'bg-orange-50 text-orange-700 border-orange-200',
  }

  return (
    <div className="flex flex-col">
      <Topbar title="Visitors" />
      <div className="p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <form className="flex items-center gap-2 flex-1 min-w-[200px] max-w-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                name="q"
                defaultValue={query}
                placeholder="Search visitors…"
                className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <select
              name="site"
              defaultValue={siteFilter}
              className="text-sm border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="">All sites</option>
              {sites?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select
              name="status"
              defaultValue={statusFilter}
              className="text-sm border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="">All statuses</option>
              {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <Button type="submit" variant="outline" size="sm">Filter</Button>
          </form>
          <div className="flex items-center gap-2 ml-auto">
            <ExportMenu companyId={profile.company_id} />
            <Button asChild>
              <Link href="/dashboard/invitations/new">
                <Plus className="h-4 w-4 mr-2" /> Invite Visitor
              </Link>
            </Button>
          </div>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Users className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="font-semibold text-slate-900 mb-1">No visitors found</h3>
            <p className="text-sm text-slate-500 mb-4">Invite your first visitor to get started.</p>
            <Button asChild><Link href="/dashboard/invitations/new"><Plus className="h-4 w-4 mr-2" />Invite Visitor</Link></Button>
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Visitor</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Host</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Site</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Check In</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Duration</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Code</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filtered.map(visit => (
                      <tr key={visit.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">{visit.visitor.full_name}</p>
                          {visit.visitor.company_name && <p className="text-xs text-slate-500">{visit.visitor.company_name}</p>}
                          {visit.visitor.email && <p className="text-xs text-slate-400">{visit.visitor.email}</p>}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{visit.host?.full_name ?? '—'}</td>
                        <td className="px-4 py-3 text-slate-600">{visit.site.name}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">
                          {visit.check_in_at ? formatDateTime(visit.check_in_at) : '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">
                          {visit.check_in_at && visit.check_out_at
                            ? formatDuration(visit.check_in_at, visit.check_out_at)
                            : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[visit.status]}`}>
                            {STATUS_LABELS[visit.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <code className="text-xs bg-slate-100 rounded px-1.5 py-0.5 font-mono">{visit.access_code}</code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
