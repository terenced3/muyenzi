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
import { Avatar, Button, Chip } from '@heroui/react'

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
    /* Force dark theme for the sidebar via CSS vars — no dark class needed */
    <aside
      className="flex h-full w-64 flex-col"
      style={{
        background: 'linear-gradient(180deg, #13131f 0%, #0f0f1c 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Logo */}
      <div
        className="flex h-16 items-center gap-3 px-5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div
          className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
            boxShadow: '0 0 20px rgba(99,102,241,0.4)',
          }}
        >
          <span className="text-white font-bold text-sm">M</span>
        </div>
        <div className="min-w-0">
          <p className="font-bold text-white text-sm tracking-tight">muyenzi</p>
          <p className="text-xs truncate max-w-[140px]" style={{ color: 'rgba(232,234,255,0.45)' }}>
            {user?.company?.name}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-0.5">
        <p
          className="px-3 pb-3 text-[10px] font-bold uppercase tracking-widest"
          style={{ color: 'rgba(232,234,255,0.3)' }}
        >
          Main Menu
        </p>

        {navItems.map(item => {
          if (item.permission && !can(item.permission)) return null
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                active
                  ? 'text-white'
                  : 'hover:text-white'
              )}
              style={
                active
                  ? {
                      background: 'linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(129,140,248,0.15) 100%)',
                      boxShadow: 'inset 0 0 0 1px rgba(99,102,241,0.3)',
                      color: '#c7d2fe',
                    }
                  : {
                      color: 'rgba(232,234,255,0.5)',
                    }
              }
            >
              <item.icon
                className="h-4 w-4 shrink-0"
                style={{ color: active ? '#818cf8' : 'rgba(232,234,255,0.4)' }}
              />
              <span className="flex-1">{item.label}</span>
              {active && (
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: '#818cf8' }}
                />
              )}
            </Link>
          )
        })}

        <div
          className="pt-4 mt-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p
            className="px-3 pb-3 text-[10px] font-bold uppercase tracking-widest"
            style={{ color: 'rgba(232,234,255,0.3)' }}
          >
            Kiosk
          </p>
          <Link
            href="/kiosk"
            target="_blank"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:text-white"
            style={{ color: 'rgba(232,234,255,0.5)' }}
          >
            <QrCode className="h-4 w-4 shrink-0" style={{ color: 'rgba(232,234,255,0.4)' }} />
            Kiosk Mode
          </Link>
        </div>
      </nav>

      {/* User footer */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '12px' }}>
        <div
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors cursor-default"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        >
          <Avatar
            name={initials}
            size="sm"
            className="shrink-0"
            classNames={{
              base: 'bg-primary/20 text-primary ring-1 ring-primary/30',
              name: 'text-xs font-bold text-primary',
            }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.full_name}</p>
            <p className="text-xs capitalize" style={{ color: 'rgba(232,234,255,0.4)' }}>
              {user?.role?.replace('_', ' ')}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'rgba(232,234,255,0.3)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(232,234,255,0.8)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(232,234,255,0.3)')}
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
