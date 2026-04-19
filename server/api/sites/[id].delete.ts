import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseServiceRole(event)
  const authUser = await serverSupabaseUser(event)
  if (!authUser) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const { data: profile } = await supabase
    .from('users')
    .select('company_id, role, full_name, email')
    .eq('id', authUser.id)
    .single()

  if (!profile || !['admin', 'site_manager'].includes(profile.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const id = getRouterParam(event, 'id')

  // Fetch site before deletion for audit metadata
  const { data: site } = await supabase
    .from('sites')
    .select('id, name, address, company_id')
    .eq('id', id)
    .eq('company_id', profile.company_id)
    .single()

  if (!site) throw createError({ statusCode: 404, statusMessage: 'Site not found' })

  // Block deletion if visitors are currently checked in
  const { count } = await supabase
    .from('visits')
    .select('id', { count: 'exact', head: true })
    .eq('site_id', id)
    .eq('status', 'checked_in')

  if (count && count > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: `Cannot delete: ${count} visitor${count !== 1 ? 's' : ''} currently checked in at this site.`,
    })
  }

  const { error } = await supabase.from('sites').delete().eq('id', id)
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  // Audit trail
  await supabase.from('audit_logs').insert({
    company_id: profile.company_id,
    user_id: authUser.id,
    action: 'site_delete',
    resource: 'site',
    metadata: {
      site_id: id,
      site_name: site.name,
      site_address: site.address ?? null,
      deleted_by_name: profile.full_name,
      deleted_by_email: profile.email,
    },
  })

  return { ok: true }
})
