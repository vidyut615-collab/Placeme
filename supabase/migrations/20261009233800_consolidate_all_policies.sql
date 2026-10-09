-- =============================================================================
-- MIGRATION: Consolidate multiple permissive policies into single unified policies
-- Date: 2026-10-09
-- =============================================================================

DROP POLICY IF EXISTS "Agency can do all on students" ON public."students";
DROP POLICY IF EXISTS "College Staff can manage students in same college" ON public."students";
DROP POLICY IF EXISTS "Students can view and edit own profile" ON public."students";
DROP POLICY IF EXISTS "Agency can do all on placement policies" ON public."placement_policies";
DROP POLICY IF EXISTS "College Admin can manage own placement policies" ON public."placement_policies";
DROP POLICY IF EXISTS "College Staff and Students can view own placement policies" ON public."placement_policies";
DROP POLICY IF EXISTS "Agency can do all on users" ON public."users";
DROP POLICY IF EXISTS "College Admin can update users in same college" ON public."users";
DROP POLICY IF EXISTS "College Staff can view users in same college" ON public."users";
DROP POLICY IF EXISTS "Users can view and edit own record" ON public."users";
DROP POLICY IF EXISTS "Agency can do all on invitations" ON public."invitations";
DROP POLICY IF EXISTS "College Admin can manage college invitations" ON public."invitations";
DROP POLICY IF EXISTS "Agency can do all on student_registrations" ON public."student_registrations";
DROP POLICY IF EXISTS "College can manage registrations" ON public."student_registrations";
DROP POLICY IF EXISTS "Students can view own registrations" ON public."student_registrations";
DROP POLICY IF EXISTS "Agency can do all on job_types" ON public."job_types";
DROP POLICY IF EXISTS "College can manage own job_types" ON public."job_types";
DROP POLICY IF EXISTS "Students can view own college job_types" ON public."job_types";
DROP POLICY IF EXISTS "Agency can do all on placement_levels" ON public."placement_levels";
DROP POLICY IF EXISTS "College can manage own placement_levels" ON public."placement_levels";
DROP POLICY IF EXISTS "Students can view own college placement_levels" ON public."placement_levels";
DROP POLICY IF EXISTS "Agency can do all on placement_categories" ON public."placement_categories";
DROP POLICY IF EXISTS "College can manage own placement_categories" ON public."placement_categories";
DROP POLICY IF EXISTS "Students can view own college placement_categories" ON public."placement_categories";
DROP POLICY IF EXISTS "Agency can do all on recruitment_events" ON public."recruitment_events";
DROP POLICY IF EXISTS "College can manage events for own jobs" ON public."recruitment_events";
DROP POLICY IF EXISTS "Students can view events for accessible jobs" ON public."recruitment_events";
DROP POLICY IF EXISTS "Agency can do all on event_attendance" ON public."event_attendance";
DROP POLICY IF EXISTS "College can manage attendance for own events" ON public."event_attendance";
DROP POLICY IF EXISTS "Students can view own attendance" ON public."event_attendance";
DROP POLICY IF EXISTS "Agency can do all on training_modules" ON public."training_modules";
DROP POLICY IF EXISTS "College can manage own training_modules" ON public."training_modules";
DROP POLICY IF EXISTS "Students can view own college training_modules" ON public."training_modules";
DROP POLICY IF EXISTS "Agency can do all on student_training_progress" ON public."student_training_progress";
DROP POLICY IF EXISTS "College can manage training progress" ON public."student_training_progress";
DROP POLICY IF EXISTS "Students can view and update own progress" ON public."student_training_progress";
DROP POLICY IF EXISTS "Agency can do all on policy_overrides" ON public."policy_overrides";
DROP POLICY IF EXISTS "College admin can manage own overrides" ON public."policy_overrides";
DROP POLICY IF EXISTS "College staff can view own overrides" ON public."policy_overrides";
DROP POLICY IF EXISTS "Agency can do all on application_stage_history" ON public."application_stage_history";
DROP POLICY IF EXISTS "College can view history for own apps" ON public."application_stage_history";
DROP POLICY IF EXISTS "Students can view own stage history" ON public."application_stage_history";
DROP POLICY IF EXISTS "Agency can do all on applications" ON public."applications";
DROP POLICY IF EXISTS "College Staff can view and manage applications for own college " ON public."applications";
DROP POLICY IF EXISTS "Students can manage own applications" ON public."applications";
DROP POLICY IF EXISTS "Agency can do all on profile_update_requests" ON public."profile_update_requests";
DROP POLICY IF EXISTS "College Staff can manage own college profile_update_requests" ON public."profile_update_requests";
DROP POLICY IF EXISTS "Students can view and create own profile_update_requests" ON public."profile_update_requests";
DROP POLICY IF EXISTS "Colleges can view and manage student offers" ON public."student_offers";
DROP POLICY IF EXISTS "Students can insert own offers" ON public."student_offers";
DROP POLICY IF EXISTS "Students can view own offers" ON public."student_offers";
DROP POLICY IF EXISTS "Agency can do all on colleges" ON public."colleges";
DROP POLICY IF EXISTS "College Staff can update own college" ON public."colleges";
DROP POLICY IF EXISTS "College Staff can view own college" ON public."colleges";
DROP POLICY IF EXISTS "Students can view own college" ON public."colleges";
DROP POLICY IF EXISTS "Agency can do all on jobs" ON public."jobs";
DROP POLICY IF EXISTS "College Staff can manage own college jobs" ON public."jobs";
DROP POLICY IF EXISTS "College Staff can view agency jobs" ON public."jobs";
DROP POLICY IF EXISTS "Students can view agency jobs and own college jobs" ON public."jobs";
DROP POLICY IF EXISTS "Colleges can insert their own approval logs" ON public."approval_logs";
DROP POLICY IF EXISTS "Colleges can view their own approval logs" ON public."approval_logs";
DROP POLICY IF EXISTS "Agency can do all on placement_cycles" ON public."placement_cycles";
DROP POLICY IF EXISTS "College can manage own placement_cycles" ON public."placement_cycles";
DROP POLICY IF EXISTS "Students can view own college cycles" ON public."placement_cycles";
DROP POLICY IF EXISTS "Allow all access for agency" ON public."job_target_colleges";
DROP POLICY IF EXISTS "Allow read access for job targets" ON public."job_target_colleges";
DROP POLICY IF EXISTS "Allow full access to agency on platform_master_data" ON public."platform_master_data";
DROP POLICY IF EXISTS "Allow read access to authenticated users on platform_master_dat" ON public."platform_master_data";
DROP POLICY IF EXISTS "Allow read access to authenticated users on platform_settings" ON public."platform_settings";
DROP POLICY IF EXISTS "Allow superadmin update on platform_settings" ON public."platform_settings";
DROP POLICY IF EXISTS "Agency can manage all penalty logs" ON public."student_penalty_logs";
DROP POLICY IF EXISTS "College staff can manage penalty logs" ON public."student_penalty_logs";
DROP POLICY IF EXISTS "Students can view own penalty logs" ON public."student_penalty_logs";
DROP POLICY IF EXISTS "Agency admins have full access to payment requests" ON public."payment_requests";
DROP POLICY IF EXISTS "Students can view their own payment requests" ON public."payment_requests";
DROP POLICY IF EXISTS "Agency admins have full access to credit ledgers" ON public."credit_ledgers";
DROP POLICY IF EXISTS "Students can view their own credit ledgers" ON public."credit_ledgers";
DROP POLICY IF EXISTS "Students fully control their own AI interviews" ON public."ai_interviews";
DROP POLICY IF EXISTS "Agency admins can manage certificates" ON public."certificates";
DROP POLICY IF EXISTS "College admins can manage certificates for their students" ON public."certificates";
DROP POLICY IF EXISTS "Students can view their own certificates" ON public."certificates";
DROP POLICY IF EXISTS "Students fully control their own integrations" ON public."student_integrations";
DROP POLICY IF EXISTS "Students fully control their own AI resumes" ON public."ai_resumes";

