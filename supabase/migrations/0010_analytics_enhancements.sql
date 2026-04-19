-- ── get_visit_trends: add optional site filter ────────────────
CREATE OR REPLACE FUNCTION get_visit_trends(
  p_company_id UUID,
  p_days INT DEFAULT 30,
  p_site_id UUID DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE(visit_date DATE, visit_count BIGINT)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    d::DATE AS visit_date,
    COUNT(v.id) AS visit_count
  FROM generate_series(
    COALESCE(p_start_date, CURRENT_DATE - (p_days - 1)),
    COALESCE(p_end_date, CURRENT_DATE),
    '1 day'::INTERVAL
  ) d
  LEFT JOIN visits v
    ON v.visit_date = d::DATE
    AND v.company_id = p_company_id
    AND v.status != 'cancelled'
    AND (p_site_id IS NULL OR v.site_id = p_site_id)
  GROUP BY d
  ORDER BY d;
$$;

-- ── get_hourly_distribution: add optional site filter ─────────
CREATE OR REPLACE FUNCTION get_hourly_distribution(
  p_company_id UUID,
  p_days INT DEFAULT 30,
  p_site_id UUID DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
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
    AND (p_site_id IS NULL OR site_id = p_site_id)
    AND (
      p_start_date IS NOT NULL
        AND check_in_at >= p_start_date::TIMESTAMPTZ
        AND check_in_at < (p_end_date + 1)::TIMESTAMPTZ
      OR p_start_date IS NULL
        AND check_in_at >= NOW() - (p_days || ' days')::INTERVAL
    )
  GROUP BY hour
  ORDER BY hour;
$$;

-- ── get_return_rate: repeat visitors vs one-time ───────────────
CREATE OR REPLACE FUNCTION get_return_rate(
  p_company_id UUID,
  p_days INT DEFAULT 30,
  p_site_id UUID DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE(
  total_visitors BIGINT,
  repeat_visitors BIGINT,
  one_time_visitors BIGINT,
  return_rate_pct NUMERIC
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH window_visits AS (
    SELECT visitor_id
    FROM visits
    WHERE company_id = p_company_id
      AND status NOT IN ('cancelled', 'no_show')
      AND (p_site_id IS NULL OR site_id = p_site_id)
      AND (
        p_start_date IS NOT NULL
          AND visit_date >= p_start_date
          AND visit_date <= COALESCE(p_end_date, CURRENT_DATE)
        OR p_start_date IS NULL
          AND visit_date >= CURRENT_DATE - (p_days - 1)
      )
  ),
  counts AS (
    SELECT
      visitor_id,
      COUNT(*) AS visit_count
    FROM window_visits
    GROUP BY visitor_id
  )
  SELECT
    COUNT(*)::BIGINT                                        AS total_visitors,
    COUNT(*) FILTER (WHERE visit_count > 1)::BIGINT        AS repeat_visitors,
    COUNT(*) FILTER (WHERE visit_count = 1)::BIGINT        AS one_time_visitors,
    ROUND(
      100.0 * COUNT(*) FILTER (WHERE visit_count > 1)
        / NULLIF(COUNT(*), 0),
      1
    )                                                       AS return_rate_pct
  FROM counts;
$$;

-- ── get_avg_visit_duration: average minutes between check-in/out
CREATE OR REPLACE FUNCTION get_avg_visit_duration(
  p_company_id UUID,
  p_days INT DEFAULT 30,
  p_site_id UUID DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE(avg_minutes NUMERIC, completed_visits BIGINT)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    ROUND(AVG(EXTRACT(EPOCH FROM (check_out_at - check_in_at)) / 60.0), 1) AS avg_minutes,
    COUNT(*)::BIGINT AS completed_visits
  FROM visits
  WHERE company_id = p_company_id
    AND status = 'checked_out'
    AND check_in_at IS NOT NULL
    AND check_out_at IS NOT NULL
    AND (p_site_id IS NULL OR site_id = p_site_id)
    AND (
      p_start_date IS NOT NULL
        AND visit_date >= p_start_date
        AND visit_date <= COALESCE(p_end_date, CURRENT_DATE)
      OR p_start_date IS NULL
        AND visit_date >= CURRENT_DATE - (p_days - 1)
    );
$$;

-- ── RLS on audit_logs ─────────────────────────────────────────
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company members can view audit logs"
  ON audit_logs FOR SELECT
  USING (company_id = get_my_company_id());

CREATE POLICY "service role full access on audit_logs"
  ON audit_logs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
