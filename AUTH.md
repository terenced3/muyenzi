# Authentication — Muyenzi

Provider: **Supabase Auth** (email + password).
Social / SSO not yet implemented — see [Adding SSO](#adding-sso-later) below.

---

## Flows

### 1. Sign-up (new company admin)

```
/signup → supabase.auth.signUp() → Supabase sends confirmation email
                                 → user clicks link → /confirm → /dashboard
```

- Email + password collected. Password min 8 chars, strength meter shown.
- Password confirm field prevents typos.
- On submit: **always** shows "check your email" regardless of whether the
  email is already registered. This prevents email enumeration.
- The DB trigger `handle_new_user()` fires on `INSERT INTO auth.users` and
  creates the `public.users` row + a new company record.

### 2. Login

```
/login → supabase.auth.signInWithPassword() → /dashboard (or ?redirect= path)
```

- Open-redirect protection: `redirect` param must start with `/` and not `//`.
- Error message is always "Invalid email or password" — never distinguishes
  wrong email from wrong password (prevents username enumeration).
- Deactivated users are caught by `middleware/auth.global.ts`, force-signed-out,
  and redirected to `/login?reason=deactivated`.

### 3. Password reset

```
/auth/reset-password → supabase.auth.resetPasswordForEmail()
  → Supabase sends reset email → user clicks link
  → Supabase injects session → /auth/update-password
  → supabase.auth.updateUser({ password }) → /dashboard
```

- `/auth/update-password` guards itself: if `useSupabaseUser()` is null on mount
  (i.e., no valid reset-link session), redirects back to `/auth/reset-password`.
- The reset link sets a short-lived Supabase session in the URL hash — the page
  picks it up automatically via the Supabase JS client.

### 4. Team member invite

```
Admin sends invite → /api/team-invites (POST) → token stored in team_invites table
  → Resend email sent with /invite/:token link
  → Invitee visits link → GET /api/team-invites/:token (validate + return invite info)
  → Invitee sets name + password → supabase.auth.signUp() with invite_token in metadata
  → DB trigger handle_new_user() reads invite_token → joins existing company
  → Supabase sends confirmation email → /confirm → /dashboard
```

**Critical:** The invite token is consumed exclusively by the DB trigger
(`handle_new_user`), not by the API. The trigger sets `accepted_at = NOW()`
atomically on `INSERT INTO auth.users`. The invite page does NOT pre-call
`POST /api/team-invites/:token` before signUp — doing so would set `accepted_at`
and cause the trigger to miss the invite, creating a new company instead.

Token validity: 7 days (`expires_at` column, enforced by GET handler, POST
handler, and the DB trigger).

---

## Route Protection

`middleware/auth.global.ts` runs on every navigation.

| Path pattern | Auth required | Notes |
|---|---|---|
| `/dashboard/**` | Yes | Deactivated check also runs here |
| `/kiosk/**` | No | Authenticated via HMAC kiosk token |
| `/sign/**` | No | Authenticated via HMAC sign token |
| `/checkin/**` | No | Authenticated via HMAC check-in token |
| `/invite/**` | No | Authenticated via invite token |
| `/auth/**` | No | Reset / update password pages |
| `/login`, `/signup` | No | Redirects to /dashboard if already logged in |

---

## Security Properties

| Property | Implementation |
|---|---|
| Password hashing | Supabase (bcrypt) |
| Email verification | Required — Supabase confirmation link |
| Session management | Supabase JWT + refresh tokens (1h access, 7d refresh) |
| CSRF | N/A — Supabase uses Authorization header, not cookies |
| Open redirect | `redirect` param validated: must start `/`, not `//` |
| Email enumeration | Signup always shows success; login always returns generic error |
| Autocomplete | All auth inputs have correct `autocomplete` attributes |
| Invite token entropy | 32 bytes CSPRNG → 64-char hex (~256 bits) |
| Invite expiry | 7 days, enforced at DB level and in API handlers |
| Deactivated users | Force sign-out on dashboard navigation |

---

## Key Files

| File | Purpose |
|---|---|
| `pages/login.vue` | Email + password sign-in |
| `pages/signup.vue` | New company admin registration |
| `pages/confirm.vue` | Email confirmation callback (Supabase redirects here) |
| `pages/auth/reset-password.vue` | Request password reset link |
| `pages/auth/update-password.vue` | Set new password after clicking reset link |
| `pages/invite/[token].vue` | Team member invite acceptance |
| `middleware/auth.global.ts` | Route guard + deactivated user check |
| `server/api/team-invites/index.post.ts` | Create invite + send email |
| `server/api/team-invites/[token].get.ts` | Validate invite token |
| `server/api/team-invites/[token].post.ts` | (Reserved — not called by UI) |
| `supabase/migrations/0007_team_invites.sql` | team_invites table + handle_new_user trigger |

---

## Supabase Dashboard Config Checklist

These must be set in your Supabase project → Authentication → Settings:

- [x] **Email confirmations** — Enabled
- [x] **Site URL** — `https://muyenzi.com`
- [x] **Redirect URLs** — `https://muyenzi.com/**` (allows all subpaths)
- [ ] **Minimum password length** — Set to 8
- [ ] **Email OTP expiry** — Default 1h is fine; consider lowering to 30m
- [ ] **SMTP** — Configure custom SMTP (Resend) so confirmation emails come
      from your domain, not `noreply@mail.supabase.io`

### Custom SMTP via Resend (recommended)

In Supabase Dashboard → Authentication → SMTP Settings:
```
Host:       smtp.resend.com
Port:       465
Username:   resend
Password:   re_SzFsqP3D_...   (your RESEND_API_KEY)
Sender name: Muyenzi
From email: noreply@muyenzi.com
```

This ensures all Supabase system emails (confirmation, reset) come from
`muyenzi.com`, not Supabase's domain.

---

## Adding SSO Later

When ready to add Google / Microsoft SSO:

1. Supabase Dashboard → Authentication → Providers → enable the provider
2. Add the client ID + secret from Google Cloud Console / Azure AD
3. Add a "Continue with Google" button to `login.vue`:
   ```typescript
   await supabase.auth.signInWithOAuth({
     provider: 'google',
     options: { redirectTo: `${window.location.origin}/confirm` },
   })
   ```
4. The existing `/confirm` callback page handles the OAuth redirect already.
5. No changes needed to middleware or DB — `handle_new_user` fires for OAuth
   sign-ups too.

For enterprise SSO (SAML): requires Supabase Team/Enterprise plan.

---

## Audit Log

| Date | Change | Reason |
|---|---|---|
| 2026-07-15 | Initial auth implementation | — |
| 2026-07-15 | Fixed invite pre-consumption bug | DB trigger checked `accepted_at IS NULL` — pre-consuming token via API caused trigger to create new company instead of joining invited one |
| 2026-07-15 | Added `update-password` session guard | Page was accessible directly without reset link; `updateUser()` silently failed |
| 2026-07-15 | Signup always shows success | Prevent email enumeration via "User already registered" error |
| 2026-07-15 | Added `autocomplete` to all auth inputs | Enable password manager integration |
| 2026-07-15 | Added password show/hide toggle to all password fields | UX best practice |
| 2026-07-15 | Added password confirm + strength meter to signup | Prevent typos; guide users to stronger passwords |
| 2026-07-15 | Normalised login error to generic message | Prevent username enumeration |
