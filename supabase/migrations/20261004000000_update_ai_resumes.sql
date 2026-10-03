-- Update ai_resumes table to support the new AI Pipeline flow

ALTER TABLE ai_resumes 
ADD COLUMN IF NOT EXISTS target_employer TEXT,
ADD COLUMN IF NOT EXISTS target_role TEXT,
ADD COLUMN IF NOT EXISTS job_description TEXT,
ADD COLUMN IF NOT EXISTS shortened_jd TEXT;

-- Update the RLS to ensure these new columns are properly accessible by the student
-- (The existing "Students fully control their own AI resumes" policy covers this automatically)
