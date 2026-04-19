import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const authUser = await serverSupabaseUser(event)
  if (!authUser) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const config = useRuntimeConfig()
  const supabase = serverSupabaseServiceRole(event)

  const storageClient = createClient(
    config.public.supabaseUrl as string,
    config.supabaseServiceKey as string,
  )

  const { data: existing } = await storageClient.storage
    .from('user-avatars')
    .list(authUser.id)

  if (existing?.length) {
    await storageClient.storage
      .from('user-avatars')
      .remove(existing.map(f => `${authUser.id}/${f.name}`))
  }

  await supabase.from('users').update({ avatar_url: null }).eq('id', authUser.id)

  return { ok: true }
})
