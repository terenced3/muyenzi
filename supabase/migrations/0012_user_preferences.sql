-- ── Timezone on companies ─────────────────────────────────────
ALTER TABLE companies ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'Africa/Harare';

-- ── Notification preferences on users ─────────────────────────
-- visitor_arrived: in-app + email when a visitor checks in as host
-- daily_summary:   daily digest of visit activity
-- pre_arrival:     email reminder when a visit is created for you
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_prefs JSONB NOT NULL DEFAULT '{
  "visitor_arrived_inapp": true,
  "visitor_arrived_email": true,
  "pre_arrival_email": false,
  "daily_summary_email": false
}'::jsonb;
