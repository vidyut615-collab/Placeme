-- Add new columns to colleges table for extended profile details
ALTER TABLE public.colleges
ADD COLUMN website text,
ADD COLUMN location text,
ADD COLUMN description text,
ADD COLUMN contact_email text,
ADD COLUMN contact_phone text,
ADD COLUMN logo_url text;

-- Create a new RLS policy allowing College Staff to UPDATE their own college row
-- (They already have SELECT access from 00001_init_schema.sql)
CREATE POLICY "College Staff can update own college" 
ON public.colleges 
FOR UPDATE 
USING (id = auth_college_id());
