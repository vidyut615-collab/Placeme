-- Add city to colleges
ALTER TABLE public.colleges ADD COLUMN IF NOT EXISTS city text;

-- Add new fields to jobs
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS ideal_for text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS is_all_colleges boolean DEFAULT true;

-- Create job_target_colleges junction table for distribution
CREATE TABLE IF NOT EXISTS public.job_target_colleges (
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (job_id, college_id)
);

-- RLS for job_target_colleges
ALTER TABLE public.job_target_colleges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access for job targets" 
ON public.job_target_colleges FOR SELECT 
USING (
  (auth_role() IN ('superadmin', 'agency_staff', 'agency_admin')) OR college_id = auth_college_id()
);

-- Agency can insert/update/delete
CREATE POLICY "Allow all access for agency"
ON public.job_target_colleges FOR ALL
USING (auth_role() IN ('superadmin', 'agency_staff', 'agency_admin'));