CREATE POLICY "Unified SELECT Policy" ON public."students" FOR SELECT USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text, 'agency_admin'::text]))) 
    OR 
    ((college_id = auth_college_id())) 
    OR 
    ((user_id = ( SELECT auth.uid() AS uid)))
  );
CREATE POLICY "Unified INSERT Policy" ON public."students" FOR INSERT WITH CHECK ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text, 'agency_admin'::text]))) 
    OR 
    ((college_id = auth_college_id())) 
    OR 
    ((user_id = ( SELECT auth.uid() AS uid)))
  );
CREATE POLICY "Unified UPDATE Policy" ON public."students" FOR UPDATE USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text, 'agency_admin'::text]))) 
    OR 
    ((college_id = auth_college_id())) 
    OR 
    ((user_id = ( SELECT auth.uid() AS uid)))
  ) WITH CHECK ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text, 'agency_admin'::text]))) 
    OR 
    ((college_id = auth_college_id())) 
    OR 
    ((user_id = ( SELECT auth.uid() AS uid)))
  );
CREATE POLICY "Unified DELETE Policy" ON public."students" FOR DELETE USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text, 'agency_admin'::text]))) 
    OR 
    ((college_id = auth_college_id())) 
    OR 
    ((user_id = ( SELECT auth.uid() AS uid)))
  );
CREATE POLICY "Unified SELECT Policy" ON public."placement_policies" FOR SELECT USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text, 'agency_admin'::text]))) 
    OR 
    (((college_id = auth_college_id()) AND (auth_role() = 'college_admin'::text))) 
    OR 
    ((college_id = auth_college_id()))
  );
CREATE POLICY "Unified INSERT Policy" ON public."placement_policies" FOR INSERT WITH CHECK ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text, 'agency_admin'::text]))) 
    OR 
    (((college_id = auth_college_id()) AND (auth_role() = 'college_admin'::text)))
  );
CREATE POLICY "Unified UPDATE Policy" ON public."placement_policies" FOR UPDATE USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text, 'agency_admin'::text]))) 
    OR 
    (((college_id = auth_college_id()) AND (auth_role() = 'college_admin'::text)))
  ) WITH CHECK ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text, 'agency_admin'::text]))) 
    OR 
    (((college_id = auth_college_id()) AND (auth_role() = 'college_admin'::text)))
  );
CREATE POLICY "Unified DELETE Policy" ON public."placement_policies" FOR DELETE USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text, 'agency_admin'::text]))) 
    OR 
    (((college_id = auth_college_id()) AND (auth_role() = 'college_admin'::text)))
  );
CREATE POLICY "Unified SELECT Policy" ON public."users" FOR SELECT USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((college_id = auth_college_id())) 
    OR 
    ((id = ( SELECT auth.uid() AS uid)))
  );
