# Production Readiness Audit — Muyenzi VMS

> Audited: 2026-06-04 | Last updated: 2026-06-08 | Total issues: 24 | Blocking launch: 0 Critical + 0 High

---

## Status Legend

| Symbol | Meaning |
|--------|---------|
| ⬜ | Not started |
| 🚧 | In progress |
| ✅ | Done |

---

## CRITICAL — Must Fix Before Any Deployment

| # | Issue | File | Status |
|---|-------|------|--------|
| C1 | Kiosk checkin/checkout/print-badge endpoints have no authentication — anyone with a `siteId` can create visitors, spam badges, and brute-force access codes | [server/api/kiosk/[siteId]/checkin.post.ts](server/api/kiosk/%5BsiteId%5D/checkin.post.ts), [checkout.post.ts](server/api/kiosk/%5BsiteId%5D/checkout.post.ts), [print-badge.post.ts](server/api/kiosk/print-badge.post.ts) | ✅ |
| C2 | Document signing endpoint has no visitor verification — anyone can sign NDAs on behalf of any visitor (legal/compliance liability) | [server/api/documents/sign.post.ts](server/api/documents/sign.post.ts), [presign-info.get.ts](server/api/documents/presign-info.get.ts) | ✅ |
| C3 | Export endpoints accept `company_id` as a query param without verifying it matches the logged-in user — any authenticated user can export any company's visitor data | [server/api/export/csv.get.ts](server/api/export/csv.get.ts), [server/api/export/pdf.get.ts](server/api/export/pdf.get.ts) | ✅ |
| C4 | Blacklist add/delete uses `created_by` / `requested_by` from the request body instead of the session — anyone can add/remove entries while impersonating an admin | [server/api/blacklist/index.post.ts](server/api/blacklist/index.post.ts), [server/api/blacklist/[id].delete.ts](server/api/blacklist/%5Bid%5D.delete.ts) | ✅ |

### Fix Notes

**C1 — Kiosk Auth Strategy:** Issue each kiosk a secret API key stored in the site config. Validate it on every kiosk API call server-side. Alternatively mint a site-scoped JWT when the kiosk session starts.

**C2 — Document Signing:** Issue a short-lived signed token (HMAC of `visit_id + secret`) inside the invitation email. Validate that token on the signing endpoint — no token, no signature accepted.

**C3 — Export Scoping:** Remove `company_id` from query params entirely. Derive it from the authenticated session on the server side only.

**C4 — Blacklist Auth:** Remove `created_by` / `requested_by` from request body. Always read the actor from `serverSupabaseClient()` session.

---

## HIGH — Fix Before Going Live

| # | Issue | File | Status |
|---|-------|------|--------|
| H1 | Deactivated users (`is_active = false`) are only blocked from dashboard page navigation — their session token still works on all API endpoints until it expires | [middleware/auth.global.ts](middleware/auth.global.ts):21-28 | ✅ |
| H2 | Open redirect after login — `?redirect=` param is used without validation, enabling phishing via `/login?redirect=https://attacker.com` | [pages/login.vue](pages/login.vue):9 | ✅ |
| H3 | Invite token race condition — two simultaneous requests with the same token both pass the `accepted_at IS NULL` check, allowing duplicate account creation | [pages/invite/[token].vue](pages/invite/%5Btoken%5D.vue), [server/api/team-invites/[token].get.ts](server/api/team-invites/%5Btoken%5D.get.ts) | ✅ |
| H4 | `/confirm` page shows a loading spinner forever on expired/invalid PKCE tokens — users with bad links have no path forward | [pages/confirm.vue](pages/confirm.vue) | ✅ |

### Fix Notes

**H1:** Add a server middleware at `server/middleware/` that checks `is_active` on every authenticated API call, not just dashboard navigation.

**H2:** Validate redirect is a relative path: `redirect.startsWith('/') && !redirect.startsWith('//')` before calling `navigateTo`.

**H3:** Use an atomic `UPDATE team_invites SET accepted_at = now() WHERE token = $1 AND accepted_at IS NULL RETURNING *` — if nothing is returned the token is already used.

**H4:** Wrap the PKCE exchange in a try/catch and show a clear error with a "request a new link" action.

---

## MEDIUM — Fix Before Scaling

