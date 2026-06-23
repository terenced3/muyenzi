import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

// Routes that don't use session-based auth — skip the is_active check
const SKIP_PREFIXES = [
  '/api/kiosk/',
  '/api/documents/sign',
  '/api/documents/presign-info',
  '/api/team-invites/',
]

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event).pathname

  if (!url.startsWith('/api/')) return
  if (SKIP_PREFIXES.some(p => url.startsWith(p))) return

  const authUser = await serverSupabaseUser(event).catch(() => null)
  if (!authUser) return

  const supabase = serverSupabaseServiceRole(event)
  const { data: profile } = await supabase
    .from('users')
    .select('is_active')
    .eq('id', authUser.id)
    .single()

  if (profile && profile.is_active === false) {
    throw createError({ statusCode: 403, statusMessage: 'Account deactivated' })
  }
})
