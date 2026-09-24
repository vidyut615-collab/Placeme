-- Add 'cancelled' to job_status and application_status enums
ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'cancelled';
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'cancelled';

-- Add cancellation metadata to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