CREATE POLICY "Unified INSERT Policy" ON public."users" FOR INSERT WITH CHECK ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((id = ( SELECT auth.uid() AS uid)))
  );
CREATE POLICY "Unified UPDATE Policy" ON public."users" FOR UPDATE USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    (((college_id = auth_college_id()) AND (auth_role() = 'college_admin'::text))) 
    OR 
    ((id = ( SELECT auth.uid() AS uid)))
  ) WITH CHECK ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    (((college_id = auth_college_id()) AND (auth_role() = 'college_admin'::text))) 
    OR 
    ((id = ( SELECT auth.uid() AS uid)))
  );
CREATE POLICY "Unified DELETE Policy" ON public."users" FOR DELETE USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((id = ( SELECT auth.uid() AS uid)))
  );
CREATE POLICY "Unified SELECT Policy" ON public."invitations" FOR SELECT USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((college_id = auth_college_id()))
  );
CREATE POLICY "Unified INSERT Policy" ON public."invitations" FOR INSERT WITH CHECK ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((college_id = auth_college_id()))
  );
CREATE POLICY "Unified UPDATE Policy" ON public."invitations" FOR UPDATE USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((college_id = auth_college_id()))
  ) WITH CHECK ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((college_id = auth_college_id()))
  );
CREATE POLICY "Unified DELETE Policy" ON public."invitations" FOR DELETE USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((college_id = auth_college_id()))
  );
CREATE POLICY "Unified SELECT Policy" ON public."student_registrations" FOR SELECT USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((student_id IN ( SELECT students.id
   FROM students
  WHERE (students.college_id = auth_college_id())))) 
    OR 
    ((student_id IN ( SELECT students.id
   FROM students
  WHERE (students.user_id = ( SELECT auth.uid() AS uid)))))
  );
CREATE POLICY "Unified INSERT Policy" ON public."student_registrations" FOR INSERT WITH CHECK ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((student_id IN ( SELECT students.id
   FROM students
  WHERE (students.college_id = auth_college_id()))))
  );
CREATE POLICY "Unified UPDATE Policy" ON public."student_registrations" FOR UPDATE USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((student_id IN ( SELECT students.id
   FROM students
  WHERE (students.college_id = auth_college_id()))))
  ) WITH CHECK ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((student_id IN ( SELECT students.id
   FROM students
  WHERE (students.college_id = auth_college_id()))))
  );
CREATE POLICY "Unified DELETE Policy" ON public."student_registrations" FOR DELETE USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((student_id IN ( SELECT students.id
   FROM students
  WHERE (students.college_id = auth_college_id()))))
  );
CREATE POLICY "Unified SELECT Policy" ON public."job_types" FOR SELECT USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((college_id = auth_college_id())) 
    OR 
    (((college_id = auth_college_id()) AND (auth_role() = 'student'::text)))
  );
CREATE POLICY "Unified INSERT Policy" ON public."job_types" FOR INSERT WITH CHECK ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((college_id = auth_college_id()))
  );
CREATE POLICY "Unified UPDATE Policy" ON public."job_types" FOR UPDATE USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((college_id = auth_college_id()))
  ) WITH CHECK ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((college_id = auth_college_id()))
  );
CREATE POLICY "Unified DELETE Policy" ON public."job_types" FOR DELETE USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((college_id = auth_college_id()))
  );
CREATE POLICY "Unified SELECT Policy" ON public."placement_levels" FOR SELECT USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((college_id = auth_college_id())) 
    OR 
    (((college_id = auth_college_id()) AND (auth_role() = 'student'::text)))
  );
CREATE POLICY "Unified INSERT Policy" ON public."placement_levels" FOR INSERT WITH CHECK ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((college_id = auth_college_id()))
  );
CREATE POLICY "Unified UPDATE Policy" ON public."placement_levels" FOR UPDATE USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((college_id = auth_college_id()))
  ) WITH CHECK ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((college_id = auth_college_id()))
  );
CREATE POLICY "Unified DELETE Policy" ON public."placement_levels" FOR DELETE USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((college_id = auth_college_id()))
  );
CREATE POLICY "Unified SELECT Policy" ON public."placement_categories" FOR SELECT USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((college_id = auth_college_id())) 
    OR 
    (((college_id = auth_college_id()) AND (auth_role() = 'student'::text)))
  );
CREATE POLICY "Unified INSERT Policy" ON public."placement_categories" FOR INSERT WITH CHECK ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((college_id = auth_college_id()))
  );
CREATE POLICY "Unified UPDATE Policy" ON public."placement_categories" FOR UPDATE USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((college_id = auth_college_id()))
  ) WITH CHECK ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((college_id = auth_college_id()))
  );
CREATE POLICY "Unified DELETE Policy" ON public."placement_categories" FOR DELETE USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((college_id = auth_college_id()))
  );
CREATE POLICY "Unified SELECT Policy" ON public."recruitment_events" FOR SELECT USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((job_id IN ( SELECT jobs.id
   FROM jobs
  WHERE (jobs.college_id = auth_college_id())))) 
    OR 
    ((job_id IN ( SELECT jobs.id
   FROM jobs
  WHERE ((jobs.status = 'active'::job_status) AND ((jobs.college_id IS NULL) OR (jobs.college_id = auth_college_id()))))))
  );
