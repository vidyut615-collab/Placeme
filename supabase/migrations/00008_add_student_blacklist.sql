-- Migration to add blacklist status to students

ALTER TABLE students
    ADD COLUMN IF NOT EXISTS is_blacklisted BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS blacklist_reason TEXT;
