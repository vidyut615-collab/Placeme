-- Add missing indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_profile_update_requests_student_id ON public.profile_update_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_student_offers_student_id ON public.student_offers(student_id);
