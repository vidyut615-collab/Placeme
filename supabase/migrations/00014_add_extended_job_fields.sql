-- Migration 00014: Add extended job board fields to jobs table
ALTER TABLE jobs
    ADD COLUMN IF NOT EXISTS workplace_mode TEXT DEFAULT 'On-Site',
    ADD COLUMN IF NOT EXISTS job_location TEXT,
    ADD COLUMN IF NOT EXISTS employment_type TEXT DEFAULT 'Full-time',
    ADD COLUMN IF NOT EXISTS internship_stipend NUMERIC,
    ADD COLUMN IF NOT EXISTS internship_duration TEXT,
    ADD COLUMN IF NOT EXISTS has_bond BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS bond_duration TEXT,
    ADD COLUMN IF NOT EXISTS bond_penalty_amount NUMERIC,
    ADD COLUMN IF NOT EXISTS job_domain TEXT,
    ADD COLUMN IF NOT EXISTS skills_required TEXT,
    ADD COLUMN IF NOT EXISTS drive_mode TEXT DEFAULT 'Virtual / Online',
    ADD COLUMN IF NOT EXISTS jd_attachment_url TEXT,
    ADD COLUMN IF NOT EXISTS jd_attachment_name TEXT;
