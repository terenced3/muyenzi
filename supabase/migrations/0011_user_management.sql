-- ── is_active flag on users ───────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- ── Per-site user assignments ─────────────────────────────────
CREATE TABLE user_site_assignments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  site_id    UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, site_id)
);

CREATE INDEX user_site_assignments_user_idx ON user_site_assignments(user_id);
CREATE INDEX user_site_assignments_site_idx ON user_site_assignments(site_id);

ALTER TABLE user_site_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company members can view site assignments"
  ON user_site_assignments FOR SELECT
  USING (company_id = get_my_company_id());

CREATE POLICY "admins and site managers can manage assignments"
  ON user_site_assignments FOR ALL
  USING (
    company_id = get_my_company_id()
    AND get_my_role() IN ('admin', 'site_manager')
  )
  WITH CHECK (
    company_id = get_my_company_id()
    AND get_my_role() IN ('admin', 'site_manager')
  );

CREATE POLICY "service role full access on user_site_assignments"
  ON user_site_assignments FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Allow service role to update users (deactivate/avatar)
CREATE POLICY "service role full access on users"
  ON users FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
