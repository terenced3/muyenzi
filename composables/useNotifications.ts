import type { Notification } from '~/types/database'

export const useNotifications = () => {
  const supabase = useSupabaseClient()
  const { user } = useUser()

  const notifications = ref<Notification[]>([])
  let channel: ReturnType<typeof supabase.channel> | null = null

  async function fetchNotifications() {
    if (!user.value) return
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.value.id)
      .order('created_at', { ascending: false })
      .limit(20)
    notifications.value = data ?? []
  }

  function subscribe() {
    if (!user.value) return
    channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.value.id}` },
        (payload) => {
          notifications.value = [payload.new as Notification, ...notifications.value]
        },
      )
      .subscribe()
  }

  function unsubscribe() {
    if (channel) supabase.removeChannel(channel)
  }

  const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

  async function markAllRead() {
    if (!user.value) return
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.value.id)
      .eq('read', false)
    notifications.value = notifications.value.map(n => ({ ...n, read: true }))
  }

  onMounted(async () => {
    await fetchNotifications()
    subscribe()
  })

  onUnmounted(() => unsubscribe())

  return { notifications, unreadCount, markAllRead }
}
