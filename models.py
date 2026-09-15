import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import String, Boolean, Column, DateTime, ForeignKey, Integer, JSON, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class User(Base):

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    resumes: Mapped[list["Resume"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    # 1-to-1 relationship with StudentProfile
    profile: Mapped["StudentProfile"] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False
    )

    full_name: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True
    )

    email: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    phone: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True
    )

    address: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    linkedin: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )

    github: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )

    summary: Mapped[str | None] = mapped_column(
        String(2000),
        nullable=True
    )

    technical_skills: Mapped[list[Any] | None] = mapped_column(JSONB, nullable=True)
    soft_skills: Mapped[list[Any] | None] = mapped_column(JSONB, nullable=True)
    education: Mapped[list[Any] | None] = mapped_column(JSONB, nullable=True)
    work_experience: Mapped[list[Any] | None] = mapped_column(JSONB, nullable=True)
    projects: Mapped[list[Any] | None] = mapped_column(JSONB, nullable=True)
    internships: Mapped[list[Any] | None] = mapped_column(JSONB, nullable=True)
    certifications: Mapped[list[Any] | None] = mapped_column(JSONB, nullable=True)
    languages: Mapped[list[Any] | None] = mapped_column(JSONB, nullable=True)
    achievements: Mapped[list[Any] | None] = mapped_column(JSONB, nullable=True)

    user: Mapped["User"] = relationship(
        back_populates="profile"
    )


class RefreshToken(Base):

    __tablename__ = "refresh_tokens"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token: Mapped[str] = mapped_column(String(512), unique=True, index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked: Mapped[bool] = mapped_column(Boolean, default=False)

    user: Mapped["User"] = relationship(back_populates="refresh_tokens")


class Resume(Base):

    __tablename__ = "resumes"
    @property
    def skills(self):
        if hasattr(self,"parsed_data") and isinstance(self.parsed_data, dict):
            skills_data=self.parsed_data.get("skills")
            if isinstance(skills_data, list):
                return ", ".join(skills_data)
            elif isinstance(skills_data, dict):
                flat_skills=[]
                for category_skills in skills_data.values():
                    if isinstance(category_skills, list):
                        flat_skills.extend(category_skills)
                    elif isinstance(category_skills,str):
                        flat_skills.append(category_skills)
                return ", ".join(flat_skills)
            elif isinstance(skills_data,str):
                return skills_data
        return getattr(self, "skills_text", None)

    @property
    def education(self):
        if hasattr(self, "parsed_data") and isinstance(self.parsed_data, dict):
            edu = self.parsed_data.get("education")
            if isinstance(edu, list):
                return " ".join(str(e) for e in edu)
            return edu
        return getattr(self, "education_text", None)

    @property
    def professional_summary(self):
        if hasattr(self, "parsed_data") and isinstance(self.parsed_data, dict):
            return self.parsed_data.get("summary") or self.parsed_data.get("professional_summary")
        return getattr(self, "summary", None)

    @property
    def extracted_text(self):
        return getattr(self, "raw_text", None) or getattr(self, "text", None)

    @property
    def location(self):
        if hasattr(self, "parsed_data") and isinstance(self.parsed_data, dict):
            return self.parsed_data.get("location")
        return getattr(self, "location_text", None)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    stored_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    content_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_size: Mapped[int] = mapped_column(nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    parsed_data= Column(JSON, nullable=True)

    user: Mapped["User"] = relationship(back_populates="resumes")


class InternshipApplication(Base):
    __tablename__ = "internship_applications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    resume_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("resumes.id", ondelete="RESTRICT"), nullable=False
    )
    internship_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    role_title: Mapped[str] = mapped_column(String(255), nullable=False)
    company: Mapped[str] = mapped_column(String(255), nullable=False)
    cover_letter: Mapped[str | None] = mapped_column(String(10000), nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="submitted")
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    resume: Mapped["Resume"] = relationship()

class ChatConversation(Base):
    __tablename__ = "chat_conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)
    session_id = Column(String, index=True, nullable=False)
    user_query = Column(Text, nullable=False)
    assistant_response = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)