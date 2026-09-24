-- Migration: Add profile fields to users and invitations for college staff / admins
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

ALTER TABLE public.invitations
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' AND policyname = 'College Admin can update users in same college'
  ) THEN
    CREATE POLICY "College Admin can update users in same college"
      ON public.users
      FOR UPDATE
      USING (college_id = auth_college_id() AND auth_role() = 'college_admin')
      WITH CHECK (college_id = auth_college_id() AND auth_role() = 'college_admin');
  END IF;
END $$;