CREATE POLICY "Unified INSERT Policy" ON public."recruitment_events" FOR INSERT WITH CHECK ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((job_id IN ( SELECT jobs.id
   FROM jobs
  WHERE (jobs.college_id = auth_college_id()))))
  );
CREATE POLICY "Unified UPDATE Policy" ON public."recruitment_events" FOR UPDATE USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((job_id IN ( SELECT jobs.id
   FROM jobs
  WHERE (jobs.college_id = auth_college_id()))))
  ) WITH CHECK ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((job_id IN ( SELECT jobs.id
   FROM jobs
  WHERE (jobs.college_id = auth_college_id()))))
  );
CREATE POLICY "Unified DELETE Policy" ON public."recruitment_events" FOR DELETE USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((job_id IN ( SELECT jobs.id
   FROM jobs
  WHERE (jobs.college_id = auth_college_id()))))
  );
CREATE POLICY "Unified SELECT Policy" ON public."event_attendance" FOR SELECT USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((event_id IN ( SELECT re.id
   FROM (recruitment_events re
     JOIN jobs j ON ((re.job_id = j.id)))
  WHERE (j.college_id = auth_college_id())))) 
    OR 
    ((student_id IN ( SELECT students.id
   FROM students
  WHERE (students.user_id = ( SELECT auth.uid() AS uid)))))
  );
CREATE POLICY "Unified INSERT Policy" ON public."event_attendance" FOR INSERT WITH CHECK ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((event_id IN ( SELECT re.id
   FROM (recruitment_events re
     JOIN jobs j ON ((re.job_id = j.id)))
  WHERE (j.college_id = auth_college_id()))))
  );
CREATE POLICY "Unified UPDATE Policy" ON public."event_attendance" FOR UPDATE USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((event_id IN ( SELECT re.id
   FROM (recruitment_events re
     JOIN jobs j ON ((re.job_id = j.id)))
  WHERE (j.college_id = auth_college_id()))))
  ) WITH CHECK ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((event_id IN ( SELECT re.id
   FROM (recruitment_events re
     JOIN jobs j ON ((re.job_id = j.id)))
  WHERE (j.college_id = auth_college_id()))))
  );
CREATE POLICY "Unified DELETE Policy" ON public."event_attendance" FOR DELETE USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((event_id IN ( SELECT re.id
   FROM (recruitment_events re
     JOIN jobs j ON ((re.job_id = j.id)))
  WHERE (j.college_id = auth_college_id()))))
  );
CREATE POLICY "Unified SELECT Policy" ON public."training_modules" FOR SELECT USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((college_id = auth_college_id())) 
    OR 
    (((college_id = auth_college_id()) AND (auth_role() = 'student'::text)))
  );
CREATE POLICY "Unified INSERT Policy" ON public."training_modules" FOR INSERT WITH CHECK ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((college_id = auth_college_id()))
  );
CREATE POLICY "Unified UPDATE Policy" ON public."training_modules" FOR UPDATE USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((college_id = auth_college_id()))
  ) WITH CHECK ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((college_id = auth_college_id()))
  );
CREATE POLICY "Unified DELETE Policy" ON public."training_modules" FOR DELETE USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((college_id = auth_college_id()))
  );
CREATE POLICY "Unified SELECT Policy" ON public."student_training_progress" FOR SELECT USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((student_id IN ( SELECT students.id
   FROM students
  WHERE (students.college_id = auth_college_id())))) 
    OR 
    ((student_id IN ( SELECT students.id
   FROM students
  WHERE (students.user_id = ( SELECT auth.uid() AS uid)))))
  );
CREATE POLICY "Unified INSERT Policy" ON public."student_training_progress" FOR INSERT WITH CHECK ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((student_id IN ( SELECT students.id
   FROM students
  WHERE (students.college_id = auth_college_id())))) 
    OR 
    ((student_id IN ( SELECT students.id
   FROM students
  WHERE (students.user_id = ( SELECT auth.uid() AS uid)))))
  );
CREATE POLICY "Unified UPDATE Policy" ON public."student_training_progress" FOR UPDATE USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((student_id IN ( SELECT students.id
   FROM students
  WHERE (students.college_id = auth_college_id())))) 
    OR 
    ((student_id IN ( SELECT students.id
   FROM students
  WHERE (students.user_id = ( SELECT auth.uid() AS uid)))))
  ) WITH CHECK ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((student_id IN ( SELECT students.id
   FROM students
  WHERE (students.college_id = auth_college_id())))) 
    OR 
    ((student_id IN ( SELECT students.id
   FROM students
  WHERE (students.user_id = ( SELECT auth.uid() AS uid)))))
  );
CREATE POLICY "Unified DELETE Policy" ON public."student_training_progress" FOR DELETE USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((student_id IN ( SELECT students.id
   FROM students
  WHERE (students.college_id = auth_college_id())))) 
    OR 
    ((student_id IN ( SELECT students.id
   FROM students
  WHERE (students.user_id = ( SELECT auth.uid() AS uid)))))
  );
CREATE POLICY "Unified SELECT Policy" ON public."policy_overrides" FOR SELECT USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    (((college_id = auth_college_id()) AND (auth_role() = 'college_admin'::text))) 
    OR 
    ((college_id = auth_college_id()))
  );
CREATE POLICY "Unified INSERT Policy" ON public."policy_overrides" FOR INSERT WITH CHECK ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    (((college_id = auth_college_id()) AND (auth_role() = 'college_admin'::text)))
  );
