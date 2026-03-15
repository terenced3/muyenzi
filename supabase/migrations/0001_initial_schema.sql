-- ============================================================
-- Muyenzi VMS – Initial Schema
-- ============================================================

-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Companies ────────────────────────────────────────────────
CREATE TABLE companies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  logo_url    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Users (extends auth.users) ───────────────────────────────
CREATE TYPE user_role AS ENUM ('admin', 'site_manager', 'receptionist', 'host');

CREATE TABLE users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL DEFAULT '',
  email       TEXT NOT NULL,
  role        user_role NOT NULL DEFAULT 'host',
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Sites ────────────────────────────────────────────────────
CREATE TABLE sites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  address     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Visitors ─────────────────────────────────────────────────
CREATE TABLE visitors (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  email         TEXT,
  phone         TEXT,
  company_name  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Visit status enum ────────────────────────────────────────
CREATE TYPE visit_status AS ENUM ('expected', 'checked_in', 'checked_out', 'cancelled', 'no_show');

-- ── Visits ───────────────────────────────────────────────────
CREATE TABLE visits (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  site_id        UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  visitor_id     UUID NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
  host_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  purpose        TEXT,
  status         visit_status NOT NULL DEFAULT 'expected',
  check_in_at    TIMESTAMPTZ,
  check_out_at   TIMESTAMPTZ,
  access_code    TEXT NOT NULL UNIQUE,
  qr_code_data   TEXT NOT NULL,
  notes          TEXT,
  visit_date     DATE NOT NULL,
  visit_time     TIME,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX visits_company_id_idx   ON visits(company_id);
CREATE INDEX visits_site_id_idx      ON visits(site_id);
CREATE INDEX visits_visitor_id_idx   ON visits(visitor_id);
CREATE INDEX visits_access_code_idx  ON visits(access_code);
CREATE INDEX visits_status_idx       ON visits(status);
CREATE INDEX visits_visit_date_idx   ON visits(visit_date);

-- ── Invitations ──────────────────────────────────────────────
CREATE TABLE invitations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id       UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  email_sent_at  TIMESTAMPTZ,
  accepted_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Notifications ─────────────────────────────────────────────
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  message     TEXT NOT NULL,
  read        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX notifications_user_id_idx ON notifications(user_id);

-- ── Audit Logs ────────────────────────────────────────────────
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  resource    TEXT NOT NULL,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX audit_logs_company_id_idx ON audit_logs(company_id);
