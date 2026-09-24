-- Add 'completed' to job_status enum and completed_at column to jobs table
ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'completed';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
