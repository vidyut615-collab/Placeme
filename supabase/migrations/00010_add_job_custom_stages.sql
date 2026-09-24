-- Migration to add custom_stages JSONB to jobs
ALTER TABLE jobs
    ADD COLUMN IF NOT EXISTS custom_stages JSONB DEFAULT '{}'::jsonb;
