import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const config = useRuntimeConfig()

  // Check authorization
  const supabase = createClient(
    config.public.supabaseUrl as string,
    config.supabaseServiceKey as string,
  )

  const userRecord = await supabase
    .from('users')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  if (!userRecord.data) {
    throw createError({ statusCode: 403, statusMessage: 'Unauthorized' })
  }

  const companyId = userRecord.data.company_id
  const userRole = userRecord.data.role

  // Check if user has permission
  const permissionRoles = ['admin', 'site_manager']
  if (!permissionRoles.includes(userRole)) {
    throw createError({ statusCode: 403, statusMessage: 'You do not have permission to update company logo' })
  }

  // Update companies table to remove logo
  const { error } = await supabase
    .from('companies')
    .update({ logo_url: null })
    .eq('id', companyId)

  if (error) {
    console.error('Database update error:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to remove logo' })
  }

  return { success: true }
})
