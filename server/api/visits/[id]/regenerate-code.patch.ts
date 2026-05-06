import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseServiceRole(event)
  const authUser = await serverSupabaseUser(event)
  if (!authUser) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const { data: actor } = await supabase
    .from('users')
    .select('company_id, role, full_name')
    .eq('id', authUser.id)
    .single()

  if (!actor || !['admin', 'site_manager'].includes(actor.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Only admins and site managers can regenerate access codes' })
  }

  const visitId = getRouterParam(event, 'id')!
  const { resend } = (await readBody(event)) as { resend?: boolean }

  const { data: visit } = await supabase
    .from('visits')
    .select('id, status, site_id, access_code, visitor:visitors(full_name, email, phone), site:sites(name)')
    .eq('id', visitId)
    .eq('company_id', actor.company_id)
    .single()

  if (!visit) throw createError({ statusCode: 404, statusMessage: 'Visit not found' })
  if (visit.status !== 'expected') {
    throw createError({ statusCode: 409, statusMessage: 'Access codes can only be regenerated for expected visits' })
  }

  const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const arr = new Uint32Array(6)
  crypto.getRandomValues(arr)
  const newCode = Array.from(arr).map(v => CHARS[v % CHARS.length]).join('')
  const newQrData = JSON.stringify({ accessCode: newCode, siteId: visit.site_id })
  const oldCode = visit.access_code

  const { error } = await supabase
    .from('visits')
    .update({ access_code: newCode, qr_code_data: newQrData })
    .eq('id', visitId)

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  const visitor = Array.isArray(visit.visitor) ? visit.visitor[0] : visit.visitor
  const site = Array.isArray(visit.site) ? visit.site[0] : visit.site

  await supabase.from('audit_logs').insert({
    company_id: actor.company_id,
    user_id: authUser.id,
    action: 'code_regenerated',
    resource: 'visit',
    metadata: {
      visit_id: visitId,
      visitor_name: visitor?.full_name,
      old_code: oldCode,
      new_code: newCode,
      by_name: actor.full_name,
    },
  })

  if (resend && visitor?.email) {
    const { data: docs } = await supabase
      .from('document_templates')
      .select('id, is_active')
      .eq('company_id', actor.company_id)

    const hasDocuments = (docs ?? []).some((d: any) => d.is_active !== false)

    await $fetch('/api/email/send-invitation', {
      method: 'POST',
      body: {
        visitorEmail: visitor.email,
        visitorName: visitor.full_name,
        siteName: site?.name ?? 'your site',
        companyName: 'your office',
        accessCode: newCode,
        qrCodeData: newQrData,
        visitId,
        hasDocuments,
      },
    }).catch(e => console.warn('[regenerate-code] Failed to resend invitation email:', e))
  }

  return {
    access_code: newCode,
    qr_code_data: newQrData,
    visitor_email: visitor?.email ?? null,
  }
})
