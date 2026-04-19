import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

// Deactivate / reactivate a team member
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
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const targetId = getRouterParam(event, 'id')
  if (targetId === authUser.id) {
    throw createError({ statusCode: 400, statusMessage: 'You cannot modify your own account here.' })
  }

  const body = await readBody(event)
  const { is_active } = body

  if (typeof is_active !== 'boolean') {
    throw createError({ statusCode: 400, statusMessage: 'is_active (boolean) required' })
  }

  // Fetch target before updating
  const { data: target } = await supabase
    .from('users')
    .select('id, full_name, email, role, company_id, is_active')
    .eq('id', targetId)
    .eq('company_id', actor.company_id)
    .single()

  if (!target) throw createError({ statusCode: 404, statusMessage: 'User not found' })

  // Prevent deactivating the last active admin
  if (!is_active && target.role === 'admin') {
    const { count } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', actor.company_id)
      .eq('role', 'admin')
      .eq('is_active', true)

    if ((count ?? 0) <= 1) {
      throw createError({ statusCode: 409, statusMessage: 'Cannot deactivate the last active admin.' })
    }
  }

  const { error } = await supabase
    .from('users')
    .update({ is_active })
    .eq('id', targetId)

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  // Audit trail
  await supabase.from('audit_logs').insert({
    company_id: actor.company_id,
    user_id: authUser.id,
    action: is_active ? 'user_reactivate' : 'user_deactivate',
    resource: 'user',
    metadata: {
      target_id: targetId,
      target_name: target.full_name,
      target_email: target.email,
      by_name: actor.full_name,
    },
  })

  return { ok: true }
})
