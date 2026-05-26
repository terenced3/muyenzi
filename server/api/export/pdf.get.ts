import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const supabase = createClient(
    config.public.supabaseUrl as string,
    config.supabaseServiceKey as string,
  )

  const query = getQuery(event)
  const companyId = query.company_id as string
  const from = query.from as string | undefined
  const to = query.to as string | undefined
  const siteId = query.site_id as string | undefined
  if (!companyId) throw createError({ statusCode: 400, statusMessage: 'company_id required' })

  let q = supabase
    .from('visits')
    .select('*, visitor:visitors(*), site:sites(*), host:users(*)')
    .eq('company_id', companyId)
    .order('visit_date', { ascending: false })
    .limit(1000)

  if (from) q = q.gte('visit_date', from)
  if (to) q = q.lte('visit_date', to)
  if (siteId) q = q.eq('site_id', siteId)

  const { data: visits } = await q

  // Dynamic import to avoid SSR issues
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default

  const doc = new jsPDF()
  doc.setFontSize(18)
  doc.text('Visitor Report', 14, 22)
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30)

  autoTable(doc, {
    startY: 38,
    head: [['Visitor', 'Site', 'Host', 'Status', 'Check In', 'Visit Date']],
    body: (visits ?? []).map((v: any) => [
      v.visitor?.full_name ?? '',
      v.site?.name ?? '',
      v.host?.full_name ?? '',
      v.status ?? '',
      v.check_in_at ? new Date(v.check_in_at).toLocaleString() : '',
      v.visit_date ?? '',
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [99, 102, 241] },
  })

  const buffer = doc.output('arraybuffer')
  setHeader(event, 'Content-Type', 'application/pdf')
  setHeader(event, 'Content-Disposition', 'attachment; filename="muyenzi-visitors.pdf"')
  return new Uint8Array(buffer)
})
