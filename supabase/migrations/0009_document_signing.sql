-- Document Templates: admin-customizable NDA/policy documents per company
CREATE TABLE document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company members can read templates"
  ON document_templates FOR SELECT
  USING (company_id = get_my_company_id());

CREATE POLICY "admins and site managers can manage templates"
  ON document_templates FOR ALL
  USING (
    company_id = get_my_company_id()
    AND get_my_role() IN ('admin', 'site_manager')
  )
  WITH CHECK (
    company_id = get_my_company_id()
    AND get_my_role() IN ('admin', 'site_manager')
  );

-- Service role bypass for server-side API
CREATE POLICY "service role full access on document_templates"
  ON document_templates FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Document Signatures: one record per visitor per template per visit
CREATE TABLE document_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES document_templates(id) ON DELETE CASCADE,
  visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  visitor_id UUID NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
  signature_data TEXT NOT NULL,
  pre_signed BOOLEAN NOT NULL DEFAULT false,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (template_id, visit_id)
);

ALTER TABLE document_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company members can read signatures"
  ON document_signatures FOR SELECT
  USING (company_id = get_my_company_id());

CREATE POLICY "service role full access on document_signatures"
  ON document_signatures FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Auto-update updated_at on document_templates
CREATE OR REPLACE FUNCTION update_document_template_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_document_templates_updated_at
  BEFORE UPDATE ON document_templates
  FOR EACH ROW EXECUTE FUNCTION update_document_template_updated_at();
