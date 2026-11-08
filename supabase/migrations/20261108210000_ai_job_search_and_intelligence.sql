-- =============================================================================
-- Migration: AI Job Search, Discovered Jobs Lake & TPO Readiness Intelligence
-- Date: 2026-11-08
-- =============================================================================

-- 1. Discovered Jobs Lake (Shared repository of sanitized off-campus jobs)
CREATE TABLE IF NOT EXISTS public.discovered_jobs_lake (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canonical_key TEXT UNIQUE NOT NULL,      -- Generated via deterministic company + title normalization
    title TEXT NOT NULL,
    company_name TEXT NOT NULL,
    location TEXT DEFAULT 'Mumbai, Maharashtra, India',
    workplace_mode TEXT DEFAULT 'hybrid',     -- 'on-site', 'remote', 'hybrid'
    employment_type TEXT DEFAULT 'full-time', -- 'full-time', 'internship'
    description TEXT NOT NULL,               -- Cleaned & sanitized JD
    content_hash TEXT NOT NULL,              -- md5 hash of description for drift tracking
    primary_role TEXT,                       -- e.g. 'Frontend Developer'
    skills_required TEXT[] DEFAULT '{}',
    salary_info TEXT,
    sources JSONB NOT NULL DEFAULT '[]',     -- [{ portal: 'linkedin', url: '...', discovered_at: '...' }]
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'expired')),
    scam_status TEXT DEFAULT 'clean' CHECK (scam_status IN ('clean', 'suspicious', 'scam')),
    scam_reasons TEXT[] DEFAULT '{}',
    last_verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discovered_jobs_canonical ON public.discovered_jobs_lake(canonical_key);
CREATE INDEX IF NOT EXISTS idx_discovered_jobs_skills ON public.discovered_jobs_lake USING GIN(skills_required);
CREATE INDEX IF NOT EXISTS idx_discovered_jobs_status ON public.discovered_jobs_lake(status);
CREATE INDEX IF NOT EXISTS idx_discovered_jobs_scam ON public.discovered_jobs_lake(scam_status);

-- 2. Student Job Search Sessions (Audit trail of credit expenditures)
CREATE TABLE IF NOT EXISTS public.job_search_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    resume_id UUID REFERENCES public.ai_resumes(id) ON DELETE SET NULL,
    search_query TEXT NOT NULL,
    location TEXT NOT NULL,
    results_count INT DEFAULT 0,
    job_limit INT DEFAULT 5,
    credits_spent INT NOT NULL DEFAULT 10,
    job_ids UUID[] DEFAULT '{}',
    scored_results JSONB DEFAULT '[]',
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_search_sessions_student ON public.job_search_sessions(student_id);

-- 3. Job Match Analyses (Tailoring suggestions, cover letters, and gap reports)
CREATE TABLE IF NOT EXISTS public.job_match_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    resume_id UUID NOT NULL REFERENCES public.ai_resumes(id) ON DELETE CASCADE,
    job_lake_id UUID NOT NULL REFERENCES public.discovered_jobs_lake(id) ON DELETE CASCADE,
    match_score INT NOT NULL,                -- 0-100
    matching_skills TEXT[] DEFAULT '{}',
    missing_skills TEXT[] DEFAULT '{}',
    tailoring_suggestions JSONB DEFAULT '[]', -- [{ section: 'projects', suggestion: '...' }]
    upskill_roadmap JSONB DEFAULT '[]',       -- [{ skill: 'Docker', duration: '2 days', url: '...' }]
    cover_letter TEXT,
    credits_spent INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, resume_id, job_lake_id)
);

CREATE INDEX IF NOT EXISTS idx_job_match_student_resume ON public.job_match_analyses(student_id, resume_id);

-- 4. TPO Batch Readiness Reports
CREATE TABLE IF NOT EXISTS public.tpo_readiness_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    report_mode TEXT NOT NULL CHECK (report_mode IN ('single_job', 'pool')),
    target_batch_year INT NOT NULL,
    target_branches TEXT[] DEFAULT '{}',
    analyzed_jobs JSONB NOT NULL,            -- [{ title, company, skills }]
    batch_size INT NOT NULL,
    ready_count INT NOT NULL,                -- Students >= 70% match
    avg_match_score NUMERIC(5, 2) NOT NULL,
    skill_coverage_heatmap JSONB NOT NULL,   -- [{ skill: 'React', have_count: 140, pct: 70 }]
    recommended_workshops JSONB NOT NULL,    -- [{ topic: 'Docker', uplift_potential: 80 }]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tpo_readiness_college ON public.tpo_readiness_reports(college_id);

-- =============================================================================
-- Row Level Security (RLS)
-- =============================================================================

ALTER TABLE public.discovered_jobs_lake ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_search_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_match_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tpo_readiness_reports ENABLE ROW LEVEL SECURITY;

-- 1. discovered_jobs_lake
-- Authenticated users (students, colleges, agencies) can view non-scam, active jobs
CREATE POLICY "Authenticated users can view verified active jobs"
ON public.discovered_jobs_lake
FOR SELECT
TO authenticated
USING (true);

-- Agency and Service Role can manage discovered jobs
CREATE POLICY "Agency can manage discovered jobs lake"
ON public.discovered_jobs_lake
FOR ALL
TO authenticated
USING (
    COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('agency_admin', 'agency_staff', 'superadmin')
)
WITH CHECK (
    COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('agency_admin', 'agency_staff', 'superadmin')
);

-- 2. job_search_sessions
CREATE POLICY "Students can view and create own search sessions"
ON public.job_search_sessions
FOR ALL
TO authenticated
USING (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
    OR COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('agency_admin', 'agency_staff', 'superadmin')
)
WITH CHECK (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
    OR COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('agency_admin', 'agency_staff', 'superadmin')
);

-- 3. job_match_analyses
CREATE POLICY "Students can manage own job match analyses"
ON public.job_match_analyses
FOR ALL
TO authenticated
USING (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
    OR COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('agency_admin', 'agency_staff', 'superadmin')
)
WITH CHECK (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
    OR COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('agency_admin', 'agency_staff', 'superadmin')
);

-- 4. tpo_readiness_reports
CREATE POLICY "College Staff and Admins can manage own readiness reports"
ON public.tpo_readiness_reports
FOR ALL
TO authenticated
USING (
    college_id IN (SELECT college_id FROM public.users WHERE id = auth.uid())
    OR COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('agency_admin', 'agency_staff', 'superadmin')
)
WITH CHECK (
    college_id IN (SELECT college_id FROM public.users WHERE id = auth.uid())
    OR COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('agency_admin', 'agency_staff', 'superadmin')
);
