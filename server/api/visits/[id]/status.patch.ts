import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

const VALID_TRANSITIONS: Record<string, string[]> = {
  expected: ['cancelled', 'no_show'],
  checked_in: ['checked_out'],
}

export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseServiceRole(event)
  const authUser = await serverSupabaseUser(event)
  if (!authUser) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const { data: actor } = await supabase
    .from('users')
    .select('company_id, role, full_name')
    .eq('id', authUser.id)
    .single()

  if (!actor) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

  const visitId = getRouterParam(event, 'id')!
  const { status } = await readBody(event) as { status: string }

  if (!['cancelled', 'no_show', 'checked_out'].includes(status)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid status' })
  }

  // Fetch visit to verify ownership and current state
  const { data: visit } = await supabase
    .from('visits')
    .select('id, status, visitor_id, company_id, visitor:visitors(full_name, phone)')
    .eq('id', visitId)
    .eq('company_id', actor.company_id)
    .single()

  if (!visit) throw createError({ statusCode: 404, statusMessage: 'Visit not found' })

  const allowed = VALID_TRANSITIONS[visit.status] ?? []
  if (!allowed.includes(status)) {
    throw createError({ statusCode: 409, statusMessage: `Cannot change status from '${visit.status}' to '${status}'` })
  }

  const update: Record<string, string> = { status }
  if (status === 'checked_out') update.check_out_at = new Date().toISOString()

  const { error } = await supabase.from('visits').update(update).eq('id', visitId)
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  const ACTION_MAP: Record<string, string> = {
    cancelled: 'visit_cancelled',
    no_show: 'visit_no_show',
    checked_out: 'visit_force_checkout',
  }

  const visitor = Array.isArray(visit.visitor) ? visit.visitor[0] : visit.visitor

  await supabase.from('audit_logs').insert({
    company_id: actor.company_id,
    user_id: authUser.id,
    action: ACTION_MAP[status],
    resource: 'visit',
    metadata: {
      visit_id: visitId,
      visitor_name: visitor?.full_name,
      visitor_phone: visitor?.phone,
      by_name: actor.full_name,
    },
  })

  return { ok: true }
})
