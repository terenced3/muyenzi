import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const authUser = await serverSupabaseUser(event).catch(() => null)
  if (!authUser) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const supabase = serverSupabaseServiceRole(event)

  const { data: requester } = await supabase
    .from('users')
    .select('role, company_id')
    .eq('id', authUser.id)
    .single()

  if (!requester || !['admin', 'site_manager'].includes(requester.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Only admins and site managers can manage the blacklist' })
  }

  const body = await readBody(event)
  const { phone, full_name, reason } = body

  if (!phone) {
    throw createError({ statusCode: 400, statusMessage: 'phone is required' })
  }

  const { data, error } = await supabase
    .from('visitor_blacklist')
    .upsert({
      company_id: requester.company_id,
      phone: phone.trim(),
      full_name: full_name?.trim() || null,
      reason: reason?.trim() || null,
      created_by: authUser.id,
    }, { onConflict: 'company_id,phone' })
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  await supabase.from('audit_logs').insert({
    company_id: requester.company_id,
    user_id: authUser.id,
    action: 'blacklist_add',
    resource: 'visitor',
    metadata: {
      phone: phone.trim(),
      full_name: full_name?.trim() || null,
      reason: reason?.trim() || null,
    },
  })

  return data
})
