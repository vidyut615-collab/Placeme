-- Performance Advisor Index Suggestions
CREATE INDEX IF NOT EXISTS idx_students_is_blacklisted ON public.students USING btree (is_blacklisted);
CREATE INDEX IF NOT EXISTS idx_profile_update_requests_student_id ON public.profile_update_requests USING btree (student_id);