CREATE POLICY "Unified UPDATE Policy" ON public."policy_overrides" FOR UPDATE USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    (((college_id = auth_college_id()) AND (auth_role() = 'college_admin'::text)))
  ) WITH CHECK ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    (((college_id = auth_college_id()) AND (auth_role() = 'college_admin'::text)))
  );
CREATE POLICY "Unified DELETE Policy" ON public."policy_overrides" FOR DELETE USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    (((college_id = auth_college_id()) AND (auth_role() = 'college_admin'::text)))
  );
CREATE POLICY "Unified SELECT Policy" ON public."application_stage_history" FOR SELECT USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    (((application_id IN ( SELECT a.id
   FROM (applications a
     JOIN jobs j ON ((a.job_id = j.id)))
  WHERE (j.college_id = auth_college_id()))) OR (application_id IN ( SELECT a.id
   FROM (applications a
     JOIN students s ON ((a.student_id = s.id)))
  WHERE (s.college_id = auth_college_id()))))) 
    OR 
    ((application_id IN ( SELECT a.id
   FROM (applications a
     JOIN students s ON ((a.student_id = s.id)))
  WHERE (s.user_id = ( SELECT auth.uid() AS uid)))))
  );
CREATE POLICY "Unified INSERT Policy" ON public."application_stage_history" FOR INSERT WITH CHECK ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    (((application_id IN ( SELECT a.id
   FROM (applications a
     JOIN jobs j ON ((a.job_id = j.id)))
  WHERE (j.college_id = auth_college_id()))) OR (application_id IN ( SELECT a.id
   FROM (applications a
     JOIN students s ON ((a.student_id = s.id)))
  WHERE (s.college_id = auth_college_id())))))
  );
CREATE POLICY "Unified UPDATE Policy" ON public."application_stage_history" FOR UPDATE USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    (((application_id IN ( SELECT a.id
   FROM (applications a
     JOIN jobs j ON ((a.job_id = j.id)))
  WHERE (j.college_id = auth_college_id()))) OR (application_id IN ( SELECT a.id
   FROM (applications a
     JOIN students s ON ((a.student_id = s.id)))
  WHERE (s.college_id = auth_college_id())))))
  ) WITH CHECK ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    (((application_id IN ( SELECT a.id
   FROM (applications a
     JOIN jobs j ON ((a.job_id = j.id)))
  WHERE (j.college_id = auth_college_id()))) OR (application_id IN ( SELECT a.id
   FROM (applications a
     JOIN students s ON ((a.student_id = s.id)))
  WHERE (s.college_id = auth_college_id())))))
  );
CREATE POLICY "Unified DELETE Policy" ON public."application_stage_history" FOR DELETE USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    (((application_id IN ( SELECT a.id
   FROM (applications a
     JOIN jobs j ON ((a.job_id = j.id)))
  WHERE (j.college_id = auth_college_id()))) OR (application_id IN ( SELECT a.id
   FROM (applications a
     JOIN students s ON ((a.student_id = s.id)))
  WHERE (s.college_id = auth_college_id())))))
  );
CREATE POLICY "Unified SELECT Policy" ON public."applications" FOR SELECT USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text, 'agency_admin'::text]))) 
    OR 
    (((job_id IN ( SELECT jobs.id
   FROM jobs
  WHERE (jobs.college_id = auth_college_id()))) OR (student_id IN ( SELECT students.id
   FROM students
  WHERE (students.college_id = auth_college_id()))))) 
    OR 
    ((student_id IN ( SELECT students.id
   FROM students
  WHERE (students.user_id = ( SELECT auth.uid() AS uid)))))
  );
CREATE POLICY "Unified INSERT Policy" ON public."applications" FOR INSERT WITH CHECK ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text, 'agency_admin'::text]))) 
    OR 
    (((job_id IN ( SELECT jobs.id
   FROM jobs
  WHERE (jobs.college_id = auth_college_id()))) OR (student_id IN ( SELECT students.id
   FROM students
  WHERE (students.college_id = auth_college_id()))))) 
    OR 
    ((student_id IN ( SELECT students.id
   FROM students
  WHERE (students.user_id = ( SELECT auth.uid() AS uid)))))
  );
CREATE POLICY "Unified UPDATE Policy" ON public."applications" FOR UPDATE USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text, 'agency_admin'::text]))) 
    OR 
    (((job_id IN ( SELECT jobs.id
   FROM jobs
  WHERE (jobs.college_id = auth_college_id()))) OR (student_id IN ( SELECT students.id
   FROM students
  WHERE (students.college_id = auth_college_id()))))) 
    OR 
    ((student_id IN ( SELECT students.id
   FROM students
  WHERE (students.user_id = ( SELECT auth.uid() AS uid)))))
  ) WITH CHECK ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text, 'agency_admin'::text]))) 
    OR 
    (((job_id IN ( SELECT jobs.id
   FROM jobs
  WHERE (jobs.college_id = auth_college_id()))) OR (student_id IN ( SELECT students.id
   FROM students
  WHERE (students.college_id = auth_college_id()))))) 
    OR 
    ((student_id IN ( SELECT students.id
   FROM students
  WHERE (students.user_id = ( SELECT auth.uid() AS uid)))))
  );
