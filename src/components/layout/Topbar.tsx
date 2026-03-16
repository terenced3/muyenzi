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
  description?: string
}

export default function Topbar({ onMenuClick, title, description }: TopbarProps) {
  const { notifications, unreadCount, markAllRead } = useNotifications()

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6 shrink-0">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-muted-foreground hover:text-foreground transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          {title && (
            <h1 className="font-semibold text-foreground text-base leading-tight">{title}</h1>
          )}
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger render={
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
            />
          }>
            <Bell className="h-4.5 w-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary ring-2 ring-card" />
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between py-3">
              <span className="font-semibold">Notifications</span>
              {unreadCount > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary border-0">
                    {unreadCount} new
                  </Badge>
                  <button
                    onClick={markAllRead}
                    className="text-xs text-muted-foreground hover:text-foreground font-normal transition-colors"
                  >
                    Mark all read
                  </button>
                </div>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No notifications</p>
              </div>
            ) : (
              notifications.slice(0, 8).map(n => (
                <DropdownMenuItem
                  key={n.id}
                  className={`flex flex-col items-start gap-1 py-3 px-4 cursor-default ${!n.read ? 'bg-primary/5' : ''}`}
                >
                  <div className="flex items-start gap-2 w-full">
                    {!n.read && <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                    <p className={`text-sm flex-1 ${!n.read ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                      {n.message}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground/60 pl-3.5">{formatRelative(n.created_at)}</p>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
