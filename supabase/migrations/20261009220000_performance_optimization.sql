-- =============================================================================
-- MIGRATION: Performance Optimization - Part 1: RLS Policy Fixes
-- Date: 2026-10-09
-- Description: Fix 27 RLS policies that re-evaluate auth.uid()/auth.jwt() per row
--
-- SECURITY: No changes to access rules. Only optimizer hints (SELECT wrappers).
-- =============================================================================

-- 1. users: "Users can view and edit own record"
DROP POLICY IF EXISTS "Users can view and edit own record" ON public.users;
CREATE POLICY "Users can view and edit own record" ON public.users
  FOR ALL USING (id = (SELECT auth.uid()));

-- 2. students: "Students can view and edit own profile"
DROP POLICY IF EXISTS "Students can view and edit own profile" ON public.students;
CREATE POLICY "Students can view and edit own profile" ON public.students
  FOR ALL USING (user_id = (SELECT auth.uid()));

-- 3. applications: "Students can manage own applications"
DROP POLICY IF EXISTS "Students can manage own applications" ON public.applications;
CREATE POLICY "Students can manage own applications" ON public.applications
  FOR ALL USING (student_id IN (
    SELECT students.id FROM students WHERE students.user_id = (SELECT auth.uid())
  ));

-- 4. student_registrations: "Students can view own registrations"
DROP POLICY IF EXISTS "Students can view own registrations" ON public.student_registrations;
CREATE POLICY "Students can view own registrations" ON public.student_registrations
  FOR SELECT USING (student_id IN (
    SELECT students.id FROM students WHERE students.user_id = (SELECT auth.uid())
  ));

-- 5. event_attendance: "Students can view own attendance"
DROP POLICY IF EXISTS "Students can view own attendance" ON public.event_attendance;
CREATE POLICY "Students can view own attendance" ON public.event_attendance
  FOR SELECT USING (student_id IN (
    SELECT students.id FROM students WHERE students.user_id = (SELECT auth.uid())
  ));

-- 6. student_training_progress: "Students can view and update own progress"
DROP POLICY IF EXISTS "Students can view and update own progress" ON public.student_training_progress;
CREATE POLICY "Students can view and update own progress" ON public.student_training_progress
  FOR ALL USING (student_id IN (
    SELECT students.id FROM students WHERE students.user_id = (SELECT auth.uid())
  ));

-- 7. application_stage_history: "Students can view own stage history"
DROP POLICY IF EXISTS "Students can view own stage history" ON public.application_stage_history;
CREATE POLICY "Students can view own stage history" ON public.application_stage_history
  FOR SELECT USING (application_id IN (
    SELECT a.id FROM applications a
    JOIN students s ON a.student_id = s.id
    WHERE s.user_id = (SELECT auth.uid())
  ));

-- 8. profile_update_requests: "Students can view and create own profile_update_requests"
DROP POLICY IF EXISTS "Students can view and create own profile_update_requests" ON public.profile_update_requests;
CREATE POLICY "Students can view and create own profile_update_requests" ON public.profile_update_requests
  FOR ALL USING (student_id IN (
    SELECT students.id FROM students WHERE students.user_id = (SELECT auth.uid())
  ));

-- 9. student_offers: "Students can view own offers"
DROP POLICY IF EXISTS "Students can view own offers" ON public.student_offers;
CREATE POLICY "Students can view own offers" ON public.student_offers
  FOR SELECT USING (student_id IN (
    SELECT students.id FROM students WHERE students.user_id = (SELECT auth.uid())
  ));

-- 10. student_offers: "Students can insert own offers"
DROP POLICY IF EXISTS "Students can insert own offers" ON public.student_offers;
CREATE POLICY "Students can insert own offers" ON public.student_offers
  FOR INSERT WITH CHECK (student_id IN (
    SELECT students.id FROM students WHERE students.user_id = (SELECT auth.uid())
  ));

-- 11. approval_logs: "Colleges can view their own approval logs"
DROP POLICY IF EXISTS "Colleges can view their own approval logs" ON public.approval_logs;
CREATE POLICY "Colleges can view their own approval logs" ON public.approval_logs
  FOR SELECT USING (
    college_id = (SELECT users.college_id FROM users WHERE users.id = (SELECT auth.uid()))
    OR ((SELECT auth.jwt()) ->> 'role') = ANY (ARRAY['superadmin', 'agency_staff'])
  );

-- 12. approval_logs: "Colleges can insert their own approval logs"
DROP POLICY IF EXISTS "Colleges can insert their own approval logs" ON public.approval_logs;
CREATE POLICY "Colleges can insert their own approval logs" ON public.approval_logs
  FOR INSERT WITH CHECK (
    college_id = (SELECT users.college_id FROM users WHERE users.id = (SELECT auth.uid()))
    OR ((SELECT auth.jwt()) ->> 'role') = ANY (ARRAY['superadmin', 'agency_staff'])
  );

-- 13. platform_master_data: "Allow full access to agency on platform_master_data"
DROP POLICY IF EXISTS "Allow full access to agency on platform_master_data" ON public.platform_master_data;
CREATE POLICY "Allow full access to agency on platform_master_data" ON public.platform_master_data
  FOR ALL TO authenticated USING (
    (((SELECT auth.jwt()) -> 'app_metadata') ->> 'role') = 'superadmin'
    OR (((SELECT auth.jwt()) -> 'app_metadata') ->> 'role') = 'agency_staff'
    OR (((SELECT auth.jwt()) -> 'app_metadata') ->> 'role') = 'agency_admin'
  );

