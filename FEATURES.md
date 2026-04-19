# Muyenzi — Feature Audit & Progress Tracker

> Track what's built, what's in progress, and what's planned.
> Update the status emoji as work progresses: ✅ Done · 🚧 In Progress · ⬜ Planned

---

## Authentication & Onboarding
- ✅ Email/password signup with auto-company + admin provisioning
- ✅ Login / logout
- ✅ Password reset (request + update)
- ✅ Email confirmation page
- ✅ Redirect to `/dashboard` if already logged in
- ✅ Invite team members via email (migration 0007, `/invite/[token]`)
- ⬜ Social login (Google/Microsoft)
- ⬜ Two-factor authentication

---

## Visitor Management
- ✅ Pre-register visitors (create invitation with visit date, time, purpose, host, site)
- ✅ Walk-in check-in (name + phone required)
- ✅ Visitor deduplication by phone per company
- ✅ Visitor upsert on phone conflict
- ✅ Cancel visits
- ✅ Mark as no-show
- ✅ Force check-out from dashboard
- ✅ Visit status lifecycle: expected → checked_in → checked_out / cancelled / no_show
- ✅ Custom visitor fields (text, number, textarea, select) per company
- ⬜ Visitor photo capture at kiosk
- ✅ Recurring / repeating visits (daily/weekly/monthly, capped at 52, migration 0008)
- ✅ Visitor blacklist / watchlist (migration 0008, /dashboard/blacklist, kiosk enforced)
- ✅ NDA / document signing at kiosk (pre-sign via email link + kiosk signing, admin-managed templates)
- ⬜ Visitor self check-in via mobile link

---

## Kiosk
- ✅ Self-service touchscreen kiosk per site (`/kiosk/[siteId]`)
- ✅ Check-in via QR scan
- ✅ Check-in via access code
- ✅ Manual walk-in entry (name, phone, email, company, purpose)
- ✅ Check-out via QR scan
- ✅ Check-out via access code
- ✅ Offline mode (IndexedDB queue + Service Worker)
- ✅ Auto-sync when back online (every 5s)
- ✅ Idle timeout auto-reset (60 seconds)
- ✅ Company logo or monogram display
- ✅ Offline / syncing status banner
- ✅ Badge printing after check-in
- ⬜ Kiosk PIN lock / admin access protection
- ⬜ Custom welcome message per site
- ⬜ Pre-arrival health/safety questions

---

## Invitations
- ✅ Create invitation → generates QR code + access code
- ✅ Show QR code + access code in dashboard after creation
- ✅ Copy access code to clipboard
- ✅ Send invitation email to visitor (via Resend)
- ✅ List upcoming (expected) invitations
- ✅ Edit invitation
- ✅ Cancel invitation
- ⬜ Resend invitation email
- ⬜ SMS invitation (critical for Zimbabwe market)
- ⬜ WhatsApp message invitation
- ⬜ Bulk invite (upload CSV of visitors)

---

## Email Notifications
- ✅ Visitor invitation email (access code + instructions)
- ✅ Host arrival notification email
- ✅ Team member invite email
- ⬜ Reminder email to visitor (day-before)
- ⬜ Check-out confirmation email
- ⬜ Host pre-arrival notification

---

## In-App Notifications
- ✅ Real-time push via Supabase Realtime
- ✅ Notification bell with unread badge in topbar
- ✅ Notification dropdown (last 8, mark all read)
- ✅ visitor_arrived notification on check-in
- ⬜ Mark individual notification as read
- ⬜ Notification for check-out / cancelled / no-show events

---

## Analytics & Reporting
- ✅ Dashboard stats: visitors today, currently inside, upcoming, this week
- ✅ 30-day visit trends chart (line)
- ✅ Peak hours chart (bar)
- ✅ Visits by site breakdown
- ✅ Currently inside alert banner
- ✅ Date range picker (7d / 30d / 90d presets + custom range)
- ✅ Per-site analytics filter
- ✅ Visitor return rate / repeat visitor stats
- ✅ Average visit duration stat
- ✅ Audit log viewer page (/dashboard/audit-log, paginated, filterable)

---

## Export
- ✅ CSV export (all visits, up to 5,000 rows)
- ✅ PDF export (all visits, up to 1,000 rows)
- ⬜ Date range filter on export
- ⬜ Per-site filter on export
- ⬜ Export visitor list (not just visits)

---

## Sites Management
- ✅ Create sites
- ✅ List sites
- ✅ Edit site (name, address)
- ✅ Badge printer settings per site (enable/disable, model)
- ✅ Kiosk link from sidebar
- ✅ Delete site (confirm modal, blocks if visitors checked in, audit logged)
- ✅ Site QR code poster (printable QR for visitors)

---

## Team / User Management
- ✅ List all team members
- ✅ Change user roles (inline dropdown)
- ✅ Role-based permission system (admin, site_manager, receptionist, host)
- ✅ Permission guards on pages
- ✅ Invite new team member by email
- ✅ Pending invites list with revoke button
- ✅ Remove / deactivate team member (soft deactivate + hard remove, audit logged, last-admin guard)
- ✅ User profile with avatar (upload/remove in settings, shown in sidebar and team table)
- ✅ Per-site user assignment (admin assigns users to specific sites, shown as badges)

---

## Settings
- ✅ Company name
- ✅ Company logo upload + delete
- ✅ My profile (name edit)
- ✅ Visitor custom fields (add, list, delete)
- ✅ Custom field reordering (drag-and-drop, persists sort_order)
- ✅ Custom field editing (inline edit modal for label, type, required, options)
- ✅ Password change in settings
- ✅ Notification preferences (in-app, email per event type)
- ✅ Timezone setting (company-level, 16 IANA zones)

---

## Badge Printing
- ✅ Thermal badge printed from kiosk (80mm, print dialog)
- ✅ Badge includes: visitor name, QR, host, date, access code
- ✅ Print job logged to `print_logs` table
- ⬜ Company logo on badge
- ⬜ Custom badge template / branding
- ⬜ Reprint badge from dashboard

---

## Security & Compliance
- ✅ Row Level Security on all tables
- ✅ Company isolation enforced at DB level
- ✅ Service role key only used server-side
- ✅ Audit log table (schema in place)
- ✅ Audit log viewer page (/dashboard/audit-log)
- ✅ Data retention / auto-delete old visitor records (configurable in Settings, manual cleanup + pg_cron ready)
- ✅ GDPR / privacy notice shown at kiosk before check-in (scroll-to-bottom + agree required)
- ✅ Visitor data export (GDPR right of access — JSON download from visitor actions menu, audit logged)

---

## Marketing / Public Pages
- ✅ Landing page
- ✅ Features page
- ✅ Pricing page
- ✅ Contact page
- ⬜ Help / documentation

---

## Priority Backlog (Zimbabwe market focus)
> Top items to tackle next, in recommended order.

| # | Feature | Why |
|---|---------|-----|
| 1 | SMS/WhatsApp invitations | Phone is primary ID — most visitors won't have email |
| 2 | ✅ Audit log viewer page | Table + RLS exist, just needs a UI page |
| 3 | Custom field reorder/edit | UX gap — can only delete and recreate fields |
| 4 | ✅ Date range on analytics/export | Hardcoded 30 days everywhere |
| 5 | ✅ Remove / deactivate team member | No offboarding path currently |
| 6 | Resend invitation email | Common need after visitor misses the original |
| 7 | ✅ Delete site | No way to clean up test/old sites |
| 8 | Company logo on badge | Branding consistency at kiosk |
