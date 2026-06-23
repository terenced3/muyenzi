import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import { generateKioskToken } from '~/server/utils/hmac'

export default defineEventHandler(async (event) => {
  const authUser = await serverSupabaseUser(event).catch(() => null)
  if (!authUser) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const supabase = serverSupabaseServiceRole(event)
  const { data: profile } = await supabase
    .from('users')
    .select('role, company_id')
    .eq('id', authUser.id)
    .single()

  if (!profile || !['admin', 'site_manager'].includes(profile.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Only admins and site managers can generate kiosk tokens' })
  }

  const siteId = getRouterParam(event, 'siteId')!

  // Confirm the site belongs to the requester's company
  const { data: site } = await supabase
    .from('sites')
    .select('id')
    .eq('id', siteId)
    .eq('company_id', profile.company_id)
    .single()

  if (!site) throw createError({ statusCode: 404, statusMessage: 'Site not found' })

  const config = useRuntimeConfig()
  if (!config.appSecret) {
    throw createError({ statusCode: 500, statusMessage: 'APP_SECRET env var is not configured' })
  }

  const token = await generateKioskToken(siteId, config.appSecret)
  return { token }
})
