import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const authUser = await serverSupabaseUser(event).catch(() => null)
  if (!authUser) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const supabase = serverSupabaseServiceRole(event)
  const id = getRouterParam(event, 'id')!

  const { data: requester } = await supabase
    .from('users')
    .select('role, company_id, full_name')
    .eq('id', authUser.id)
    .single()

  if (!requester || !['admin', 'site_manager'].includes(requester.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Only admins and site managers can manage the blacklist' })
  }

  const { data: entry } = await supabase
    .from('visitor_blacklist')
    .select('company_id, phone, full_name')
    .eq('id', id)
    .eq('company_id', requester.company_id)
    .single()

  if (!entry) {
    throw createError({ statusCode: 404, statusMessage: 'Blacklist entry not found' })
  }

  const { error } = await supabase.from('visitor_blacklist').delete().eq('id', id)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  await supabase.from('audit_logs').insert({
    company_id: requester.company_id,
    user_id: authUser.id,
    action: 'blacklist_remove',
    resource: 'visitor',
    metadata: {
      phone: entry.phone,
      full_name: entry.full_name,
      by_name: requester.full_name,
    },
  })

  return { ok: true }
})
