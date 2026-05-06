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
  const body = await readBody(event)
  const { company_id, phone, full_name, reason, created_by } = body

  if (!company_id || !phone || !created_by) {
    throw createError({ statusCode: 400, statusMessage: 'company_id, phone, and created_by are required' })
  }

  // Verify requester is admin or site_manager
  const { data: requester } = await supabase
    .from('users')
    .select('role, company_id')
    .eq('id', created_by)
    .single()

  if (!requester || requester.company_id !== company_id || !['admin', 'site_manager'].includes(requester.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Only admins and site managers can manage the blacklist' })
  }

  const { data, error } = await supabase
    .from('visitor_blacklist')
    .upsert({
      company_id,
      phone: phone.trim(),
      full_name: full_name?.trim() || null,
      reason: reason?.trim() || null,
      created_by,
    }, { onConflict: 'company_id,phone' })
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  await supabase.from('audit_logs').insert({
    company_id,
    user_id: created_by,
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
