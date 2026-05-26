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
    .limit(5000)

  if (from) q = q.gte('visit_date', from)
  if (to) q = q.lte('visit_date', to)
  if (siteId) q = q.eq('site_id', siteId)

  const { data: visits } = await q

  const rows = (visits ?? []).map((v: any) => [
    v.visitor?.full_name ?? '',
    v.visitor?.email ?? '',
    v.visitor?.company_name ?? '',
    v.site?.name ?? '',
    v.host?.full_name ?? '',
    v.status ?? '',
    v.check_in_at ?? '',
    v.check_out_at ?? '',
    v.access_code ?? '',
    v.visit_date ?? '',
  ])

  const header = ['Visitor Name', 'Email', 'Company', 'Site', 'Host', 'Status', 'Check In', 'Check Out', 'Access Code', 'Visit Date']
  const csv = [header, ...rows].map(row => row.map((cell: string) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')

  setHeader(event, 'Content-Type', 'text/csv')
  setHeader(event, 'Content-Disposition', 'attachment; filename="muyenzi-visitors.csv"')
  return csv
})
