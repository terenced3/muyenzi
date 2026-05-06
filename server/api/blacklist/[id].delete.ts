import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const config = useRuntimeConfig()
  return createClient(
    config.public.supabaseUrl as string,
    config.supabaseServiceKey as string,
  )
}

export default defineEventHandler(async (event) => {
  const supabase = getSupabase()
  const id = getRouterParam(event, 'id')!
  const query = getQuery(event)
  const requesterId = query.requested_by as string

  if (!requesterId) {
    throw createError({ statusCode: 400, statusMessage: 'requested_by is required' })
  }

  // Fetch the blacklist entry to get its company_id and details for audit
  const { data: entry } = await supabase
    .from('visitor_blacklist')
    .select('company_id, phone, full_name')
    .eq('id', id)
    .single()

  if (!entry) {
    throw createError({ statusCode: 404, statusMessage: 'Blacklist entry not found' })
  }

  // Verify requester is admin or site_manager of that company
  const { data: requester } = await supabase
    .from('users')
    .select('role, company_id, full_name')
    .eq('id', requesterId)
    .single()

  if (!requester || requester.company_id !== entry.company_id || !['admin', 'site_manager'].includes(requester.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Only admins and site managers can manage the blacklist' })
  }

  const { error } = await supabase.from('visitor_blacklist').delete().eq('id', id)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  await supabase.from('audit_logs').insert({
    company_id: entry.company_id,
    user_id: requesterId,
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