CREATE POLICY "Unified DELETE Policy" ON public."applications" FOR DELETE USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text, 'agency_admin'::text]))) 
    OR 
    (((job_id IN ( SELECT jobs.id
   FROM jobs
  WHERE (jobs.college_id = auth_college_id()))) OR (student_id IN ( SELECT students.id
   FROM students
  WHERE (students.college_id = auth_college_id()))))) 
    OR 
    ((student_id IN ( SELECT students.id
   FROM students
  WHERE (students.user_id = ( SELECT auth.uid() AS uid)))))
  );
CREATE POLICY "Unified SELECT Policy" ON public."profile_update_requests" FOR SELECT USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((college_id = auth_college_id())) 
    OR 
    ((student_id IN ( SELECT students.id
   FROM students
  WHERE (students.user_id = ( SELECT auth.uid() AS uid)))))
  );
CREATE POLICY "Unified INSERT Policy" ON public."profile_update_requests" FOR INSERT WITH CHECK ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((college_id = auth_college_id())) 
    OR 
    ((student_id IN ( SELECT students.id
   FROM students
  WHERE (students.user_id = ( SELECT auth.uid() AS uid)))))
  );
CREATE POLICY "Unified UPDATE Policy" ON public."profile_update_requests" FOR UPDATE USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((college_id = auth_college_id())) 
    OR 
    ((student_id IN ( SELECT students.id
   FROM students
  WHERE (students.user_id = ( SELECT auth.uid() AS uid)))))
  ) WITH CHECK ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((college_id = auth_college_id())) 
    OR 
    ((student_id IN ( SELECT students.id
   FROM students
  WHERE (students.user_id = ( SELECT auth.uid() AS uid)))))
  );
CREATE POLICY "Unified DELETE Policy" ON public."profile_update_requests" FOR DELETE USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((college_id = auth_college_id())) 
    OR 
    ((student_id IN ( SELECT students.id
   FROM students
  WHERE (students.user_id = ( SELECT auth.uid() AS uid)))))
  );
CREATE POLICY "Unified SELECT Policy" ON public."student_offers" FOR SELECT USING ( 
    (((college_id = auth_college_id()) OR (auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text])))) 
    OR 
    ((student_id IN ( SELECT students.id
   FROM students
  WHERE (students.user_id = ( SELECT auth.uid() AS uid)))))
  );
CREATE POLICY "Unified INSERT Policy" ON public."student_offers" FOR INSERT WITH CHECK ( 
    (((college_id = auth_college_id()) OR (auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text])))) 
    OR 
    ((student_id IN ( SELECT students.id
   FROM students
  WHERE (students.user_id = ( SELECT auth.uid() AS uid)))))
  );
CREATE POLICY "Unified UPDATE Policy" ON public."student_offers" FOR UPDATE USING ( 
    (((college_id = auth_college_id()) OR (auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))))
  ) WITH CHECK ( 
    (((college_id = auth_college_id()) OR (auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))))
  );
CREATE POLICY "Unified DELETE Policy" ON public."student_offers" FOR DELETE USING ( 
    (((college_id = auth_college_id()) OR (auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))))
  );
CREATE POLICY "Unified SELECT Policy" ON public."colleges" FOR SELECT USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text, 'agency_admin'::text]))) 
    OR 
    ((id = auth_college_id())) 
    OR 
    (((id = auth_college_id()) AND (auth_role() = 'student'::text)))
  );
CREATE POLICY "Unified INSERT Policy" ON public."colleges" FOR INSERT WITH CHECK ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text, 'agency_admin'::text])))
  );
CREATE POLICY "Unified UPDATE Policy" ON public."colleges" FOR UPDATE USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text, 'agency_admin'::text]))) 
    OR 
    ((id = auth_college_id()))
  ) WITH CHECK ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text, 'agency_admin'::text]))) 
    OR 
    ((id = auth_college_id()))
  );
CREATE POLICY "Unified DELETE Policy" ON public."colleges" FOR DELETE USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text, 'agency_admin'::text])))
  );
CREATE POLICY "Unified SELECT Policy" ON public."jobs" FOR SELECT USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text, 'agency_admin'::text]))) 
    OR 
    ((college_id = auth_college_id())) 
    OR 
    ((college_id IS NULL)) 
    OR 
    (((status = 'active'::job_status) AND ((college_id IS NULL) OR (college_id = auth_college_id()))))
  );
CREATE POLICY "Unified INSERT Policy" ON public."jobs" FOR INSERT WITH CHECK ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text, 'agency_admin'::text]))) 
    OR 
    ((college_id = auth_college_id()))
  );
CREATE POLICY "Unified UPDATE Policy" ON public."jobs" FOR UPDATE USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text, 'agency_admin'::text]))) 
    OR 
    ((college_id = auth_college_id()))
  ) WITH CHECK ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text, 'agency_admin'::text]))) 
    OR 
    ((college_id = auth_college_id()))
  );
CREATE POLICY "Unified DELETE Policy" ON public."jobs" FOR DELETE USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text, 'agency_admin'::text]))) 
    OR 
    ((college_id = auth_college_id()))
  );
CREATE POLICY "Unified SELECT Policy" ON public."approval_logs" FOR SELECT USING ( 
    (((college_id = auth_college_id()) OR (auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))))
  );
CREATE POLICY "Unified INSERT Policy" ON public."approval_logs" FOR INSERT WITH CHECK ( 
    (((college_id = auth_college_id()) OR (auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))))
  );
CREATE POLICY "Unified SELECT Policy" ON public."placement_cycles" FOR SELECT USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((college_id = auth_college_id())) 
    OR 
    (((college_id = auth_college_id()) AND (auth_role() = 'student'::text)))
  );