-- 14. platform_settings: "Allow superadmin update on platform_settings"
DROP POLICY IF EXISTS "Allow superadmin update on platform_settings" ON public.platform_settings;
CREATE POLICY "Allow superadmin update on platform_settings" ON public.platform_settings
  FOR UPDATE TO authenticated USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = (SELECT auth.uid()) AND users.role = 'superadmin'::user_role
  ));

-- 15. student_penalty_logs: "Students can view own penalty logs"
DROP POLICY IF EXISTS "Students can view own penalty logs" ON public.student_penalty_logs;
CREATE POLICY "Students can view own penalty logs" ON public.student_penalty_logs
  FOR SELECT TO authenticated USING (student_id IN (
    SELECT students.id FROM students WHERE students.user_id = (SELECT auth.uid())
  ));

-- 16. student_penalty_logs: "College staff can manage penalty logs"
DROP POLICY IF EXISTS "College staff can manage penalty logs" ON public.student_penalty_logs;
CREATE POLICY "College staff can manage penalty logs" ON public.student_penalty_logs
  FOR ALL TO authenticated USING (
    student_id IN (
      SELECT students.id FROM students
      WHERE students.college_id = (SELECT users.college_id FROM users WHERE users.id = (SELECT auth.uid()))
    )
    AND (SELECT users.role FROM users WHERE users.id = (SELECT auth.uid())) = ANY (ARRAY['college_admin'::user_role, 'college_staff'::user_role])
  );

-- 17. student_penalty_logs: "Agency can manage all penalty logs"
DROP POLICY IF EXISTS "Agency can manage all penalty logs" ON public.student_penalty_logs;
CREATE POLICY "Agency can manage all penalty logs" ON public.student_penalty_logs
  FOR ALL TO authenticated USING (
    (SELECT users.role FROM users WHERE users.id = (SELECT auth.uid())) = ANY (ARRAY['superadmin'::user_role, 'agency_staff'::user_role, 'agency_admin'::user_role])
  );

-- 18. payment_requests: "Students can view their own payment requests"
DROP POLICY IF EXISTS "Students can view their own payment requests" ON public.payment_requests;
CREATE POLICY "Students can view their own payment requests" ON public.payment_requests
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

-- 19. payment_requests: "Agency admins have full access to payment requests"
DROP POLICY IF EXISTS "Agency admins have full access to payment requests" ON public.payment_requests;
CREATE POLICY "Agency admins have full access to payment requests" ON public.payment_requests
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = (SELECT auth.uid()) AND users.role = 'agency_admin'::user_role
  ));

-- 20. credit_ledgers: "Students can view their own credit ledgers"
DROP POLICY IF EXISTS "Students can view their own credit ledgers" ON public.credit_ledgers;
CREATE POLICY "Students can view their own credit ledgers" ON public.credit_ledgers
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

-- 21. credit_ledgers: "Agency admins have full access to credit ledgers"
DROP POLICY IF EXISTS "Agency admins have full access to credit ledgers" ON public.credit_ledgers;
CREATE POLICY "Agency admins have full access to credit ledgers" ON public.credit_ledgers
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = (SELECT auth.uid()) AND users.role = 'agency_admin'::user_role
  ));

-- 22. ai_resumes: "Students fully control their own AI resumes"
DROP POLICY IF EXISTS "Students fully control their own AI resumes" ON public.ai_resumes;
CREATE POLICY "Students fully control their own AI resumes" ON public.ai_resumes
  FOR ALL USING ((SELECT auth.uid()) = user_id);

-- 23. ai_interviews: "Students fully control their own AI interviews"
DROP POLICY IF EXISTS "Students fully control their own AI interviews" ON public.ai_interviews;
CREATE POLICY "Students fully control their own AI interviews" ON public.ai_interviews
  FOR ALL USING ((SELECT auth.uid()) = user_id);

-- 24. certificates: "Students can view their own certificates"
DROP POLICY IF EXISTS "Students can view their own certificates" ON public.certificates;
CREATE POLICY "Students can view their own certificates" ON public.certificates
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

-- 25. certificates: "Agency admins can manage certificates"
DROP POLICY IF EXISTS "Agency admins can manage certificates" ON public.certificates;
CREATE POLICY "Agency admins can manage certificates" ON public.certificates
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = (SELECT auth.uid()) AND users.role = 'agency_admin'::user_role
  ));

-- 26. certificates: "College admins can manage certificates for their students"
DROP POLICY IF EXISTS "College admins can manage certificates for their students" ON public.certificates;
CREATE POLICY "College admins can manage certificates for their students" ON public.certificates
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users
    JOIN students ON students.user_id = certificates.user_id
    WHERE users.id = (SELECT auth.uid())
      AND users.role = 'college_admin'::user_role
      AND users.college_id = students.college_id
  ));

-- 27. student_integrations: "Students fully control their own integrations"
DROP POLICY IF EXISTS "Students fully control their own integrations" ON public.student_integrations;
CREATE POLICY "Students fully control their own integrations" ON public.student_integrations
  FOR ALL USING ((SELECT auth.uid()) = user_id);
