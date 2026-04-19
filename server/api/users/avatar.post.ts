import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const authUser = await serverSupabaseUser(event)
  if (!authUser) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const config = useRuntimeConfig()
  const supabase = serverSupabaseServiceRole(event)

  const formData = await readMultipartFormData(event)
  if (!formData) throw createError({ statusCode: 400, statusMessage: 'No file provided' })

  const file = formData.find(f => f.name === 'file')
  if (!file?.data) throw createError({ statusCode: 400, statusMessage: 'No file provided' })

  const contentType = file.type || ''
  if (!contentType.startsWith('image/')) {
    throw createError({ statusCode: 400, statusMessage: 'File must be an image' })
  }
  if (file.data.length > 3 * 1024 * 1024) {
    throw createError({ statusCode: 400, statusMessage: 'File must be under 3MB' })
  }

  const ext = contentType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg'
  const filename = `${authUser.id}/avatar_${Date.now()}.${ext}`

  const storageClient = createClient(
    config.public.supabaseUrl as string,
    config.supabaseServiceKey as string,
  )

  // Remove old avatar files for this user
  const { data: existing } = await storageClient.storage
    .from('user-avatars')
    .list(authUser.id)
  if (existing?.length) {
    await storageClient.storage
      .from('user-avatars')
      .remove(existing.map(f => `${authUser.id}/${f.name}`))
  }

  const { error: uploadError } = await storageClient.storage
    .from('user-avatars')
    .upload(filename, file.data, { contentType, upsert: true })

  if (uploadError) throw createError({ statusCode: 500, statusMessage: uploadError.message })

  const { data: urlData } = storageClient.storage
    .from('user-avatars')
    .getPublicUrl(filename)

  const avatarUrl = urlData.publicUrl

  await supabase.from('users').update({ avatar_url: avatarUrl }).eq('id', authUser.id)

  return { avatar_url: avatarUrl }
})
