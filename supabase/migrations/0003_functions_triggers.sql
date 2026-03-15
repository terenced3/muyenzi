-- ============================================================
-- Muyenzi VMS – Functions & Triggers
-- ============================================================

-- ── handle_new_user ──────────────────────────────────────────
-- Fires when a new row is inserted into auth.users.
-- Creates a company and user row automatically.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id  UUID;
  v_company_name TEXT;
  v_slug        TEXT;
  v_suffix      TEXT;
BEGIN
  -- Read company_name from signup metadata
  v_company_name := COALESCE(
    NEW.raw_user_meta_data->>'company_name',
    split_part(NEW.email, '@', 2)
  );

  -- Generate a URL-friendly slug
  v_slug := lower(regexp_replace(v_company_name, '[^a-zA-Z0-9]', '-', 'g'));
  v_slug := regexp_replace(v_slug, '-+', '-', 'g');
  v_slug := trim(both '-' from v_slug);

  -- Handle slug collisions by appending a short random suffix
  WHILE EXISTS (SELECT 1 FROM companies WHERE slug = v_slug) LOOP
    v_suffix := substr(gen_random_uuid()::text, 1, 6);
    v_slug := v_slug || '-' || v_suffix;
  END LOOP;

  -- Create the company
  INSERT INTO companies (name, slug)
  VALUES (v_company_name, v_slug)
  RETURNING id INTO v_company_id;

  -- Create the user as admin
  INSERT INTO users (id, company_id, full_name, email, role)
  VALUES (
    NEW.id,
    v_company_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'admin'
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── get_company_stats ────────────────────────────────────────
-- Returns dashboard stats for the current company.

CREATE OR REPLACE FUNCTION get_company_stats(p_company_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today         DATE := CURRENT_DATE;
  v_week_start    DATE := date_trunc('week', CURRENT_DATE)::DATE;
  v_visitors_today      INT;
  v_currently_inside    INT;
  v_visits_this_week    INT;
  v_upcoming_visits     INT;
BEGIN
  SELECT COUNT(*) INTO v_visitors_today
  FROM visits
  WHERE company_id = p_company_id
    AND visit_date = v_today
    AND status IN ('checked_in', 'checked_out');

  SELECT COUNT(*) INTO v_currently_inside
  FROM visits
  WHERE company_id = p_company_id
    AND status = 'checked_in';

  SELECT COUNT(*) INTO v_visits_this_week
  FROM visits
  WHERE company_id = p_company_id
    AND visit_date BETWEEN v_week_start AND v_today;

  SELECT COUNT(*) INTO v_upcoming_visits
  FROM visits
  WHERE company_id = p_company_id
    AND visit_date >= v_today
    AND status = 'expected';

  RETURN json_build_object(
    'visitors_today',    v_visitors_today,
    'currently_inside',  v_currently_inside,
    'visits_this_week',  v_visits_this_week,
    'upcoming_visits',   v_upcoming_visits
  );
END;
$$;

-- ── get_visit_trends ─────────────────────────────────────────
-- Returns daily visit counts for the last N days.

CREATE OR REPLACE FUNCTION get_visit_trends(p_company_id UUID, p_days INT DEFAULT 30)
RETURNS TABLE(visit_date DATE, visit_count BIGINT)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    d::DATE AS visit_date,
    COUNT(v.id) AS visit_count
  FROM generate_series(
    CURRENT_DATE - (p_days - 1),
    CURRENT_DATE,
    '1 day'::INTERVAL
  ) d
  LEFT JOIN visits v
    ON v.visit_date = d::DATE
    AND v.company_id = p_company_id
    AND v.status != 'cancelled'
  GROUP BY d
  ORDER BY d;
$$;

-- ── get_hourly_distribution ──────────────────────────────────
-- Returns check-in counts by hour of day.

CREATE OR REPLACE FUNCTION get_hourly_distribution(p_company_id UUID, p_days INT DEFAULT 30)
RETURNS TABLE(hour INT, visit_count BIGINT)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    EXTRACT(HOUR FROM check_in_at)::INT AS hour,
    COUNT(*) AS visit_count
  FROM visits
  WHERE company_id = p_company_id
    AND check_in_at IS NOT NULL
    AND check_in_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY hour
  ORDER BY hour;
$$;
