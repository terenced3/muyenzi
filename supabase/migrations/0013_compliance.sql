-- ── Data retention setting on companies ──────────────────────
-- 0 = never auto-delete; otherwise delete visits older than N days
ALTER TABLE companies ADD COLUMN IF NOT EXISTS data_retention_days INT NOT NULL DEFAULT 0;

-- ── GDPR Privacy notice on companies ─────────────────────────
ALTER TABLE companies ADD COLUMN IF NOT EXISTS privacy_notice_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS privacy_notice_text TEXT;

-- ── Retention cleanup function (callable via server API) ──────
-- Deletes checked-out/cancelled/no-show visits older than the company's configured retention window.
-- Orphaned visitors (no remaining visits) are also cleaned up.
CREATE OR REPLACE FUNCTION run_retention_cleanup(p_company_id UUID)
RETURNS TABLE(visits_deleted BIGINT, visitors_deleted BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_days INT;
  v_visits BIGINT;
  v_visitors BIGINT;
BEGIN
  SELECT data_retention_days INTO v_days
  FROM companies WHERE id = p_company_id;

  IF v_days IS NULL OR v_days = 0 THEN
    RETURN QUERY SELECT 0::BIGINT, 0::BIGINT;
    RETURN;
  END IF;

  -- Delete old terminal visits
  WITH deleted AS (
    DELETE FROM visits
    WHERE company_id = p_company_id
      AND status IN ('checked_out', 'cancelled', 'no_show')
      AND created_at < NOW() - (v_days || ' days')::INTERVAL
    RETURNING visitor_id
  )
  SELECT COUNT(*) INTO v_visits FROM deleted;

  -- Delete visitors with no remaining visits in this company
  WITH orphans AS (
    DELETE FROM visitors v
    WHERE v.company_id = p_company_id
      AND NOT EXISTS (
        SELECT 1 FROM visits vi
        WHERE vi.visitor_id = v.id
      )
    RETURNING id
  )
  SELECT COUNT(*) INTO v_visitors FROM orphans;

  RETURN QUERY SELECT v_visits, v_visitors;
END;
$$;

-- ── pg_cron: nightly cleanup at 02:00 UTC (requires pg_cron extension) ───────
-- Uncomment if pg_cron is available in your Supabase project:
-- SELECT cron.schedule(
--   'nightly-retention-cleanup',
--   '0 2 * * *',
--   $$
--     SELECT run_retention_cleanup(id)
--     FROM companies
--     WHERE data_retention_days > 0;
--   $$
-- );
