import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseServiceRole(event)
  const authUser = await serverSupabaseUser(event)
  if (!authUser) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const { data: actor } = await supabase
    .from('users')
    .select('company_id, role')
    .eq('id', authUser.id)
    .single()

  if (!actor || actor.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Only admins can run data cleanup.' })
  }

  const { data, error } = await supabase.rpc('run_retention_cleanup', {
    p_company_id: actor.company_id,
  })

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  const result = data?.[0] ?? { visits_deleted: 0, visitors_deleted: 0 }

  await supabase.from('audit_logs').insert({
    company_id: actor.company_id,
    user_id: authUser.id,
    action: 'retention_cleanup',
    resource: 'system',
    metadata: {
      visits_deleted: result.visits_deleted,
      visitors_deleted: result.visitors_deleted,
    },
  })

  return result
})
