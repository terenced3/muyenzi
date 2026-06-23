-- ============================================================
-- Badge Settings
-- Per-company customisation for the printed visitor badge.
-- ============================================================

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS badge_settings JSONB NOT NULL DEFAULT '{}';

-- Shape of badge_settings:
-- {
--   "accent_color":    string   (hex, default #1f2937)
--   "header_text":     string   (default "VISITOR")
--   "show_purpose":    boolean  (default false)
--   "show_access_code": boolean (default true)
-- }
