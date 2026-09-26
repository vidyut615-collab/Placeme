CREATE TABLE IF NOT EXISTS platform_master_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    value TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(category, value)
);

-- RLS Policies
ALTER TABLE platform_master_data ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
CREATE POLICY "Allow read access to authenticated users on platform_master_data" 
ON platform_master_data FOR SELECT TO authenticated USING (true);

-- Allow full access to superadmins and agency_staff
CREATE POLICY "Allow full access to agency on platform_master_data" 
ON platform_master_data FOR ALL TO authenticated 
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'superadmin' 
  OR 
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'agency_staff'
  OR 
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'agency_admin'
);
