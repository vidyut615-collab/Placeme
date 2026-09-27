CREATE TABLE IF NOT EXISTS student_penalty_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'blacklisted' or 'reinstated'
    policy_code VARCHAR(50), -- e.g. 'NO_SHOW', 'MAX_WITHDRAWALS', 'MANUAL_STRIKE', 'APPEAL_APPROVED'
    metadata JSONB DEFAULT '{}'::jsonb, -- e.g. { triggering_job_id, threshold_at_the_time, admin_note }
    action_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- who did it (if manual)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE student_penalty_logs ENABLE ROW LEVEL SECURITY;

-- Students can read their own logs
CREATE POLICY "Students can view own penalty logs" ON student_penalty_logs
FOR SELECT TO authenticated
USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);

-- College Staff/Admin can view and insert logs for students in their college
CREATE POLICY "College staff can manage penalty logs" ON student_penalty_logs
FOR ALL TO authenticated
USING (
    student_id IN (SELECT id FROM students WHERE college_id = auth_college_id())
    AND auth_role() IN ('college_admin', 'college_staff')
);

-- Agency/Superadmin can do all
CREATE POLICY "Agency can manage all penalty logs" ON student_penalty_logs
FOR ALL TO authenticated
USING (
    auth_role() IN ('superadmin', 'agency_staff', 'agency_admin')
);
