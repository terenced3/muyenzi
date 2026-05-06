import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

const VALID_ROLES = ['admin', 'site_manager', 'receptionist', 'host']

export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseServiceRole(event)
  const authUser = await serverSupabaseUser(event)
  if (!authUser) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const { data: actor } = await supabase
    .from('users')
    .select('company_id, role, full_name')
    .eq('id', authUser.id)
    .single()

  if (!actor || actor.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Only admins can change roles' })
  }

  const targetId = getRouterParam(event, 'id')!
  if (targetId === authUser.id) {
    throw createError({ statusCode: 400, statusMessage: 'You cannot change your own role here.' })
  }

  const { role } = await readBody(event) as { role: string }
  if (!VALID_ROLES.includes(role)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid role' })
  }

  const { data: target } = await supabase
    .from('users')
    .select('id, full_name, email, role, company_id')
    .eq('id', targetId)
    .eq('company_id', actor.company_id)
    .single()

  if (!target) throw createError({ statusCode: 404, statusMessage: 'User not found' })

  // Guard: if demoting from admin, ensure at least one other active admin remains
  if (target.role === 'admin' && role !== 'admin') {
    const { count } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', actor.company_id)
      .eq('role', 'admin')
      .eq('is_active', true)

    if ((count ?? 0) <= 1) {
      throw createError({ statusCode: 409, statusMessage: 'Cannot demote the last active admin.' })
    }
  }

  const { error } = await supabase.from('users').update({ role }).eq('id', targetId)
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  await supabase.from('audit_logs').insert({
    company_id: actor.company_id,
    user_id: authUser.id,
    action: 'role_change',
    resource: 'user',
    metadata: {
      target_id: targetId,
      target_name: target.full_name,
      target_email: target.email,
      old_role: target.role,
      new_role: role,
      by_name: actor.full_name,
    },
  })

  return { ok: true }
})