| # | Issue | File | Status |
|---|-------|------|--------|
| M1 | Email failures are fire-and-forget — if Resend is down, visits are created with access codes that are never delivered and there is no alert | [server/api/invitations/index.post.ts](server/api/invitations/index.post.ts):168-195 | ✅ |
| M2 | No rate limiting on any public endpoint — kiosk access codes (6 chars) are brute-forceable in minutes | [nuxt.config.ts](nuxt.config.ts), [server/middleware/](server/middleware/) | ✅ |
| M3 | Notification insert after check-in is not in a try/catch — if it fails, the visit is checked in but the host is never notified with no log | [server/api/kiosk/[siteId]/checkin.post.ts](server/api/kiosk/%5BsiteId%5D/checkin.post.ts):164-187 | ✅ |
| M4 | `console.log` / `console.warn` left in server files — exposes internal state and PII in production logs | Multiple server files | ✅ |
| M5 | Env vars not validated at startup — a missing `SUPABASE_SERVICE_KEY` fails silently at runtime with cryptic errors | [nuxt.config.ts](nuxt.config.ts) | ✅ |

### Fix Notes

**M1:** On email failure, insert a row into `audit_logs` with `action: 'email_failed'` and surface a warning in the dashboard UI ("invitation created but email failed — resend manually").

**M2:** Add Nuxt server middleware with a simple in-memory rate limiter (or Redis-backed) on `/api/kiosk/*`. Start with 10 requests/minute per IP.

**M3:** Wrap the notification insert in its own try/catch block separate from the email send. Log failures to `audit_logs`.

**M4:** Replace all `console.warn` / `console.error` in `server/` with a structured logger or remove entirely.

**M5:** Add a startup check in `server/plugins/` that throws if required env vars are missing.

---

## LOW — Clean Up Before Launch

| # | Issue | File | Status |
|---|-------|------|--------|
| L1 | No audit trail for document signatures — cannot prove who signed what for compliance | [server/api/documents/sign.post.ts](server/api/documents/sign.post.ts) | ⬜ |
| L2 | Sender email addresses are hardcoded (`notifications@muyenzi.com`) — breaks for customers on custom domains | [server/api/email/](server/api/email/) | ⬜ |
| L3 | Walk-in check-in doesn't normalise phone format — `+263...` and `0...` for the same person create duplicate visitor records | [server/api/kiosk/[siteId]/checkin.post.ts](server/api/kiosk/%5BsiteId%5D/checkin.post.ts) | ⬜ |
| L4 | No CSP (Content Security Policy) headers configured | [nuxt.config.ts](nuxt.config.ts) | ⬜ |

---

## Email Infrastructure

**Provider:** Resend (`resend` npm package — installed and tested ✅)

**Routes:**

| Route | Trigger | Test Status |
|-------|---------|-------------|
| [send-invitation.post.ts](server/api/email/send-invitation.post.ts) | New invitation — sends visitor their access code + QR | ✅ Delivered (msg `b423c292`) |
| [notify-arrival.post.ts](server/api/email/notify-arrival.post.ts) | Kiosk check-in — notifies host of arrival | ✅ Delivered (msg `150251b6`) |
| [send-team-invite.post.ts](server/api/email/send-team-invite.post.ts) | Admin invites team member | ✅ Delivered (msg `95cd4a65`) |

**API key:** Configured in `.env.local` ✅

**Scale verdict:** Resend holds up well at any realistic VMS volume. The only gap is no built-in retry logic — address with M1 above.

---

### Domain Verification — Deferred to Commercialisation

> **Intentionally deferred.** `muyenzi.com` sender domain verification in Resend is not required for development or internal testing. It will be completed as part of the go-to-market / commercialisation milestone before the product is opened to external customers.

**What works now:** All 3 email flows deliver correctly using `onboarding@resend.dev` (Resend's shared test sender). Templates, content, and API integration are fully verified.

**What changes at commercialisation:**
1. Go to [resend.com/domains](https://resend.com/domains) → Add `muyenzi.com`
2. Add the 3 DNS records Resend provides (SPF, DKIM, DMARC) at your registrar
3. Click Verify — propagates in minutes
4. Emails will then send from `invitations@muyenzi.com` and `notifications@muyenzi.com` — no code changes needed

---

## Progress Summary

```
Critical  ✅✅✅✅  4/4
High      ✅✅✅✅  4/4
Medium    ✅⬜⬜⬜⬜  1/5
Low       ⬜⬜⬜⬜  0/4
─────────────────────
Total     13/17 resolved

Email infrastructure  ✅ API key configured, all 3 flows tested and delivered
Domain verification   🔜 Deferred — scheduled for commercialisation milestone
```

---

## Flow Accuracy — What Works Today

All happy-path flows are correctly implemented:

- Auth (signup, login, team invite, email confirmation)
- Invitation creation with access code generation
- Kiosk check-in (pre-registered + walk-in) and check-out
- Role-based dashboard access and permission guards
- Analytics, blacklist, site management, audit log
- Offline kiosk mode (Service Worker + IndexedDB)
- Document signing UI flow

All roles (admin, site_manager, receptionist, host) can complete their core objectives on the happy path. The issues above are security gaps and resilience concerns, not missing features.
