export default defineNuxtRouteMiddleware(async (to) => {
  const supabaseUser = useSupabaseUser()

  const publicPaths = ['/', '/features', '/pricing', '/contact', '/login', '/signup', '/confirm']
  const isPublic =
    publicPaths.includes(to.path) ||
    to.path.startsWith('/kiosk/') ||
    to.path.startsWith('/auth/') ||
    to.path.startsWith('/invite/') ||
    to.path.startsWith('/sign/')

  if (!isPublic && !supabaseUser.value) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }

  if (supabaseUser.value && (to.path === '/login' || to.path === '/signup')) {
    return navigateTo('/dashboard')
  }

  // Block deactivated users — check is_active on dashboard navigation
  if (supabaseUser.value && to.path.startsWith('/dashboard')) {
    const { user } = useUser()
    if (user.value && (user.value as any).is_active === false) {
      const supabase = useSupabaseClient()
      await supabase.auth.signOut()
      return navigateTo('/login?reason=deactivated')
    }
  }
})
