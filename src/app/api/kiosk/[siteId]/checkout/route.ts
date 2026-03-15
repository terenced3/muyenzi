import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const supabase = getSupabase()
  const { siteId } = await params
  const { access_code } = await request.json()

  if (!access_code) {
    return NextResponse.json({ error: 'Access code required' }, { status: 400 })
  }

  const { data: visits, error } = await supabase
    .from('visits')
    .select('*, visitor:visitors(*), site:sites(*)')
    .eq('site_id', siteId)
    .eq('status', 'checked_in')
    .eq('access_code', access_code.toUpperCase().replace('-', ''))
    .limit(1)

  if (error || !visits?.length) {
    return NextResponse.json({ error: 'No active check-in found for this code' }, { status: 404 })
  }

  const visit = visits[0]

  const { data: updated, error: updateError } = await supabase
    .from('visits')
    .update({ status: 'checked_out', check_out_at: new Date().toISOString() })
    .eq('id', visit.id)
    .select('*, visitor:visitors(*), site:sites(*)')
    .single()

  if (updateError) {
    return NextResponse.json({ error: 'Failed to check out' }, { status: 500 })
  }

  return NextResponse.json({ visit: updated })
}
