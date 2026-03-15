'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { UserWithCompany } from '@/types/database'
import { hasPermission } from '@/lib/constants/roles'

interface UserContextValue {
  user: UserWithCompany | null
  loading: boolean
  can: (permission: Parameters<typeof hasPermission>[1]) => boolean
  refresh: () => Promise<void>
}

const UserContext = createContext<UserContextValue>({
  user: null,
  loading: true,
  can: () => false,
  refresh: async () => {},
})

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserWithCompany | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  async function fetchUser() {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) { setUser(null); setLoading(false); return }

    const { data } = await supabase
      .from('users')
      .select('*, company:companies(*)')
      .eq('id', authUser.id)
      .single()

    setUser(data as UserWithCompany | null)
    setLoading(false)
  }

  useEffect(() => {
    fetchUser()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => fetchUser())
    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function can(permission: Parameters<typeof hasPermission>[1]) {
    if (!user) return false
    return hasPermission(user.role, permission)
  }

  return (
    <UserContext.Provider value={{ user, loading, can, refresh: fetchUser }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  return useContext(UserContext)
}
