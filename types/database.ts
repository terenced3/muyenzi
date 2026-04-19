export type UserRole = 'admin' | 'site_manager' | 'receptionist' | 'host'
export type VisitStatus = 'expected' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show'

export interface Company {
  id: string
  name: string
  slug: string
  logo_url: string | null
  timezone: string
  created_at: string
}

export interface NotificationPrefs {
  visitor_arrived_inapp: boolean
  visitor_arrived_email: boolean
  pre_arrival_email: boolean
  daily_summary_email: boolean
}

export interface User {
  id: string
  company_id: string
  full_name: string
  email: string
  role: UserRole
  avatar_url: string | null
  is_active: boolean
  notification_prefs: NotificationPrefs | null
  created_at: string
}

export interface UserSiteAssignment {
  id: string
  user_id: string
  site_id: string
  company_id: string
  created_at: string
}

export interface Site {
  id: string
  company_id: string
  name: string
  address: string | null
  created_at: string
}

export interface Visitor {
  id: string
  company_id: string
  full_name: string
  email: string | null
  phone: string | null
  company_name: string | null
  created_at: string
}

export interface Visit {
  id: string
  company_id: string
  site_id: string
  visitor_id: string
  host_id: string | null
  purpose: string | null
  status: VisitStatus
  check_in_at: string | null
  check_out_at: string | null
  access_code: string
  qr_code_data: string
  notes: string | null
  visit_date: string
  visit_time: string | null
  custom_field_values: Record<string, string | number | boolean> | null
  created_at: string
}

export interface Invitation {
  id: string
  visit_id: string
  email_sent_at: string | null
  accepted_at: string | null
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  company_id: string
  type: string
  message: string
  read: boolean
  created_at: string
}

export type CustomFieldType = 'text' | 'number' | 'textarea' | 'select'

export interface VisitorCustomField {
  id: string
  company_id: string
  label: string
  field_key: string
  field_type: CustomFieldType
  options: string[] | null
  required: boolean
  sort_order: number
  created_at: string
}

export interface VisitWithRelations extends Visit {
  visitor: Visitor
  site: Site
  host: User | null
}

export interface UserWithCompany extends User {
  company: Company
}

export interface VisitorBlacklist {
  id: string
  company_id: string
  phone: string
  full_name: string | null
  reason: string | null
  created_by: string | null
  created_at: string
}

export interface DocumentTemplate {
  id: string
  company_id: string
  name: string
  content: string
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface DocumentSignature {
  id: string
  company_id: string
  template_id: string
  visit_id: string
  visitor_id: string
  signature_data: string
  pre_signed: boolean
  signed_at: string
}

export interface TeamInvite {
  id: string
  company_id: string
  email: string
  role: UserRole
  token: string
  invited_by: string | null
  accepted_at: string | null
  expires_at: string
  created_at: string
}
