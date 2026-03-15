'use client'

import { Bell, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useNotifications } from '@/hooks/useNotifications'
import { formatRelative } from '@/lib/utils/format'

interface TopbarProps {
  onMenuClick?: () => void
  title?: string
}

export default function Topbar({ onMenuClick, title }: TopbarProps) {
  const { notifications, unreadCount, markAllRead } = useNotifications()

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-slate-500 hover:text-slate-900"
        >
          <Menu className="h-5 w-5" />
        </button>
        {title && <h1 className="font-semibold text-slate-900">{title}</h1>}
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="relative" />}>
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                variant="destructive"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              Notifications
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-slate-500 hover:text-slate-900 font-normal">
                  Mark all read
                </button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="py-6 text-center text-sm text-slate-500">No notifications</div>
            ) : (
              notifications.slice(0, 8).map(n => (
                <DropdownMenuItem key={n.id} className={`flex flex-col items-start gap-1 py-3 ${!n.read ? 'bg-slate-50' : ''}`}>
                  <p className={`text-sm ${!n.read ? 'font-medium' : ''}`}>{n.message}</p>
                  <p className="text-xs text-slate-500">{formatRelative(n.created_at)}</p>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