CREATE POLICY "Unified INSERT Policy" ON public."placement_cycles" FOR INSERT WITH CHECK ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((college_id = auth_college_id()))
  );
CREATE POLICY "Unified UPDATE Policy" ON public."placement_cycles" FOR UPDATE USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((college_id = auth_college_id()))
  ) WITH CHECK ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((college_id = auth_college_id()))
  );
CREATE POLICY "Unified DELETE Policy" ON public."placement_cycles" FOR DELETE USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text]))) 
    OR 
    ((college_id = auth_college_id()))
  );
CREATE POLICY "Unified SELECT Policy" ON public."job_target_colleges" FOR SELECT USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text, 'agency_admin'::text]))) 
    OR 
    (((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text, 'agency_admin'::text])) OR (college_id = auth_college_id())))
  );
CREATE POLICY "Unified INSERT Policy" ON public."job_target_colleges" FOR INSERT WITH CHECK ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text, 'agency_admin'::text])))
  );
CREATE POLICY "Unified UPDATE Policy" ON public."job_target_colleges" FOR UPDATE USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text, 'agency_admin'::text])))
  ) WITH CHECK ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text, 'agency_admin'::text])))
  );
CREATE POLICY "Unified DELETE Policy" ON public."job_target_colleges" FOR DELETE USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text, 'agency_admin'::text])))
  );
CREATE POLICY "Unified SELECT Policy" ON public."platform_master_data" FOR SELECT USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text, 'agency_admin'::text]))) 
    OR 
    (true)
  );
CREATE POLICY "Unified INSERT Policy" ON public."platform_master_data" FOR INSERT WITH CHECK ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text, 'agency_admin'::text])))
  );
CREATE POLICY "Unified UPDATE Policy" ON public."platform_master_data" FOR UPDATE USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text, 'agency_admin'::text])))
  ) WITH CHECK ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text, 'agency_admin'::text])))
  );
CREATE POLICY "Unified DELETE Policy" ON public."platform_master_data" FOR DELETE USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text, 'agency_admin'::text])))
  );
CREATE POLICY "Unified SELECT Policy" ON public."platform_settings" FOR SELECT USING ( 
    (true)
  );
CREATE POLICY "Unified UPDATE Policy" ON public."platform_settings" FOR UPDATE USING ( 
    ((auth_role() = 'superadmin'::text))
  ) WITH CHECK ( 
    ((auth_role() = 'superadmin'::text))
  );
CREATE POLICY "Unified SELECT Policy" ON public."student_penalty_logs" FOR SELECT USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text, 'agency_admin'::text]))) 
    OR 
    (((auth_role() = ANY (ARRAY['college_admin'::text, 'college_staff'::text])) AND (student_id IN ( SELECT students.id
   FROM students
  WHERE (students.college_id = auth_college_id()))))) 
    OR 
    ((student_id IN ( SELECT students.id
   FROM students
  WHERE (students.user_id = ( SELECT auth.uid() AS uid)))))
  );
CREATE POLICY "Unified INSERT Policy" ON public."student_penalty_logs" FOR INSERT WITH CHECK ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text, 'agency_admin'::text]))) 
    OR 
    (((auth_role() = ANY (ARRAY['college_admin'::text, 'college_staff'::text])) AND (student_id IN ( SELECT students.id
   FROM students
  WHERE (students.college_id = auth_college_id())))))
  );
CREATE POLICY "Unified UPDATE Policy" ON public."student_penalty_logs" FOR UPDATE USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text, 'agency_admin'::text]))) 
    OR 
    (((auth_role() = ANY (ARRAY['college_admin'::text, 'college_staff'::text])) AND (student_id IN ( SELECT students.id
   FROM students
  WHERE (students.college_id = auth_college_id())))))
  ) WITH CHECK ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text, 'agency_admin'::text]))) 
    OR 
    (((auth_role() = ANY (ARRAY['college_admin'::text, 'college_staff'::text])) AND (student_id IN ( SELECT students.id
   FROM students
  WHERE (students.college_id = auth_college_id())))))
  );
CREATE POLICY "Unified DELETE Policy" ON public."student_penalty_logs" FOR DELETE USING ( 
    ((auth_role() = ANY (ARRAY['superadmin'::text, 'agency_staff'::text, 'agency_admin'::text]))) 
    OR 
    (((auth_role() = ANY (ARRAY['college_admin'::text, 'college_staff'::text])) AND (student_id IN ( SELECT students.id
   FROM students
  WHERE (students.college_id = auth_college_id())))))
  );
CREATE POLICY "Unified SELECT Policy" ON public."payment_requests" FOR SELECT USING ( 
    ((auth_role() = 'agency_admin'::text)) 
    OR 
    ((( SELECT auth.uid() AS uid) = user_id))
  );
CREATE POLICY "Unified INSERT Policy" ON public."payment_requests" FOR INSERT WITH CHECK ( 
    ((auth_role() = 'agency_admin'::text))
  );
CREATE POLICY "Unified UPDATE Policy" ON public."payment_requests" FOR UPDATE USING ( 
    ((auth_role() = 'agency_admin'::text))
  ) WITH CHECK ( 
    ((auth_role() = 'agency_admin'::text))
  );
CREATE POLICY "Unified DELETE Policy" ON public."payment_requests" FOR DELETE USING ( 
    ((auth_role() = 'agency_admin'::text))
  );
