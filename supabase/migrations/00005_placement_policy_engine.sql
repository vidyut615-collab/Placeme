-- ============================================================
-- MIGRATION 00005: Placement Policy Engine
-- Supports all 20 Truskill configurable placement policies
-- ============================================================

-- 1. EXPAND APPLICATION STATUS ENUM
-- Add new lifecycle statuses for comprehensive tracking
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'selected';
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'offer_accepted';
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'offer_declined';
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'joined';
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'not_joined';
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'withdrawn';
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'rejected';

-- 2. NEW ENUMS
CREATE TYPE registration_status AS ENUM ('registered', 'eligible', 'blocked', 'opted_out', 'withdrawn');
CREATE TYPE attendance_status AS ENUM ('attended', 'absent', 'excused');
CREATE TYPE training_status AS ENUM ('not_started', 'in_progress', 'completed');
CREATE TYPE override_status AS ENUM ('active', 'expired', 'revoked');

-- 3. PLACEMENT CYCLES
CREATE TABLE placement_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. STUDENT REGISTRATIONS (Policy #1)
CREATE TABLE student_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    cycle_id UUID NOT NULL REFERENCES placement_cycles(id) ON DELETE CASCADE,
    status registration_status DEFAULT 'registered',
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (student_id, cycle_id)
);

