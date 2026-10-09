-- =============================================================================
-- MIGRATION: RLS Cleanup - Replacing user table lookups with auth_role()
-- Date: 2026-10-09
-- =============================================================================

-- 1. approval_logs
DROP POLICY IF EXISTS "Colleges can view their own approval logs" ON public.approval_logs;
CREATE POLICY "Colleges can view their own approval logs" ON public.approval_logs
  FOR SELECT USING (
    college_id = auth_college_id() OR auth_role() IN ('superadmin', 'agency_staff')
  );

DROP POLICY IF EXISTS "Colleges can insert their own approval logs" ON public.approval_logs;
CREATE POLICY "Colleges can insert their own approval logs" ON public.approval_logs
  FOR INSERT WITH CHECK (
    college_id = auth_college_id() OR auth_role() IN ('superadmin', 'agency_staff')
  );

-- 2. certificates
DROP POLICY IF EXISTS "College admins can manage certificates for their students" ON public.certificates;
CREATE POLICY "College admins can manage certificates for their students" ON public.certificates
  FOR ALL USING (
    auth_role() = 'college_admin' AND 
    EXISTS (
      SELECT 1 FROM students WHERE students.user_id = certificates.user_id AND students.college_id = auth_college_id()
    )
  );

DROP POLICY IF EXISTS "Agency admins can manage certificates" ON public.certificates;
CREATE POLICY "Agency admins can manage certificates" ON public.certificates
  FOR ALL USING (auth_role() = 'agency_admin');

-- 3. credit_ledgers
DROP POLICY IF EXISTS "Agency admins have full access to credit ledgers" ON public.credit_ledgers;
CREATE POLICY "Agency admins have full access to credit ledgers" ON public.credit_ledgers
  FOR ALL USING (auth_role() = 'agency_admin');

-- 4. payment_requests
DROP POLICY IF EXISTS "Agency admins have full access to payment requests" ON public.payment_requests;
CREATE POLICY "Agency admins have full access to payment requests" ON public.payment_requests
  FOR ALL USING (auth_role() = 'agency_admin');

-- 5. platform_master_data
DROP POLICY IF EXISTS "Allow full access to agency on platform_master_data" ON public.platform_master_data;
CREATE POLICY "Allow full access to agency on platform_master_data" ON public.platform_master_data
  FOR ALL USING (auth_role() IN ('superadmin', 'agency_staff', 'agency_admin'));

-- 6. platform_settings
DROP POLICY IF EXISTS "Allow superadmin update on platform_settings" ON public.platform_settings;
CREATE POLICY "Allow superadmin update on platform_settings" ON public.platform_settings
  FOR UPDATE USING (auth_role() = 'superadmin');

-- 7. student_penalty_logs
DROP POLICY IF EXISTS "College staff can manage penalty logs" ON public.student_penalty_logs;
CREATE POLICY "College staff can manage penalty logs" ON public.student_penalty_logs
  FOR ALL USING (
    auth_role() IN ('college_admin', 'college_staff') AND
    student_id IN (SELECT id FROM students WHERE college_id = auth_college_id())
  );

DROP POLICY IF EXISTS "Agency can manage all penalty logs" ON public.student_penalty_logs;
CREATE POLICY "Agency can manage all penalty logs" ON public.student_penalty_logs
  FOR ALL USING (auth_role() IN ('superadmin', 'agency_staff', 'agency_admin'));

-- Drop the policy giving everyone public list access
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
-- Recreate it safely
CREATE POLICY "Public Read Access" ON storage.objects FOR SELECT USING (bucket_id = 'documents' AND auth.uid() = owner);