CREATE POLICY "Unified SELECT Policy" ON public."credit_ledgers" FOR SELECT USING ( 
    ((auth_role() = 'agency_admin'::text)) 
    OR 
    ((( SELECT auth.uid() AS uid) = user_id))
  );
CREATE POLICY "Unified INSERT Policy" ON public."credit_ledgers" FOR INSERT WITH CHECK ( 
    ((auth_role() = 'agency_admin'::text))
  );
CREATE POLICY "Unified UPDATE Policy" ON public."credit_ledgers" FOR UPDATE USING ( 
    ((auth_role() = 'agency_admin'::text))
  ) WITH CHECK ( 
    ((auth_role() = 'agency_admin'::text))
  );
CREATE POLICY "Unified DELETE Policy" ON public."credit_ledgers" FOR DELETE USING ( 
    ((auth_role() = 'agency_admin'::text))
  );
CREATE POLICY "Unified SELECT Policy" ON public."ai_interviews" FOR SELECT USING ( 
    ((( SELECT auth.uid() AS uid) = user_id))
  );
CREATE POLICY "Unified INSERT Policy" ON public."ai_interviews" FOR INSERT WITH CHECK ( 
    ((( SELECT auth.uid() AS uid) = user_id))
  );
CREATE POLICY "Unified UPDATE Policy" ON public."ai_interviews" FOR UPDATE USING ( 
    ((( SELECT auth.uid() AS uid) = user_id))
  ) WITH CHECK ( 
    ((( SELECT auth.uid() AS uid) = user_id))
  );
CREATE POLICY "Unified DELETE Policy" ON public."ai_interviews" FOR DELETE USING ( 
    ((( SELECT auth.uid() AS uid) = user_id))
  );
CREATE POLICY "Unified SELECT Policy" ON public."certificates" FOR SELECT USING ( 
    ((auth_role() = 'agency_admin'::text)) 
    OR 
    (((auth_role() = 'college_admin'::text) AND (EXISTS ( SELECT 1
   FROM students
  WHERE ((students.user_id = certificates.user_id) AND (students.college_id = auth_college_id())))))) 
    OR 
    ((( SELECT auth.uid() AS uid) = user_id))
  );
CREATE POLICY "Unified INSERT Policy" ON public."certificates" FOR INSERT WITH CHECK ( 
    ((auth_role() = 'agency_admin'::text)) 
    OR 
    (((auth_role() = 'college_admin'::text) AND (EXISTS ( SELECT 1
   FROM students
  WHERE ((students.user_id = certificates.user_id) AND (students.college_id = auth_college_id()))))))
  );
CREATE POLICY "Unified UPDATE Policy" ON public."certificates" FOR UPDATE USING ( 
    ((auth_role() = 'agency_admin'::text)) 
    OR 
    (((auth_role() = 'college_admin'::text) AND (EXISTS ( SELECT 1
   FROM students
  WHERE ((students.user_id = certificates.user_id) AND (students.college_id = auth_college_id()))))))
  ) WITH CHECK ( 
    ((auth_role() = 'agency_admin'::text)) 
    OR 
    (((auth_role() = 'college_admin'::text) AND (EXISTS ( SELECT 1
   FROM students
  WHERE ((students.user_id = certificates.user_id) AND (students.college_id = auth_college_id()))))))
  );
CREATE POLICY "Unified DELETE Policy" ON public."certificates" FOR DELETE USING ( 
    ((auth_role() = 'agency_admin'::text)) 
    OR 
    (((auth_role() = 'college_admin'::text) AND (EXISTS ( SELECT 1
   FROM students
  WHERE ((students.user_id = certificates.user_id) AND (students.college_id = auth_college_id()))))))
  );
CREATE POLICY "Unified SELECT Policy" ON public."student_integrations" FOR SELECT USING ( 
    ((( SELECT auth.uid() AS uid) = user_id))
  );
CREATE POLICY "Unified INSERT Policy" ON public."student_integrations" FOR INSERT WITH CHECK ( 
    ((( SELECT auth.uid() AS uid) = user_id))
  );
CREATE POLICY "Unified UPDATE Policy" ON public."student_integrations" FOR UPDATE USING ( 
    ((( SELECT auth.uid() AS uid) = user_id))
  ) WITH CHECK ( 
    ((( SELECT auth.uid() AS uid) = user_id))
  );
CREATE POLICY "Unified DELETE Policy" ON public."student_integrations" FOR DELETE USING ( 
    ((( SELECT auth.uid() AS uid) = user_id))
  );
CREATE POLICY "Unified SELECT Policy" ON public."ai_resumes" FOR SELECT USING ( 
    ((( SELECT auth.uid() AS uid) = user_id))
  );
CREATE POLICY "Unified INSERT Policy" ON public."ai_resumes" FOR INSERT WITH CHECK ( 
    ((( SELECT auth.uid() AS uid) = user_id))
  );
CREATE POLICY "Unified UPDATE Policy" ON public."ai_resumes" FOR UPDATE USING ( 
    ((( SELECT auth.uid() AS uid) = user_id))
  ) WITH CHECK ( 
    ((( SELECT auth.uid() AS uid) = user_id))
  );
CREATE POLICY "Unified DELETE Policy" ON public."ai_resumes" FOR DELETE USING ( 
    ((( SELECT auth.uid() AS uid) = user_id))
  );
