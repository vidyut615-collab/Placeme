CREATE TABLE IF NOT EXISTS platform_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    max_global_applications_per_student INTEGER DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure only one row exists
CREATE UNIQUE INDEX IF NOT EXISTS single_row_platform_settings ON platform_settings((true));

-- Insert default row
INSERT INTO platform_settings (max_global_applications_per_student) VALUES (10) ON CONFLICT DO NOTHING;

-- RLS
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to authenticated users on platform_settings" 
ON platform_settings FOR SELECT TO authenticated USING (true);

-- We use the helper function auth_role() if it exists, otherwise fallback to users table
CREATE POLICY "Allow superadmin update on platform_settings" 
ON platform_settings FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
);
