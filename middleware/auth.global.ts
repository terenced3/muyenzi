export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()

  const publicPaths = ['/', '/features', '/pricing', '/contact', '/login', '/signup', '/confirm']
  const isPublic =
    publicPaths.includes(to.path) ||
    to.path.startsWith('/kiosk/') ||
    to.path.startsWith('/auth/')

  if (!isPublic && !user.value) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }

  if (user.value && (to.path === '/login' || to.path === '/signup')) {
    return navigateTo('/dashboard')
  }
})
