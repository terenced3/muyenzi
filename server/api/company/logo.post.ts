import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const config = useRuntimeConfig()

  // Check authorization
  const supabase = createClient(
    config.public.supabaseUrl as string,
    config.supabaseServiceKey as string,
  )

  const userRecord = await supabase
    .from('users')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  if (!userRecord.data) {
    throw createError({ statusCode: 403, statusMessage: 'Unauthorized' })
  }

  const companyId = userRecord.data.company_id
  const userRole = userRecord.data.role

  // Check if user has permission
  const permissionRoles = ['admin', 'site_manager']
  if (!permissionRoles.includes(userRole)) {
    throw createError({ statusCode: 403, statusMessage: 'You do not have permission to update company logo' })
  }

  // Parse multipart form data
  const formData = await readMultipartFormData(event)

  if (!formData) {
    throw createError({ statusCode: 400, statusMessage: 'No file provided' })
  }

  const file = formData.find(f => f.name === 'file')

  if (!file || !file.data) {
    throw createError({ statusCode: 400, statusMessage: 'No file provided' })
  }

  // Validate file type
  const contentType = file.type || ''
  if (!contentType.startsWith('image/')) {
    throw createError({ statusCode: 400, statusMessage: 'File must be an image' })
  }

  // Validate file size (5MB)
  if (file.data.length > 5 * 1024 * 1024) {
    throw createError({ statusCode: 400, statusMessage: 'File size must be less than 5MB' })
  }

  // Generate unique filename
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 10)
  const ext = contentType.split('/')[1] || 'jpg'
  const filename = `logo_${timestamp}_${randomId}.${ext}`

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('companies-logos')
    .upload(`${companyId}/${filename}`, file.data, {
      contentType,
      upsert: false,
    })

  if (uploadError) {
    console.error('Storage upload error:', uploadError)
    throw createError({ statusCode: 500, statusMessage: 'Failed to upload file' })
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('companies-logos')
    .getPublicUrl(`${companyId}/${filename}`)

  const logoUrl = urlData.publicUrl

  // Update companies table
  const { error: updateError } = await supabase
    .from('companies')
    .update({ logo_url: logoUrl })
    .eq('id', companyId)

  if (updateError) {
    console.error('Database update error:', updateError)
    // Try to clean up uploaded file
    await supabase.storage.from('companies-logos').remove([`${companyId}/${filename}`])
    throw createError({ statusCode: 500, statusMessage: 'Failed to save logo URL' })
  }

  return { logo_url: logoUrl }
})
