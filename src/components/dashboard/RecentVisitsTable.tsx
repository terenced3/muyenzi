import Link from 'next/link'
import { Chip } from '@heroui/react'
import { formatDateTime } from '@/lib/utils/format'
import type { VisitWithRelations } from '@/types/database'
import { Users } from 'lucide-react'

type StatusKey = 'expected' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show'

const STATUS_CONFIG: Record<StatusKey, { label: string; color: 'primary' | 'success' | 'default' | 'danger' | 'warning' }> = {
  expected:    { label: 'Expected',    color: 'primary' },
  checked_in:  { label: 'Checked In',  color: 'success' },
  checked_out: { label: 'Checked Out', color: 'default' },
  cancelled:   { label: 'Cancelled',   color: 'danger' },
  no_show:     { label: 'No Show',     color: 'warning' },
}

export default function RecentVisitsTable({ visits }: { visits: VisitWithRelations[] }) {
  if (visits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="h-14 w-14 rounded-full bg-default-100 flex items-center justify-center mb-3">
          <Users className="h-7 w-7 text-default-300" />
        </div>
        <p className="text-sm font-semibold text-foreground mb-1">No visits yet today</p>
        <p className="text-xs text-default-400">Visits will appear here as they come in</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {['Visitor', 'Host', 'Site', 'Time', 'Status'].map(col => (
              <th key={col} className="pb-3 text-left text-[11px] font-bold uppercase tracking-widest text-default-400 pr-4">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visits.map((visit, i) => {
            const cfg = STATUS_CONFIG[visit.status as StatusKey] ?? STATUS_CONFIG.expected
            return (
              <tr
                key={visit.id}
                className="group transition-colors"
                style={{
                  borderBottom: i < visits.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <td className="py-3.5 pr-4">
                  <Link
                    href={`/dashboard/visitors/${visit.visitor_id}`}
                    className="font-semibold text-foreground hover:text-primary transition-colors"
                  >
                    {visit.visitor.full_name}
                  </Link>
                  {visit.visitor.company_name && (
                    <p className="text-xs text-default-400 mt-0.5">{visit.visitor.company_name}</p>
                  )}
                </td>
                <td className="py-3.5 pr-4 text-default-500 text-sm">
                  {visit.host?.full_name ?? '—'}
                </td>
                <td className="py-3.5 pr-4 text-default-500 text-sm">
                  {visit.site.name}
                </td>
                <td className="py-3.5 pr-4 text-default-400 text-xs whitespace-nowrap">
                  {visit.check_in_at ? formatDateTime(visit.check_in_at) : formatDateTime(visit.created_at)}
                </td>
                <td className="py-3.5">
                  <Chip
                    color={cfg.color}
                    variant="flat"
                    size="sm"
                    radius="full"
                    classNames={{ content: 'text-xs font-semibold' }}
                  >
                    {cfg.label}
                  </Chip>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
