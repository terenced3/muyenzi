import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils/format'
import type { VisitWithRelations } from '@/types/database'

const STATUS_CONFIG = {
  expected:    { label: 'Expected',    class: 'bg-blue-50 text-blue-700 border-blue-200' },
  checked_in:  { label: 'Checked In',  class: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  checked_out: { label: 'Checked Out', class: 'bg-slate-50 text-slate-700 border-slate-200' },
  cancelled:   { label: 'Cancelled',   class: 'bg-red-50 text-red-700 border-red-200' },
  no_show:     { label: 'No Show',     class: 'bg-orange-50 text-orange-700 border-orange-200' },
}

export default function RecentVisitsTable({ visits }: { visits: VisitWithRelations[] }) {
  if (visits.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-slate-500">
        No visits yet today.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-slate-500">
            <th className="pb-3 font-medium">Visitor</th>
            <th className="pb-3 font-medium">Host</th>
            <th className="pb-3 font-medium">Site</th>
            <th className="pb-3 font-medium">Time</th>
            <th className="pb-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {visits.map(visit => {
            const cfg = STATUS_CONFIG[visit.status]
            return (
              <tr key={visit.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-3">
                  <Link href={`/dashboard/visitors/${visit.visitor_id}`} className="font-medium text-slate-900 hover:underline">
                    {visit.visitor.full_name}
                  </Link>
                  {visit.visitor.company_name && (
                    <p className="text-xs text-slate-500">{visit.visitor.company_name}</p>
                  )}
                </td>
                <td className="py-3 text-slate-600">{visit.host?.full_name ?? '—'}</td>
                <td className="py-3 text-slate-600">{visit.site.name}</td>
                <td className="py-3 text-slate-500">
                  {visit.check_in_at ? formatDateTime(visit.check_in_at) : formatDateTime(visit.created_at)}
                </td>
                <td className="py-3">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.class}`}>
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
