-- ============================================================
-- Muyenzi VMS – Row Level Security Policies
-- ============================================================

-- Helper function: get the company_id for the currently authenticated user
CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT company_id FROM users WHERE id = auth.uid();
$$;

-- Helper function: get the role for the currently authenticated user
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$;

-- ── Companies ────────────────────────────────────────────────
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can view own company"
  ON companies FOR SELECT
  USING (id = get_my_company_id());

CREATE POLICY "admins can update own company"
  ON companies FOR UPDATE
  USING (id = get_my_company_id() AND get_my_role() = 'admin');

-- ── Users ────────────────────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can view teammates"
  ON users FOR SELECT
  USING (company_id = get_my_company_id());

CREATE POLICY "users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "admins can insert users"
  ON users FOR INSERT
  WITH CHECK (company_id = get_my_company_id() AND get_my_role() = 'admin');

CREATE POLICY "admins can delete users"
  ON users FOR DELETE
  USING (company_id = get_my_company_id() AND get_my_role() = 'admin' AND id != auth.uid());

-- ── Sites ────────────────────────────────────────────────────
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can view company sites"
  ON sites FOR SELECT
  USING (company_id = get_my_company_id());

CREATE POLICY "admins and site managers can manage sites"
  ON sites FOR INSERT
  WITH CHECK (company_id = get_my_company_id() AND get_my_role() IN ('admin', 'site_manager'));

CREATE POLICY "admins and site managers can update sites"
  ON sites FOR UPDATE
  USING (company_id = get_my_company_id() AND get_my_role() IN ('admin', 'site_manager'));

CREATE POLICY "admins can delete sites"
  ON sites FOR DELETE
  USING (company_id = get_my_company_id() AND get_my_role() = 'admin');

-- ── Visitors ─────────────────────────────────────────────────
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can view company visitors"
  ON visitors FOR SELECT
  USING (company_id = get_my_company_id());

CREATE POLICY "staff can create visitors"
  ON visitors FOR INSERT
  WITH CHECK (company_id = get_my_company_id() AND get_my_role() IN ('admin', 'site_manager', 'receptionist', 'host'));

CREATE POLICY "staff can update visitors"
  ON visitors FOR UPDATE
  USING (company_id = get_my_company_id() AND get_my_role() IN ('admin', 'site_manager', 'receptionist'));

-- ── Visits ───────────────────────────────────────────────────
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can view company visits"
  ON visits FOR SELECT
  USING (company_id = get_my_company_id());

CREATE POLICY "staff can create visits"
  ON visits FOR INSERT
  WITH CHECK (company_id = get_my_company_id() AND get_my_role() IN ('admin', 'site_manager', 'receptionist', 'host'));

CREATE POLICY "staff can update visits"
  ON visits FOR UPDATE
  USING (company_id = get_my_company_id() AND get_my_role() IN ('admin', 'site_manager', 'receptionist'));

CREATE POLICY "admins can delete visits"
  ON visits FOR DELETE
  USING (company_id = get_my_company_id() AND get_my_role() = 'admin');

-- ── Invitations ──────────────────────────────────────────────
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can view company invitations"
  ON invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM visits v
      WHERE v.id = visit_id AND v.company_id = get_my_company_id()
    )
  );

CREATE POLICY "staff can manage invitations"
  ON invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM visits v
      WHERE v.id = visit_id AND v.company_id = get_my_company_id()
    )
  );

-- ── Notifications ─────────────────────────────────────────────
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "users can update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- ── Audit Logs ────────────────────────────────────────────────
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (company_id = get_my_company_id() AND get_my_role() = 'admin');

CREATE POLICY "system can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (company_id = get_my_company_id());
