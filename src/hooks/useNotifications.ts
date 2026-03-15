'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Notification } from '@/types/database'
import { useUser } from '@/context/UserContext'

export function useNotifications() {
  const { user } = useUser()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const supabase = createClient()

  useEffect(() => {
    if (!user) return

    // Initial fetch
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => setNotifications(data ?? []))

    // Realtime subscription
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        payload => setNotifications(prev => [payload.new as Notification, ...prev])
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const unreadCount = notifications.filter(n => !n.read).length

  async function markAllRead() {
    if (!user) return
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  return { notifications, unreadCount, markAllRead }
}
