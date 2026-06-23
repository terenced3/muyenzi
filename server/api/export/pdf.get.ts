import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const authUser = await serverSupabaseUser(event).catch(() => null)
  if (!authUser) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const supabase = serverSupabaseServiceRole(event)
  const { data: profile } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', authUser.id)
    .single()

  if (!profile?.company_id) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

  const query = getQuery(event)
  const from = query.from as string | undefined
  const to = query.to as string | undefined
  const siteId = query.site_id as string | undefined

  let q = supabase
    .from('visits')
    .select('*, visitor:visitors(*), site:sites(*), host:users(*)')
    .eq('company_id', profile.company_id)
    .order('visit_date', { ascending: false })
    .limit(1000)

  if (from) q = q.gte('visit_date', from)
  if (to) q = q.lte('visit_date', to)
  if (siteId) q = q.eq('site_id', siteId)

  const { data: visits } = await q

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
