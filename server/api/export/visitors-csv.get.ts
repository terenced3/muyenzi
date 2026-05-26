import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const supabase = createClient(
    config.public.supabaseUrl as string,
    config.supabaseServiceKey as string,
  )

  const query = getQuery(event)
  const companyId = query.company_id as string
  if (!companyId) throw createError({ statusCode: 400, statusMessage: 'company_id required' })

  const { data: visitors } = await supabase
    .from('visitors')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(10000)

  const header = ['Full Name', 'Phone', 'Email', 'Company', 'Created At']
  const rows = (visitors ?? []).map((v: any) => [
    v.full_name ?? '',
    v.phone ?? '',
    v.email ?? '',
    v.company_name ?? '',
    v.created_at ? new Date(v.created_at).toLocaleDateString() : '',
  ])

  const csv = [header, ...rows]
    .map(row => row.map((cell: string) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  setHeader(event, 'Content-Type', 'text/csv')
  setHeader(event, 'Content-Disposition', 'attachment; filename="muyenzi-visitor-list.csv"')
  return csv
})
