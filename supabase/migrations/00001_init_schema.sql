-- ENUMS
CREATE TYPE user_role AS ENUM ('superadmin', 'agency_staff', 'college_admin', 'college_staff', 'student');
CREATE TYPE job_status AS ENUM ('active', 'paused', 'deleted');
CREATE TYPE application_status AS ENUM ('applied', 'shortlisted', 'interviewing', 'offered', 'hired');
CREATE TYPE student_onboarding_status AS ENUM ('invited', 'completed');

-- COLLEGES
CREATE TABLE colleges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- USERS (Extends auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL,
    college_id UUID REFERENCES colleges(id) ON DELETE CASCADE, -- NULL for Agency users
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STUDENTS (Profile Data)
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    profile_data JSONB DEFAULT '{}'::jsonb,
    onboarding_status student_onboarding_status DEFAULT 'invited',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- JOBS
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    college_id UUID REFERENCES colleges(id) ON DELETE CASCADE, -- NULL means Agency global job
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status job_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- APPLICATIONS
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    status application_status DEFAULT 'applied',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (job_id, student_id)
);

-- PLACEMENT POLICIES
CREATE TABLE placement_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID UNIQUE NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE placement_policies ENABLE ROW LEVEL SECURITY;

-- Helper functions for reading JWT app_metadata
CREATE OR REPLACE FUNCTION auth_role() RETURNS text AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.app_metadata', true)::json->>'role', '');
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION auth_college_id() RETURNS uuid AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.app_metadata', true)::json->>'college_id', '')::uuid;
$$ LANGUAGE sql STABLE;

-- 1. COLLEGES RLS
-- Agency: All. College Staff: Own college. Student: Own college.
CREATE POLICY "Agency can do all on colleges" ON colleges FOR ALL USING (auth_role() IN ('superadmin', 'agency_staff'));
CREATE POLICY "College Staff can view own college" ON colleges FOR SELECT USING (id = auth_college_id());
CREATE POLICY "Students can view own college" ON colleges FOR SELECT USING (id = auth_college_id() AND auth_role() = 'student');

-- 2. USERS RLS
-- Agency: All. College Staff: Users in same college. Student: Own user record.
CREATE POLICY "Agency can do all on users" ON users FOR ALL USING (auth_role() IN ('superadmin', 'agency_staff'));
CREATE POLICY "College Staff can view users in same college" ON users FOR SELECT USING (college_id = auth_college_id());
CREATE POLICY "Users can view and edit own record" ON users FOR ALL USING (id = auth.uid());

-- 3. STUDENTS RLS
-- Agency: All. College Staff: Students in same college. Student: Own record.
CREATE POLICY "Agency can do all on students" ON students FOR ALL USING (auth_role() IN ('superadmin', 'agency_staff'));
CREATE POLICY "College Staff can manage students in same college" ON students FOR ALL USING (college_id = auth_college_id());
CREATE POLICY "Students can view and edit own profile" ON students FOR ALL USING (user_id = auth.uid());

-- 4. JOBS RLS
-- Agency: All. College Staff: Can view all agency jobs (college_id IS NULL) and manage own college jobs. Student: Can view agency jobs and own college jobs.
CREATE POLICY "Agency can do all on jobs" ON jobs FOR ALL USING (auth_role() IN ('superadmin', 'agency_staff'));
CREATE POLICY "College Staff can manage own college jobs" ON jobs FOR ALL USING (college_id = auth_college_id());
CREATE POLICY "College Staff can view agency jobs" ON jobs FOR SELECT USING (college_id IS NULL);
CREATE POLICY "Students can view agency jobs and own college jobs" ON jobs FOR SELECT USING (status = 'active' AND (college_id IS NULL OR college_id = auth_college_id()));

-- 5. APPLICATIONS RLS
-- Agency: All. College Staff: Applications for jobs in own college or students in own college. Student: Own applications.
CREATE POLICY "Agency can do all on applications" ON applications FOR ALL USING (auth_role() IN ('superadmin', 'agency_staff'));
CREATE POLICY "College Staff can view and manage applications for own college jobs" ON applications FOR ALL USING (
    job_id IN (SELECT id FROM jobs WHERE college_id = auth_college_id())
    OR student_id IN (SELECT id FROM students WHERE college_id = auth_college_id())
);
CREATE POLICY "Students can manage own applications" ON applications FOR ALL USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);

-- 6. PLACEMENT POLICIES RLS
-- Agency: All. College Admin: Manage own. College Staff: View own.
CREATE POLICY "Agency can do all on placement policies" ON placement_policies FOR ALL USING (auth_role() IN ('superadmin', 'agency_staff'));
CREATE POLICY "College Admin can manage own placement policies" ON placement_policies FOR ALL USING (college_id = auth_college_id() AND auth_role() = 'college_admin');
CREATE POLICY "College Staff and Students can view own placement policies" ON placement_policies FOR SELECT USING (college_id = auth_college_id());
