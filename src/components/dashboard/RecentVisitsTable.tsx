import Link from 'next/link'
import { formatDateTime } from '@/lib/utils/format'
import type { VisitWithRelations } from '@/types/database'
import { Users } from 'lucide-react'

const STATUS_CONFIG = {
  expected:    { label: 'Expected',    class: 'bg-sky-50 text-sky-700 border-sky-200' },
  checked_in:  { label: 'Checked In',  class: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  checked_out: { label: 'Checked Out', class: 'bg-slate-50 text-slate-600 border-slate-200' },
  cancelled:   { label: 'Cancelled',   class: 'bg-red-50 text-red-700 border-red-200' },
  no_show:     { label: 'No Show',     class: 'bg-amber-50 text-amber-700 border-amber-200' },
}

export default function RecentVisitsTable({ visits }: { visits: VisitWithRelations[] }) {
  if (visits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Users className="h-10 w-10 text-muted-foreground/20 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">No visits yet today</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Visits will appear here as they come in</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="pb-3 px-1 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Visitor</th>
            <th className="pb-3 px-1 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Host</th>
            <th className="pb-3 px-1 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Site</th>
            <th className="pb-3 px-1 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Time</th>
            <th className="pb-3 px-1 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {visits.map(visit => {
            const cfg = STATUS_CONFIG[visit.status]
            return (
              <tr key={visit.id} className="hover:bg-muted/40 transition-colors group">
                <td className="py-3 px-1">
                  <Link
                    href={`/dashboard/visitors/${visit.visitor_id}`}
                    className="font-medium text-foreground group-hover:text-primary transition-colors"
                  >
                    {visit.visitor.full_name}
                  </Link>
                  {visit.visitor.company_name && (
                    <p className="text-xs text-muted-foreground mt-0.5">{visit.visitor.company_name}</p>
                  )}
                </td>
                <td className="py-3 px-1 text-muted-foreground">{visit.host?.full_name ?? '—'}</td>
                <td className="py-3 px-1 text-muted-foreground">{visit.site.name}</td>
                <td className="py-3 px-1 text-muted-foreground/70 text-xs whitespace-nowrap">
                  {visit.check_in_at ? formatDateTime(visit.check_in_at) : formatDateTime(visit.created_at)}
                </td>
                <td className="py-3 px-1">
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.class}`}>
                    {cfg.label}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
