-- ============================================================
-- Visitor Custom Fields
-- ============================================================

-- Field definitions per company
CREATE TABLE visitor_custom_fields (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  label        TEXT NOT NULL,
  field_key    TEXT NOT NULL,
  field_type   TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'textarea', 'select')),
  options      JSONB,          -- array of strings, only used when field_type = 'select'
  required     BOOLEAN NOT NULL DEFAULT false,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, field_key)
);

CREATE INDEX visitor_custom_fields_company_id_idx ON visitor_custom_fields(company_id);

-- Store values per visit
ALTER TABLE visits ADD COLUMN custom_field_values JSONB;

-- RLS
ALTER TABLE visitor_custom_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company members can read their custom fields"
  ON visitor_custom_fields FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "admins can manage custom fields"
  ON visitor_custom_fields FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'site_manager')
    )
  );
