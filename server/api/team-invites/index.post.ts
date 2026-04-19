import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'node:crypto'

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
  const { email, role, company_id, invited_by, invited_by_name, company_name } = body

  if (!email || !role || !company_id || !invited_by) {
    throw createError({ statusCode: 400, statusMessage: 'email, role, company_id, and invited_by are required' })
  }

  const validRoles = ['admin', 'site_manager', 'receptionist', 'host']
  if (!validRoles.includes(role)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid role' })
  }

  // Check if the requester is an admin of that company
  const { data: requester } = await supabase
    .from('users')
    .select('role, company_id')
    .eq('id', invited_by)
    .single()

  if (!requester || requester.company_id !== company_id || requester.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Only admins can invite team members' })
  }

  // Check if this email is already a member
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('company_id', company_id)
    .eq('email', email.toLowerCase().trim())
    .maybeSingle()

  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'This person is already a member of your team' })
  }

  // Delete any existing pending invite for this email + company
  await supabase
    .from('team_invites')
    .delete()
    .eq('company_id', company_id)
    .eq('email', email.toLowerCase().trim())
    .is('accepted_at', null)

  const token = randomBytes(32).toString('hex')

  const { error } = await supabase.from('team_invites').insert({
    company_id,
    email: email.toLowerCase().trim(),
    role,
    token,
    invited_by,
  })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to create invite' })
  }

  // Send the invite email
  await $fetch('/api/email/send-team-invite', {
    method: 'POST',
    body: {
      inviteeEmail: email.toLowerCase().trim(),
      inviterName: invited_by_name,
      companyName: company_name,
      role,
      token,
    },
  }).catch(e => console.warn('Failed to send invite email:', e))

  return { ok: true }
})
