-- Fix RLS policies to include the new 'agency_admin' role alongside superadmin and agency_staff

DROP POLICY IF EXISTS "Agency can do all on jobs" ON jobs;
CREATE POLICY "Agency can do all on jobs" ON jobs FOR ALL USING (auth_role() IN ('superadmin', 'agency_staff', 'agency_admin'));

DROP POLICY IF EXISTS "Agency can do all on applications" ON applications;
CREATE POLICY "Agency can do all on applications" ON applications FOR ALL USING (auth_role() IN ('superadmin', 'agency_staff', 'agency_admin'));

DROP POLICY IF EXISTS "Agency can do all on colleges" ON colleges;
CREATE POLICY "Agency can do all on colleges" ON colleges FOR ALL USING (auth_role() IN ('superadmin', 'agency_staff', 'agency_admin'));

DROP POLICY IF EXISTS "Agency can do all on students" ON students;
CREATE POLICY "Agency can do all on students" ON students FOR ALL USING (auth_role() IN ('superadmin', 'agency_staff', 'agency_admin'));

DROP POLICY IF EXISTS "Agency can do all on placement policies" ON placement_policies;
CREATE POLICY "Agency can do all on placement policies" ON placement_policies FOR ALL USING (auth_role() IN ('superadmin', 'agency_staff', 'agency_admin'));
