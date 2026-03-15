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
  const body = await request.json()
  const { access_code, qr_data } = body

  // Walk-in: create visitor + visit on the spot
  if (body.walk_in) {
    const { data: visitor } = await supabase
      .from('visitors')
      .insert({
        company_id: body.company_id,
        full_name: body.name,
        email: body.email || null,
        company_name: body.company || null,
      })
      .select()
      .single()

    if (!visitor) return NextResponse.json({ error: 'Failed to create visitor' }, { status: 500 })

    const { generateAccessCode } = await import('@/lib/utils/access-code')
    const accessCode = generateAccessCode()
    const { data: newVisit } = await supabase
      .from('visits')
      .insert({
        company_id: body.company_id,
        site_id: siteId,
        visitor_id: visitor.id,
        purpose: body.purpose || null,
        status: 'checked_in',
        check_in_at: new Date().toISOString(),
        access_code: accessCode,
        qr_code_data: JSON.stringify({ accessCode, siteId }),
        visit_date: new Date().toISOString().split('T')[0],
      })
      .select('*, visitor:visitors(*), site:sites(*), host:users(*)')
      .single()

    return NextResponse.json({ visit: newVisit })
  }

  let visitQuery = supabase
    .from('visits')
    .select('*, visitor:visitors(*), host:users(*), site:sites(*)')
    .eq('site_id', siteId)
    .eq('status', 'expected')

  if (access_code) {
    visitQuery = visitQuery.eq('access_code', access_code.toUpperCase().replace('-', ''))
  } else if (qr_data) {
    try {
      const parsed = JSON.parse(qr_data)
      visitQuery = visitQuery.eq('access_code', parsed.accessCode)
    } catch {
      return NextResponse.json({ error: 'Invalid QR code' }, { status: 400 })
    }
  } else {
    return NextResponse.json({ error: 'Access code or QR data required' }, { status: 400 })
  }

  const { data: visits, error } = await visitQuery.limit(1)

  if (error || !visits?.length) {
    return NextResponse.json({ error: 'Visit not found or already checked in' }, { status: 404 })
  }

  const visit = visits[0]

  const { data: updated, error: updateError } = await supabase
    .from('visits')
    .update({ status: 'checked_in', check_in_at: new Date().toISOString() })
    .eq('id', visit.id)
    .select('*, visitor:visitors(*), host:users(*), site:sites(*)')
    .single()

  if (updateError) {
    return NextResponse.json({ error: 'Failed to check in' }, { status: 500 })
  }

  // Notify host
  if (visit.host_id) {
    await supabase.from('notifications').insert({
      user_id: visit.host_id,
      company_id: visit.company_id,
      type: 'visitor_arrived',
      message: `${visit.visitor.full_name} has arrived at ${visit.site.name}`,
    })
  }

  return NextResponse.json({ visit: updated })
}
