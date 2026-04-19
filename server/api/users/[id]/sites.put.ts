import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

// Replace the full set of site assignments for a user
export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseServiceRole(event)
  const authUser = await serverSupabaseUser(event)
  if (!authUser) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const { data: actor } = await supabase
    .from('users')
    .select('company_id, role')
    .eq('id', authUser.id)
    .single()

  if (!actor || !['admin', 'site_manager'].includes(actor.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const targetId = getRouterParam(event, 'id')
  const body = await readBody(event)
  const siteIds: string[] = body.site_ids ?? []

  // Verify target is in same company
  const { data: target } = await supabase
    .from('users')
    .select('id, company_id')
    .eq('id', targetId)
    .eq('company_id', actor.company_id)
    .single()

  if (!target) throw createError({ statusCode: 404, statusMessage: 'User not found' })

  // Replace all assignments atomically: delete existing, insert new
  await supabase
    .from('user_site_assignments')
    .delete()
    .eq('user_id', targetId)
    .eq('company_id', actor.company_id)

  if (siteIds.length > 0) {
    const rows = siteIds.map(site_id => ({
      user_id: targetId,
      site_id,
      company_id: actor.company_id,
    }))
    const { error } = await supabase.from('user_site_assignments').insert(rows)
    if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return { ok: true }
})
