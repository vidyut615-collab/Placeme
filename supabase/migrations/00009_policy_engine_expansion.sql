-- Migration for Policy Engine Expansion

-- 1. Add new application statuses (PostgreSQL syntax for adding enum values)
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'dropped';
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'forfeited';

-- 2. Add dropped_reason to applications
ALTER TABLE applications
    ADD COLUMN IF NOT EXISTS dropped_reason TEXT;

-- 3. Add policy_counters to students
ALTER TABLE students
    ADD COLUMN IF NOT EXISTS policy_counters JSONB DEFAULT '{"non_participation": 0, "no_shows": 0, "withdrawals": 0, "post_shortlist_withdrawals": 0, "disciplinary": 0, "integrity": 0, "offer_rejections": 0, "upgrades_used": 0}'::jsonb;
