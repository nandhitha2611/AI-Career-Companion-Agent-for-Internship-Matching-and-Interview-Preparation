-- Run once against PostgreSQL after 001_expand_student_profiles.sql.
CREATE TABLE IF NOT EXISTS internship_applications (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE RESTRICT,
    internship_id UUID NOT NULL,
    role_title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    cover_letter VARCHAR(10000),
    status VARCHAR(50) NOT NULL DEFAULT 'submitted',
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_internship_applications_user_id
    ON internship_applications (user_id);
CREATE INDEX IF NOT EXISTS ix_internship_applications_internship_id
    ON internship_applications (internship_id);
