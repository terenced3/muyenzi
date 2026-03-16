'use client'

import { Bell } from 'lucide-react'
import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Badge,
} from '@heroui/react'
import { useNotifications } from '@/hooks/useNotifications'
import { formatRelative } from '@/lib/utils/format'

interface TopbarProps {
  onMenuClick?: () => void
  title?: string
  description?: string
}

export default function Topbar({ title, description }: TopbarProps) {
  const { notifications, unreadCount, markAllRead } = useNotifications()

  return (
    <header className="flex h-16 items-center justify-between px-6 bg-content1 shrink-0"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      {/* Left: title + description */}
      <div>
        {title && (
          <h1 className="font-bold text-foreground text-lg leading-tight">{title}</h1>
        )}
        {description && (
          <p className="text-xs text-default-400 mt-0.5">{description}</p>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        <Dropdown placement="bottom-end">
          <DropdownTrigger>
            <Button
              isIconOnly
              variant="light"
              radius="full"
              size="sm"
              className="relative text-default-500"
              aria-label="Notifications"
            >
              {unreadCount > 0 ? (
                <Badge content={unreadCount > 9 ? '9+' : unreadCount} color="danger" size="sm" shape="circle">
                  <Bell className="h-4.5 w-4.5" />
                </Badge>
              ) : (
                <Bell className="h-4.5 w-4.5" />
              )}
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="Notifications"
            className="w-80 p-0"
            itemClasses={{ base: 'rounded-none data-[hover=true]:bg-default-50' }}
          >
            {/* Header */}
            <DropdownItem
              key="header"
              isReadOnly
              className="cursor-default px-4 py-3 border-b border-divider"
              textValue="notifications-header"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                      {unreadCount} new
                    </span>
                    <button
                      onClick={markAllRead}
                      className="text-xs text-default-400 hover:text-primary transition-colors"
                    >
                      Mark all read
                    </button>
                  </div>
                )}
              </div>
            </DropdownItem>

            {/* Notification items */}
            {notifications.length === 0 ? (
              <DropdownItem key="empty" isReadOnly className="py-8 text-center cursor-default" textValue="empty">
                <div className="flex flex-col items-center gap-2">
                  <Bell className="h-8 w-8 text-default-200" />
                  <p className="text-sm text-default-400">No notifications yet</p>
                </div>
              </DropdownItem>
            ) : (
              notifications.slice(0, 8).map(n => (
                <DropdownItem
                  key={n.id}
                  className={`px-4 py-3 ${!n.read ? 'bg-primary/5' : ''}`}
                  textValue={n.message}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && (
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    )}
                    <div className={!n.read ? '' : 'pl-3.5'}>
                      <p className={`text-sm ${!n.read ? 'font-semibold text-foreground' : 'text-default-600'}`}>
                        {n.message}
                      </p>
                      <p className="text-xs text-default-300 mt-0.5">{formatRelative(n.created_at)}</p>
                    </div>
                  </div>
                </DropdownItem>
              ))
            )}
          </DropdownMenu>
        </Dropdown>
      </div>
    </header>
  )
}
