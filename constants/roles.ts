import type { UserRole } from '~/types/database'

export const ROLES: Record<UserRole, UserRole> = {
  admin: 'admin',
  site_manager: 'site_manager',
  receptionist: 'receptionist',
  host: 'host',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  site_manager: 'Site Manager',
  receptionist: 'Receptionist',
  host: 'Host',
}

type Permission =
  | 'manage_sites'
  | 'manage_users'
  | 'manage_settings'
  | 'invite_visitors'
  | 'view_analytics'
  | 'check_in'
  | 'check_out'
  | 'view_own_visits'

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: ['manage_sites', 'manage_users', 'manage_settings', 'invite_visitors', 'view_analytics', 'check_in', 'check_out', 'view_own_visits'],
  site_manager: ['manage_sites', 'invite_visitors', 'view_analytics', 'check_in', 'check_out', 'view_own_visits'],
  receptionist: ['invite_visitors', 'check_in', 'check_out', 'view_own_visits'],
  host: ['invite_visitors', 'view_own_visits'],
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}
