-- Initialize monetization and AI tables

-- 1. Modify students table
ALTER TABLE students ADD COLUMN access_end_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE students ADD COLUMN credit_balance INTEGER DEFAULT 0;

-- 2. payment_requests
CREATE TABLE payment_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    college_id UUID REFERENCES colleges(id) ON DELETE SET NULL,
    amount NUMERIC NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'cancelled', 'failed')) DEFAULT 'pending',
    type TEXT NOT NULL CHECK (type IN ('onboarding_fee', 'renewal_fee', 'credit_topup')),
    payload JSONB,
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. credit_ledgers
CREATE TABLE credit_ledgers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ai_resumes
CREATE TABLE ai_resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT,
    content JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. ai_interviews
CREATE TABLE ai_interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT,
    score INTEGER,
    feedback JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. certificates
CREATE TABLE certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    issuer TEXT,
    pdf_url TEXT,
    issue_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. student_integrations
CREATE TABLE student_integrations (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    linkedin_access_token TEXT,
    linkedin_person_urn TEXT,
    linkedin_token_expiry TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS)

-- Enable RLS
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_ledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_integrations ENABLE ROW LEVEL SECURITY;

-- payment_requests RLS
CREATE POLICY "Students can view their own payment requests" 
ON payment_requests FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Agency admins have full access to payment requests"
ON payment_requests FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'agency_admin')
);

-- credit_ledgers RLS
CREATE POLICY "Students can view their own credit ledgers" 
ON credit_ledgers FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Agency admins have full access to credit ledgers"
ON credit_ledgers FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'agency_admin')
);

-- ai_resumes RLS (Safe Space: Only Student)
CREATE POLICY "Students fully control their own AI resumes" 
ON ai_resumes FOR ALL USING (auth.uid() = user_id);

-- ai_interviews RLS (Safe Space: Only Student)
CREATE POLICY "Students fully control their own AI interviews" 
ON ai_interviews FOR ALL USING (auth.uid() = user_id);

-- certificates RLS
CREATE POLICY "Students can view their own certificates" 
ON certificates FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Agency admins can manage certificates"
ON certificates FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'agency_admin')
);

CREATE POLICY "College admins can manage certificates for their students"
ON certificates FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        JOIN students ON students.user_id = certificates.user_id
        WHERE users.id = auth.uid() 
        AND users.role = 'college_admin' 
        AND users.college_id = students.college_id
    )
);

-- student_integrations RLS
CREATE POLICY "Students fully control their own integrations" 
ON student_integrations FOR ALL USING (auth.uid() = user_id);
