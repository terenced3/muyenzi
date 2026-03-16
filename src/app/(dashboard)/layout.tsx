import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { UserProvider } from '@/context/UserContext'
import Sidebar from '@/components/layout/Sidebar'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <UserProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Sidebar (desktop) */}
        <div className="hidden lg:flex lg:flex-col">
          <Sidebar />
        </div>
        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </UserProvider>
  )
}
