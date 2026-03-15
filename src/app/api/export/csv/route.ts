import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { unparse } from 'papaparse'
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

  const rows = (visits ?? []).map((v: any) => ({
    'Visitor Name': v.visitor?.full_name ?? '',
    'Visitor Company': v.visitor?.company_name ?? '',
    'Visitor Email': v.visitor?.email ?? '',
    'Visitor Phone': v.visitor?.phone ?? '',
    'Site': v.site?.name ?? '',
    'Host': v.host?.full_name ?? '',
    'Purpose': v.purpose ?? '',
    'Visit Date': v.visit_date,
    'Check In': v.check_in_at ? formatDateTime(v.check_in_at) : '',
    'Check Out': v.check_out_at ? formatDateTime(v.check_out_at) : '',
    'Status': v.status,
    'Access Code': v.access_code,
  }))

  const csv = unparse(rows)

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="muyenzi-visitors-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}
