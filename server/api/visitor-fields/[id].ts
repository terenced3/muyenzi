import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const config = useRuntimeConfig()
  return createClient(
    config.public.supabaseUrl as string,
    config.supabaseServiceKey as string,
  )
}

// PUT    /api/visitor-fields/:id  — update
// DELETE /api/visitor-fields/:id  — delete
export default defineEventHandler(async (event) => {
  const supabase = getSupabase()
  const id = getRouterParam(event, 'id')!

  if (event.method === 'PUT') {
    const body = await readBody(event)
    const { label, field_type, options, required, sort_order } = body

    const updates: Record<string, unknown> = {}
    if (label !== undefined) updates.label = label.trim()
    if (field_type !== undefined) updates.field_type = field_type
    if (options !== undefined) updates.options = options
    if (required !== undefined) updates.required = required
    if (sort_order !== undefined) updates.sort_order = sort_order

    if (updates.label) {
      updates.field_key = (updates.label as string).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
    }

    const { data, error } = await supabase
      .from('visitor_custom_fields')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw createError({ statusCode: 500, statusMessage: error.message })
    return data
  }

  if (event.method === 'DELETE') {
    const { error } = await supabase
      .from('visitor_custom_fields')
      .delete()
      .eq('id', id)

    if (error) throw createError({ statusCode: 500, statusMessage: error.message })
    return { success: true }
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
})
