ALTER TABLE colleges 
ADD COLUMN onboarding_fields JSONB DEFAULT '{"years": [], "types": [], "departments": []}'::jsonb;
