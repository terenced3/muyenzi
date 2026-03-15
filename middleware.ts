import { type NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase/middleware'

const PUBLIC_PATHS = ['/', '/features', '/pricing', '/contact']
const AUTH_PATHS = ['/login', '/signup']
const KIOSK_PREFIX = '/kiosk'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { supabase, supabaseResponse } = createMiddlewareClient(request)

  // Always refresh the session
  const { data: { user } } = await supabase.auth.getUser()

  // Allow kiosk and public API routes through without auth
  if (pathname.startsWith(KIOSK_PREFIX) || pathname.startsWith('/api/kiosk')) {
    return supabaseResponse
  }

  // Redirect logged-in users away from auth pages
  if (user && AUTH_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard') && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
