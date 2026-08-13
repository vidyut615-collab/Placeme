-- Migration to add JSONB eligibility criteria to jobs

ALTER TABLE jobs
    ADD COLUMN IF NOT EXISTS eligibility_criteria JSONB DEFAULT '{}'::jsonb;
