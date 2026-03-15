export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatDateTime } from '@/lib/utils/format'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { data: profile } = await supabase.from('users').select('company_id').eq('id', user.id).single()
  if (!profile) return new NextResponse('Forbidden', { status: 403 })

  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const siteId = searchParams.get('site_id')

  let query = supabase
    .from('visits')
    .select('*, visitor:visitors(*), site:sites(*), host:users(full_name)')
    .eq('company_id', profile.company_id)
    .order('created_at', { ascending: false })

  if (from) query = query.gte('visit_date', from)
  if (to) query = query.lte('visit_date', to)
  if (siteId) query = query.eq('site_id', siteId)

  const { data: visits } = await query

  const doc = new jsPDF()
  doc.setFontSize(18)
  doc.text('Visitor Report – Muyenzi', 14, 22)
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30)

  autoTable(doc, {
    startY: 38,
    head: [['Visitor', 'Company', 'Site', 'Host', 'Check In', 'Status']],
    body: (visits ?? []).map((v: any) => [
      v.visitor?.full_name ?? '',
      v.visitor?.company_name ?? '',
      v.site?.name ?? '',
      v.host?.full_name ?? '',
      v.check_in_at ? formatDateTime(v.check_in_at) : '—',
      v.status,
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [15, 23, 42] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  })

  const pdf = doc.output('arraybuffer')

  return new NextResponse(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="muyenzi-report-${new Date().toISOString().split('T')[0]}.pdf"`,
    },
  })
}
