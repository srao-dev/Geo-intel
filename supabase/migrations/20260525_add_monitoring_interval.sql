-- Add monitoring interval columns to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS monitoring_interval TEXT DEFAULT 'manual';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS last_tracked_at TIMESTAMP;

-- Add constraint to ensure valid values (if it doesn't already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'monitoring_interval_check'
  ) THEN
    ALTER TABLE companies ADD CONSTRAINT monitoring_interval_check
      CHECK (monitoring_interval IN ('daily', 'weekly', 'monthly', 'manual'));
  END IF;
END $$;
