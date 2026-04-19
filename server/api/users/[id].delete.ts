import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

// Hard remove — deletes the user from auth.users (cascades to users table)
export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseServiceRole(event)
  const config = useRuntimeConfig()
  const authUser = await serverSupabaseUser(event)
  if (!authUser) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const { data: actor } = await supabase
    .from('users')
    .select('company_id, role, full_name')
    .eq('id', authUser.id)
    .single()

  if (!actor || actor.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Only admins can remove team members.' })
  }

  const targetId = getRouterParam(event, 'id')
  if (targetId === authUser.id) {
    throw createError({ statusCode: 400, statusMessage: 'You cannot remove your own account.' })
  }

  const { data: target } = await supabase
    .from('users')
    .select('id, full_name, email, role, company_id')
    .eq('id', targetId)
    .eq('company_id', actor.company_id)
    .single()

  if (!target) throw createError({ statusCode: 404, statusMessage: 'User not found' })

  // Guard last admin
  if (target.role === 'admin') {
    const { count } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', actor.company_id)
      .eq('role', 'admin')
      .eq('is_active', true)

    if ((count ?? 0) <= 1) {
      throw createError({ statusCode: 409, statusMessage: 'Cannot remove the last admin.' })
    }
  }

  // Write audit record BEFORE deletion (user row will be gone after)
  await supabase.from('audit_logs').insert({
    company_id: actor.company_id,
    user_id: authUser.id,
    action: 'user_remove',
    resource: 'user',
    metadata: {
      removed_id: targetId,
      removed_name: target.full_name,
      removed_email: target.email,
      removed_role: target.role,
      by_name: actor.full_name,
    },
  })

  // Delete from auth.users via admin API (cascades to users table)
  const { createClient } = await import('@supabase/supabase-js')
  const adminClient = createClient(
    config.public.supabaseUrl as string,
    config.supabaseServiceKey as string,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
  const { error } = await adminClient.auth.admin.deleteUser(targetId)
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return { ok: true }
})