-- 5. JOB TYPES (Policy #8) — College-defined classifications
CREATE TABLE job_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PLACEMENT LEVELS (Policy #9) — College-defined tiers
CREATE TABLE placement_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    rank INTEGER NOT NULL DEFAULT 0,
    min_ctc NUMERIC,
    max_ctc NUMERIC,
    is_dream BOOLEAN DEFAULT FALSE,
    is_super_dream BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PLACEMENT CATEGORIES (Policy #10) — Sub-categories under levels
CREATE TABLE placement_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    level_id UUID REFERENCES placement_levels(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    rank INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. RECRUITMENT EVENTS (Policy #5) — Events per job
CREATE TABLE recruitment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,  -- 'ppt', 'assessment', 'gd', 'technical_interview', 'hr_interview', 'final_interview', 'custom'
    title TEXT NOT NULL,
    description TEXT,
    scheduled_at TIMESTAMPTZ,
    location TEXT,
    is_mandatory BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. EVENT ATTENDANCE (Policy #5) — Student attendance tracking
CREATE TABLE event_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES recruitment_events(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    status attendance_status DEFAULT 'absent',
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (event_id, student_id)
);

-- 10. TRAINING MODULES (Policy #18) — College-defined readiness requirements
CREATE TABLE training_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_mandatory BOOLEAN DEFAULT FALSE,
    min_score NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. STUDENT TRAINING PROGRESS (Policy #18)
CREATE TABLE student_training_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
    status training_status DEFAULT 'not_started',
    score NUMERIC,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (student_id, module_id)
);

-- 12. POLICY OVERRIDES (Policy #20) — T&P admin override with audit trail
CREATE TABLE policy_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    policy_type TEXT NOT NULL,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    approved_by UUID REFERENCES users(id),
    status override_status DEFAULT 'active',
    effective_from TIMESTAMPTZ DEFAULT NOW(),
    effective_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. APPLICATION STAGE HISTORY (Policy #4, #16, #17, #20) — Audit trail
CREATE TABLE application_stage_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    from_status TEXT,
    to_status TEXT NOT NULL,
    changed_by UUID REFERENCES users(id),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. EXPAND JOBS TABLE
ALTER TABLE jobs
    ADD COLUMN IF NOT EXISTS company_name TEXT,
    ADD COLUMN IF NOT EXISTS compensation_ctc NUMERIC,
    ADD COLUMN IF NOT EXISTS compensation_fixed NUMERIC,
    ADD COLUMN IF NOT EXISTS compensation_variable NUMERIC,
    ADD COLUMN IF NOT EXISTS job_type_id UUID REFERENCES job_types(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS placement_level_id UUID REFERENCES placement_levels(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS placement_category_id UUID REFERENCES placement_categories(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS cycle_id UUID REFERENCES placement_cycles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS application_deadline TIMESTAMPTZ;

-- 15. EXPAND APPLICATIONS TABLE
ALTER TABLE applications
    ADD COLUMN IF NOT EXISTS is_withdrawn BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS withdrawal_reason TEXT,
    ADD COLUMN IF NOT EXISTS withdrawn_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS offer_amount NUMERIC,
    ADD COLUMN IF NOT EXISTS offer_accepted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS offer_declined_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS offer_deadline TIMESTAMPTZ;

-- ============================================================
-- ROW LEVEL SECURITY FOR NEW TABLES
-- ============================================================

ALTER TABLE placement_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE placement_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE placement_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_stage_history ENABLE ROW LEVEL SECURITY;

-- PLACEMENT CYCLES RLS
CREATE POLICY "Agency can do all on placement_cycles" ON placement_cycles FOR ALL USING (auth_role() IN ('superadmin', 'agency_staff'));
CREATE POLICY "College can manage own placement_cycles" ON placement_cycles FOR ALL USING (college_id = auth_college_id());
CREATE POLICY "Students can view own college cycles" ON placement_cycles FOR SELECT USING (college_id = auth_college_id() AND auth_role() = 'student');

-- STUDENT REGISTRATIONS RLS
CREATE POLICY "Agency can do all on student_registrations" ON student_registrations FOR ALL USING (auth_role() IN ('superadmin', 'agency_staff'));
CREATE POLICY "College can manage registrations" ON student_registrations FOR ALL USING (
    student_id IN (SELECT id FROM students WHERE college_id = auth_college_id())
);
CREATE POLICY "Students can view own registrations" ON student_registrations FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);

-- JOB TYPES RLS
CREATE POLICY "Agency can do all on job_types" ON job_types FOR ALL USING (auth_role() IN ('superadmin', 'agency_staff'));
CREATE POLICY "College can manage own job_types" ON job_types FOR ALL USING (college_id = auth_college_id());
CREATE POLICY "Students can view own college job_types" ON job_types FOR SELECT USING (college_id = auth_college_id() AND auth_role() = 'student');

-- PLACEMENT LEVELS RLS
CREATE POLICY "Agency can do all on placement_levels" ON placement_levels FOR ALL USING (auth_role() IN ('superadmin', 'agency_staff'));
CREATE POLICY "College can manage own placement_levels" ON placement_levels FOR ALL USING (college_id = auth_college_id());
CREATE POLICY "Students can view own college placement_levels" ON placement_levels FOR SELECT USING (college_id = auth_college_id() AND auth_role() = 'student');

-- PLACEMENT CATEGORIES RLS
CREATE POLICY "Agency can do all on placement_categories" ON placement_categories FOR ALL USING (auth_role() IN ('superadmin', 'agency_staff'));
CREATE POLICY "College can manage own placement_categories" ON placement_categories FOR ALL USING (college_id = auth_college_id());
CREATE POLICY "Students can view own college placement_categories" ON placement_categories FOR SELECT USING (college_id = auth_college_id() AND auth_role() = 'student');

-- RECRUITMENT EVENTS RLS
CREATE POLICY "Agency can do all on recruitment_events" ON recruitment_events FOR ALL USING (auth_role() IN ('superadmin', 'agency_staff'));
CREATE POLICY "College can manage events for own jobs" ON recruitment_events FOR ALL USING (
    job_id IN (SELECT id FROM jobs WHERE college_id = auth_college_id())
);
CREATE POLICY "Students can view events for accessible jobs" ON recruitment_events FOR SELECT USING (
    job_id IN (SELECT id FROM jobs WHERE status = 'active' AND (college_id IS NULL OR college_id = auth_college_id()))
);

-- EVENT ATTENDANCE RLS
CREATE POLICY "Agency can do all on event_attendance" ON event_attendance FOR ALL USING (auth_role() IN ('superadmin', 'agency_staff'));
CREATE POLICY "College can manage attendance for own events" ON event_attendance FOR ALL USING (
    event_id IN (SELECT re.id FROM recruitment_events re JOIN jobs j ON re.job_id = j.id WHERE j.college_id = auth_college_id())
);
CREATE POLICY "Students can view own attendance" ON event_attendance FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);

-- TRAINING MODULES RLS
CREATE POLICY "Agency can do all on training_modules" ON training_modules FOR ALL USING (auth_role() IN ('superadmin', 'agency_staff'));
CREATE POLICY "College can manage own training_modules" ON training_modules FOR ALL USING (college_id = auth_college_id());
CREATE POLICY "Students can view own college training_modules" ON training_modules FOR SELECT USING (college_id = auth_college_id() AND auth_role() = 'student');

-- STUDENT TRAINING PROGRESS RLS
CREATE POLICY "Agency can do all on student_training_progress" ON student_training_progress FOR ALL USING (auth_role() IN ('superadmin', 'agency_staff'));
CREATE POLICY "College can manage training progress" ON student_training_progress FOR ALL USING (
    student_id IN (SELECT id FROM students WHERE college_id = auth_college_id())
);
CREATE POLICY "Students can view and update own progress" ON student_training_progress FOR ALL USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);

-- POLICY OVERRIDES RLS
CREATE POLICY "Agency can do all on policy_overrides" ON policy_overrides FOR ALL USING (auth_role() IN ('superadmin', 'agency_staff'));
CREATE POLICY "College admin can manage own overrides" ON policy_overrides FOR ALL USING (college_id = auth_college_id() AND auth_role() = 'college_admin');
CREATE POLICY "College staff can view own overrides" ON policy_overrides FOR SELECT USING (college_id = auth_college_id());

-- APPLICATION STAGE HISTORY RLS
CREATE POLICY "Agency can do all on application_stage_history" ON application_stage_history FOR ALL USING (auth_role() IN ('superadmin', 'agency_staff'));
CREATE POLICY "College can view history for own apps" ON application_stage_history FOR ALL USING (
    application_id IN (
        SELECT a.id FROM applications a
        JOIN jobs j ON a.job_id = j.id
        WHERE j.college_id = auth_college_id()
    )
    OR application_id IN (
        SELECT a.id FROM applications a
        JOIN students s ON a.student_id = s.id
        WHERE s.college_id = auth_college_id()
    )
);
CREATE POLICY "Students can view own stage history" ON application_stage_history FOR SELECT USING (
    application_id IN (
        SELECT a.id FROM applications a
        JOIN students s ON a.student_id = s.id
        WHERE s.user_id = auth.uid()
    )
);
