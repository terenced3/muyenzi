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
  const token = getRouterParam(event, 'token')!

  // Atomic: mark accepted only if not already used and not expired
  const { data: invite } = await supabase
    .from('team_invites')
    .update({ accepted_at: new Date().toISOString() })
    .eq('token', token)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .select('id')
    .maybeSingle()

  if (!invite) {
    throw createError({ statusCode: 410, statusMessage: 'This invite has already been used or has expired' })
  }

  return { ok: true }
})
