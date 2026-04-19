import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseServiceRole(event)
  const authUser = await serverSupabaseUser(event)
  if (!authUser) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const { data: profile } = await supabase
    .from('users')
    .select('company_id, role')
    .eq('id', authUser.id)
    .single()

  if (!profile || !['admin', 'site_manager'].includes(profile.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const body = await readBody(event)
  const { name, content, is_active } = body

  if (!name?.trim() || !content?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'name and content are required' })
  }

  const { data, error } = await supabase
    .from('document_templates')
    .insert({
      company_id: profile.company_id,
      name: name.trim(),
      content: content.trim(),
      is_active: is_active ?? true,
      created_by: authUser.id,
    })
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return data
})
