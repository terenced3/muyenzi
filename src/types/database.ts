export type UserRole = 'admin' | 'site_manager' | 'receptionist' | 'host'
export type VisitStatus = 'expected' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show'

export interface Company {
  id: string
  name: string
  slug: string
  logo_url: string | null
  created_at: string
}

export interface User {
  id: string
  company_id: string
  full_name: string
  email: string
  role: UserRole
  avatar_url: string | null
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

// Joined types
export interface VisitWithRelations extends Visit {
  visitor: Visitor
  site: Site
  host: User | null
}

export interface UserWithCompany extends User {
  company: Company
}
