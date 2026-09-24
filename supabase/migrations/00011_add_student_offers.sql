-- Migration to add student_offers table for official placement declarations
CREATE TABLE IF NOT EXISTS student_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    company_name TEXT NOT NULL,
    job_role TEXT NOT NULL,
    compensation_ctc NUMERIC NOT NULL,
    offer_type TEXT DEFAULT 'on_campus',
    offer_letter_url TEXT,
    status TEXT DEFAULT 'pending',
    rejection_reason TEXT,
    student_confirmed_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE student_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Colleges can view and manage student offers"
ON student_offers FOR ALL
USING (
  college_id = auth_college_id() OR auth_role() IN ('superadmin', 'agency_staff')
);

CREATE POLICY "Students can view own offers"
ON student_offers FOR SELECT
USING (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);

CREATE POLICY "Students can insert own offers"
ON student_offers FOR INSERT
WITH CHECK (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);
