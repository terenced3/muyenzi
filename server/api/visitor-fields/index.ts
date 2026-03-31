import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const config = useRuntimeConfig()
  return createClient(
    config.public.supabaseUrl as string,
    config.supabaseServiceKey as string,
  )
}

// GET  /api/visitor-fields?company_id=...  — list fields
// POST /api/visitor-fields                  — create a field
export default defineEventHandler(async (event) => {
  const supabase = getSupabase()

  if (event.method === 'GET') {
    const query = getQuery(event)
    const companyId = query.company_id as string
    if (!companyId) throw createError({ statusCode: 400, statusMessage: 'company_id required' })

    const { data, error } = await supabase
      .from('visitor_custom_fields')
      .select('*')
      .eq('company_id', companyId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) throw createError({ statusCode: 500, statusMessage: error.message })
    return data
  }

  if (event.method === 'POST') {
    const body = await readBody(event)
    const { company_id, label, field_type, options, required, sort_order } = body

    if (!company_id || !label?.trim() || !field_type) {
      throw createError({ statusCode: 400, statusMessage: 'company_id, label, and field_type are required' })
    }

    const validTypes = ['text', 'number', 'textarea', 'select']
    if (!validTypes.includes(field_type)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid field_type' })
    }

    if (field_type === 'select' && (!Array.isArray(options) || options.length === 0)) {
      throw createError({ statusCode: 400, statusMessage: 'Select fields require at least one option' })
    }

    // Generate a stable key from the label
    const field_key = label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')

    const { data, error } = await supabase
      .from('visitor_custom_fields')
      .insert({
        company_id,
        label: label.trim(),
        field_key,
        field_type,
        options: field_type === 'select' ? options : null,
        required: required ?? false,
        sort_order: sort_order ?? 0,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        throw createError({ statusCode: 409, statusMessage: 'A field with that name already exists' })
      }
      throw createError({ statusCode: 500, statusMessage: error.message })
    }

    return data
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
})
