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

  const { data: invite } = await supabase
    .from('team_invites')
    .select('*, company:companies(name), inviter:users!team_invites_invited_by_fkey(full_name)')
    .eq('token', token)
    .maybeSingle()

  if (!invite) {
    throw createError({ statusCode: 404, statusMessage: 'Invite not found' })
  }

  if (invite.accepted_at) {
    throw createError({ statusCode: 410, statusMessage: 'This invite has already been used' })
  }

  if (new Date(invite.expires_at) < new Date()) {
    throw createError({ statusCode: 410, statusMessage: 'This invite has expired' })
  }

  return {
    email: invite.email,
    role: invite.role,
    company_name: (invite.company as any)?.name ?? '',
    inviter_name: (invite.inviter as any)?.full_name ?? '',
    expires_at: invite.expires_at,
  }
})
