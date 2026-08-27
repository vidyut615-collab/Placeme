-- Migration: Profile Audit Requests

CREATE TYPE profile_update_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE profile_update_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    proposed_profile_data JSONB NOT NULL,
    status profile_update_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE profile_update_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency can do all on profile_update_requests" 
    ON profile_update_requests FOR ALL 
    USING (auth_role() IN ('superadmin', 'agency_staff'));

CREATE POLICY "College Staff can manage own college profile_update_requests" 
    ON profile_update_requests FOR ALL 
    USING (college_id = auth_college_id());

CREATE POLICY "Students can view and create own profile_update_requests" 
    ON profile_update_requests FOR ALL 
    USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

-- Also, ensure placement_policies config allows 'profile_audit_enabled' by default (handled in app logic)
