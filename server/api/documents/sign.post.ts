import { serverSupabaseServiceRole } from '#supabase/server'
import { validateSignToken, validateKioskToken } from '~/server/utils/hmac'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const supabase = serverSupabaseServiceRole(event)
  const body = await readBody(event)
  const { template_id, visit_id, visitor_id, company_id, signature_data, pre_signed, sign_token, sign_exp, site_id } = body

  if (!template_id || !visit_id || !visitor_id || !company_id || !signature_data) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required fields' })
  }

  // ── Auth ────────────────────────────────────────────────────────────────────
  if (pre_signed) {
    if (!config.documentSigningSecret || !await validateSignToken(visit_id, sign_token ?? '', config.documentSigningSecret, sign_exp ?? '')) {
      throw createError({ statusCode: 403, statusMessage: 'Invalid or missing sign token' })
    }
  } else {
    const kioskKey = getHeader(event, 'x-kiosk-key') ?? ''
    if (!site_id || !config.appSecret || !await validateKioskToken(site_id, kioskKey, config.appSecret)) {
      throw createError({ statusCode: 403, statusMessage: 'Unauthorized' })
    }
  }

  // ── Single-use check ────────────────────────────────────────────────────────
  const { data: existing } = await supabase
    .from('document_signatures')
    .select('id, signed_at')
    .eq('template_id', template_id)
    .eq('visit_id', visit_id)
    .maybeSingle()

  if (existing?.signed_at) {
    throw createError({ statusCode: 409, statusMessage: 'Document already signed' })
  }

  const now = new Date().toISOString()

  // ── Write ────────────────────────────────────────────────────────────────────
  if (existing) {
    // Row exists with signed_at = null — atomic update guarded by IS NULL
    const { data: updated } = await supabase
      .from('document_signatures')
      .update({ signature_data, signed_at: now, pre_signed: pre_signed ?? false })
      .eq('id', existing.id)
      .is('signed_at', null)
      .select()
      .maybeSingle()

    if (!updated) {
      // 0 rows affected — another request signed between our check and this update
      throw createError({ statusCode: 409, statusMessage: 'Document already signed' })
    }
    try {
      await supabase.from('audit_logs').insert({
        company_id,
        user_id: null,
        action: 'document_signed',
        resource: 'document_signature',
        metadata: { template_id, visit_id, visitor_id, pre_signed: pre_signed ?? false },
      })
    } catch {}
    return updated
  }

  // No row yet — insert fresh
  const { data: inserted, error: insertError } = await supabase
    .from('document_signatures')
    .insert({
      template_id,
      visit_id,
      visitor_id,
      company_id,
      signature_data,
      pre_signed: pre_signed ?? false,
      signed_at: now,
    })
    .select()
    .single()

  if (insertError) {
    // unique_violation (23505) means a concurrent request inserted first
    if (insertError.code === '23505') {
      throw createError({ statusCode: 409, statusMessage: 'Document already signed' })
    }
    throw createError({ statusCode: 500, statusMessage: insertError.message })
  }
  try {
    await supabase.from('audit_logs').insert({
      company_id,
      user_id: null,
      action: 'document_signed',
      resource: 'document_signature',
      metadata: { template_id, visit_id, visitor_id, pre_signed: pre_signed ?? false },
    })
  } catch {}
  return inserted
})
