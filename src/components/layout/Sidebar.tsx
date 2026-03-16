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
    <aside className="flex h-full w-64 flex-col bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-5 border-b border-sidebar-border">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-sm">
          <span className="text-primary-foreground font-bold text-sm">M</span>
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sidebar-accent-foreground text-sm tracking-tight">muyenzi</p>
          <p className="text-xs text-sidebar-foreground/60 truncate max-w-[140px]">{user?.company?.name}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
          Main
        </p>
        {navItems.map(item => {
          if (item.permission && !can(item.permission)) return null
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className={cn('h-4 w-4 shrink-0', active ? 'text-primary' : 'text-sidebar-foreground/50')} />
              {item.label}
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </Link>
          )
        })}

        <div className="pt-3 mt-3 border-t border-sidebar-border">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
            Kiosk
          </p>
          <Link
            href="/kiosk"
            target="_blank"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-all duration-150"
          >
            <QrCode className="h-4 w-4 shrink-0 text-sidebar-foreground/50" />
            Kiosk Mode
          </Link>
        </div>
      </nav>

      {/* User footer */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-sidebar-accent/40 transition-colors">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="text-xs bg-primary/20 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-accent-foreground truncate">{user?.full_name}</p>
            <p className="text-xs text-sidebar-foreground/50 capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-sidebar-foreground/40 hover:text-sidebar-foreground/80 transition-colors p-1 rounded"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
