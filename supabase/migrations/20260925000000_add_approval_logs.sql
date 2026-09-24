CREATE TYPE approval_log_status AS ENUM ('approved', 'rejected', 'revoked');
CREATE TYPE approval_entity_type AS ENUM ('placement_offer', 'profile_audit');

CREATE TABLE public.approval_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    entity_type approval_entity_type NOT NULL,
    entity_id UUID NOT NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
    action_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    status approval_log_status NOT NULL,
    reason TEXT,
    snapshot_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.approval_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Colleges can view their own approval logs"
ON public.approval_logs FOR SELECT
USING (
  college_id = auth_college_id() OR auth_role() IN ('superadmin', 'agency_staff')
);

CREATE POLICY "Colleges can insert their own approval logs"
ON public.approval_logs FOR INSERT
WITH CHECK (
  college_id = auth_college_id() OR auth_role() IN ('superadmin', 'agency_staff')
);
