-- ============================================================
-- Recurring Visits + Visitor Blacklist
-- ============================================================

-- ── Recurring visits ─────────────────────────────────────────
-- recurrence_type:  'daily' | 'weekly' | 'monthly'
-- recurrence_group_id: links all visits in the same series
-- recurrence_end_date: last allowed date for the series

ALTER TABLE visits ADD COLUMN IF NOT EXISTS recurrence_type        TEXT CHECK (recurrence_type IN ('daily', 'weekly', 'monthly'));
ALTER TABLE visits ADD COLUMN IF NOT EXISTS recurrence_end_date    DATE;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS recurrence_group_id    UUID;

CREATE INDEX IF NOT EXISTS visits_recurrence_group_idx ON visits(recurrence_group_id);

-- ── Visitor Blacklist ─────────────────────────────────────────
CREATE TABLE visitor_blacklist (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  phone       TEXT NOT NULL,
  full_name   TEXT,
  reason      TEXT,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, phone)
);

CREATE INDEX visitor_blacklist_company_id_idx ON visitor_blacklist(company_id);
CREATE INDEX visitor_blacklist_phone_idx      ON visitor_blacklist(company_id, phone);

ALTER TABLE visitor_blacklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company members can view blacklist"
  ON visitor_blacklist FOR SELECT
  USING (company_id = get_my_company_id());

CREATE POLICY "admins and site managers can manage blacklist"
  ON visitor_blacklist FOR ALL
  USING (company_id = get_my_company_id() AND get_my_role() IN ('admin', 'site_manager'));
