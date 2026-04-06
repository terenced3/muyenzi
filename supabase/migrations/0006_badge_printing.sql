-- Add printer settings to sites table
ALTER TABLE sites ADD COLUMN IF NOT EXISTS printer_enabled BOOLEAN DEFAULT true;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS printer_model VARCHAR(255);

-- Create table to log badge print jobs for audit
CREATE TABLE IF NOT EXISTS print_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  printed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) DEFAULT 'sent', -- sent, failed, completed
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for quick lookups
CREATE INDEX idx_print_logs_company_id ON print_logs(company_id);
CREATE INDEX idx_print_logs_site_id ON print_logs(site_id);
CREATE INDEX idx_print_logs_visit_id ON print_logs(visit_id);
CREATE INDEX idx_print_logs_printed_at ON print_logs(printed_at);

-- Enable RLS
ALTER TABLE print_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see print logs from their company
CREATE POLICY "Users can view print logs for their company" ON print_logs
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Policy: Service role can insert print logs
CREATE POLICY "Service role can insert print logs" ON print_logs
  FOR INSERT WITH CHECK (true);
