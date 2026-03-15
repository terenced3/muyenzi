'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Building2, Users, CalendarCheck, BarChart3,
  UserCog, Settings, LogOut, QrCode,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUser } from '@/context/UserContext'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/sites', label: 'Sites', icon: Building2 },
  { href: '/dashboard/visitors', label: 'Visitors', icon: Users },
  { href: '/dashboard/invitations', label: 'Invitations', icon: CalendarCheck },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3, permission: 'view_analytics' as const },
  { href: '/dashboard/users', label: 'Team', icon: UserCog, permission: 'manage_users' as const },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user, can } = useUser()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = user?.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '?'

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b px-6">
        <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center">
          <span className="text-white font-bold text-sm">M</span>
        </div>
        <div>
          <p className="font-semibold text-slate-900 text-sm">muyenzi</p>
          <p className="text-xs text-slate-500 truncate max-w-[140px]">{user?.company?.name}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map(item => {
          if (item.permission && !can(item.permission)) return null
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}

        <div className="pt-2 border-t mt-2">
          <Link
            href="/kiosk"
            target="_blank"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <QrCode className="h-4 w-4 shrink-0" />
            Kiosk Mode
          </Link>
        </div>
      </nav>

      {/* User footer */}
      <div className="border-t p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs bg-slate-200">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{user?.full_name}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
