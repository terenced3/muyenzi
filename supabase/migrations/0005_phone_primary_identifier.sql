-- Make phone_number required and unique per company
-- This makes phone the primary identifier for visitors in Zimbabwe

-- Drop existing non-null constraint if needed
ALTER TABLE visitors
  ALTER COLUMN phone SET NOT NULL;

-- Add unique constraint on (company_id, phone)
-- This prevents duplicate visitors with same phone in same company
ALTER TABLE visitors
  ADD CONSTRAINT visitors_company_phone_unique UNIQUE (company_id, phone);

-- Create index for faster phone lookups
CREATE INDEX idx_visitors_company_phone ON visitors(company_id, phone);

-- Add comment explaining the change
COMMENT ON COLUMN visitors.phone IS 'Required field - Primary identifier for Zimbabwe market where phone is more reliable than email';
