CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired');

CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    role user_role NOT NULL,
    college_id UUID REFERENCES colleges(id) ON DELETE CASCADE,
    invited_by UUID REFERENCES users(id) ON DELETE CASCADE,
    status invitation_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS POLICIES FOR INVITATIONS
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Agency can do all
CREATE POLICY "Agency can do all on invitations" ON invitations FOR ALL USING (auth_role() IN ('superadmin', 'agency_staff'));

-- College Staff can manage invitations for their own college
CREATE POLICY "College Admin can manage college invitations" ON invitations FOR ALL USING (college_id = auth_college_id());
