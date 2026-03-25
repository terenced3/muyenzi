import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const supabase = createClient(
    config.public.supabaseUrl as string,
    config.supabaseServiceKey as string,
  )

  const siteId = getRouterParam(event, 'siteId')!

  const { data } = await supabase
    .from('sites')
    .select('id, name, address, company_id, company:companies(name, logo_url)')
    .eq('id', siteId)
    .single()

  if (!data) {
    throw createError({ statusCode: 404, statusMessage: 'Site not found' })
  }

  return data
})
