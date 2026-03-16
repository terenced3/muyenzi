import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users, Plus, Search } from 'lucide-react'
import { Button, Card, CardBody, Input, Chip } from '@heroui/react'
import Topbar from '@/components/layout/Topbar'
import Link from 'next/link'
import { formatDateTime, formatDuration } from '@/lib/utils/format'
import type { VisitWithRelations } from '@/types/database'
import ExportMenu from '@/components/shared/ExportMenu'

export const metadata = { title: 'Visitors – Muyenzi' }

const STATUS_LABELS: Record<string, string> = {
  expected: 'Expected',
  checked_in: 'Checked In',
  checked_out: 'Checked Out',
  cancelled: 'Cancelled',
  no_show: 'No Show',
}

const STATUS_COLORS: Record<string, 'primary' | 'success' | 'default' | 'danger' | 'warning'> = {
  expected: 'primary',
  checked_in: 'success',
  checked_out: 'default',
  cancelled: 'danger',
  no_show: 'warning',
}

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

  return (
    <div className="flex flex-col h-full">
      <Topbar title="Visitors" description="Manage and track all visitor activity" />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <form className="flex items-center gap-3 flex-1 min-w-[200px] max-w-2xl">
            <Input
              name="q"
              defaultValue={query}
              placeholder="Search by name, email or company…"
              radius="lg"
              size="sm"
              variant="bordered"
              startContent={<Search className="h-4 w-4 text-default-400" />}
              classNames={{
                base: 'flex-1',
                inputWrapper: 'bg-content1 border-default-200 hover:border-primary data-[focus=true]:border-primary',
              }}
            />
            <select
              name="site"
              defaultValue={siteFilter}
              className="text-sm rounded-xl px-3 py-2 bg-content1 text-foreground border border-default-200 focus:outline-none focus:border-primary transition-colors"
            >
              <option value="">All sites</option>
              {sites?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select
              name="status"
              defaultValue={statusFilter}
              className="text-sm rounded-xl px-3 py-2 bg-content1 text-foreground border border-default-200 focus:outline-none focus:border-primary transition-colors"
            >
              <option value="">All statuses</option>
              {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <Button type="submit" variant="flat" color="default" size="sm" radius="lg" className="font-semibold">
              Filter
            </Button>
          </form>

          <div className="flex items-center gap-2 ml-auto">
            <ExportMenu companyId={profile.company_id} />
            <Button
              as={Link}
              href="/dashboard/invitations/new"
              color="primary"
              variant="shadow"
              size="sm"
              radius="lg"
              className="font-semibold"
              startContent={<Plus className="h-4 w-4" />}
            >
              Invite Visitor
            </Button>
          </div>
        </div>

        {/* Empty state */}
        {filtered.length === 0 ? (
          <Card shadow="md" radius="lg" className="bg-content1">
            <CardBody className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-16 w-16 rounded-full bg-default-100 flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-default-300" />
              </div>
              <h3 className="font-bold text-foreground text-lg mb-1">No visitors found</h3>
              <p className="text-sm text-default-400 mb-5">Invite your first visitor to get started.</p>
              <Button
                as={Link}
                href="/dashboard/invitations/new"
                color="primary"
                variant="shadow"
                radius="lg"
                className="font-semibold"
                startContent={<Plus className="h-4 w-4" />}
              >
                Invite Visitor
              </Button>
            </CardBody>
          </Card>
        ) : (
          <Card shadow="md" radius="lg" className="bg-content1">
            <CardBody className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-default-50" style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Visitor', 'Host', 'Site', 'Check In', 'Duration', 'Status', 'Code'].map(col => (
                        <th key={col} className="text-left px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-default-400">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((visit, i) => (
                      <tr
                        key={visit.id}
                        className="group hover:bg-default-50 transition-colors"
                        style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {visit.visitor.full_name}
                          </p>
                          {visit.visitor.company_name && (
                            <p className="text-xs text-default-400 mt-0.5">{visit.visitor.company_name}</p>
                          )}
                          {visit.visitor.email && (
                            <p className="text-xs text-default-300">{visit.visitor.email}</p>
                          )}
                        </td>
                        <td className="px-5 py-4 text-default-500">{visit.host?.full_name ?? '—'}</td>
                        <td className="px-5 py-4 text-default-500">{visit.site.name}</td>
                        <td className="px-5 py-4 text-default-400 text-xs whitespace-nowrap">
                          {visit.check_in_at ? formatDateTime(visit.check_in_at) : '—'}
                        </td>
                        <td className="px-5 py-4 text-default-400 text-xs">
                          {visit.check_in_at && visit.check_out_at
                            ? formatDuration(visit.check_in_at, visit.check_out_at)
                            : '—'}
                        </td>
                        <td className="px-5 py-4">
                          <Chip
                            color={STATUS_COLORS[visit.status] ?? 'default'}
                            variant="flat"
                            size="sm"
                            radius="full"
                            classNames={{ content: 'text-xs font-semibold' }}
                          >
                            {STATUS_LABELS[visit.status]}
                          </Chip>
                        </td>
                        <td className="px-5 py-4">
                          <code className="text-xs bg-default-100 text-default-600 rounded-lg px-2.5 py-1 font-mono font-semibold tracking-wider">
                            {visit.access_code}
                          </code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  )
}
