import { hasPermission } from '~/constants/roles'
import type { UserWithCompany, UserRole } from '~/types/database'

export const useUser = () => {
  const supabase = useSupabaseClient()
  const authUser = useSupabaseUser()

  const user = useState<UserWithCompany | null>('userProfile', () => null)
  const loading = useState<boolean>('userLoading', () => true)

  async function fetchProfile() {
    if (!authUser.value) {
      user.value = null
      loading.value = false
      return
    }
    const { data } = await supabase
      .from('users')
      .select('*, company:companies(*)')
      .eq('id', authUser.value.id)
      .single()
    user.value = data as UserWithCompany | null
    loading.value = false
  }

  function can(permission: string): boolean {
    if (!user.value) return false
    return hasPermission(user.value.role as UserRole, permission as Parameters<typeof hasPermission>[1])
  }

  return { user: readonly(user), loading: readonly(loading), can, fetchProfile }
}
