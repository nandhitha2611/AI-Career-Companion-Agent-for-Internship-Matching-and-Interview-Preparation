-- Run once against the existing PostgreSQL database before restarting the API.
-- This preserves values from the original student_profiles schema.

BEGIN;

ALTER TABLE student_profiles
    ADD COLUMN IF NOT EXISTS full_name VARCHAR(150),
    ADD COLUMN IF NOT EXISTS email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
    ADD COLUMN IF NOT EXISTS linkedin VARCHAR(500),
    ADD COLUMN IF NOT EXISTS github VARCHAR(500),
    ADD COLUMN IF NOT EXISTS summary VARCHAR(2000),
    ADD COLUMN IF NOT EXISTS technical_skills JSONB,
    ADD COLUMN IF NOT EXISTS soft_skills JSONB,
    ADD COLUMN IF NOT EXISTS education JSONB,
    ADD COLUMN IF NOT EXISTS work_experience JSONB,
    ADD COLUMN IF NOT EXISTS projects JSONB,
    ADD COLUMN IF NOT EXISTS internships JSONB,
    ADD COLUMN IF NOT EXISTS certifications JSONB,
    ADD COLUMN IF NOT EXISTS languages JSONB,
    ADD COLUMN IF NOT EXISTS achievements JSONB;

-- The original schema has phone_number and bio. Retain their values in the
-- field names used by the API and frontend.
UPDATE student_profiles
SET
    phone = COALESCE(phone, phone_number),
    summary = COALESCE(summary, bio);

COMMIT;
