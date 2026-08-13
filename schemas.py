import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, EmailStr, ConfigDict, Field


class UserCreate(BaseModel):
    
    full_name: str = Field(min_length=1, max_length=150)
    email: EmailStr  # rejects malformed emails automatically
    password: str = Field(min_length=8, max_length=128)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    full_name: str
    email: EmailStr
    is_active: bool
    created_at: datetime


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenPair(BaseModel):
   
    access_token: str   # short-lived, sent with every authenticated request
    refresh_token: str  # long-lived, used only to obtain a new access_token
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
   
    refresh_token: str

class ParsedResumeData(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None
    linkedin_profile: Optional[str] = None
    github_profile: Optional[str] = None
    professional_summary: Optional[str] = None
    technical_skills: List[str] = []
    soft_skills: List[str] = []
    skills: List[str] = []
    education: List[Dict[str, Any]] = []
    work_experience: List[Dict[str, Any]] = []
    projects: List[Dict[str, Any]] = []
    certifications: List[str] = []
    internships: List[Dict[str, Any]] = []
    languages: List[str] = []
    achievements: List[str] = []


class ResumeOut(BaseModel):
   
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    original_filename: str
    content_type: str
    file_size: int
    content_type: str
    uploaded_at: datetime
    parsed_data: Optional[ParsedResumeData]=None

    

class UserUpdate(BaseModel):
    full_name: Optional[str]=None
    email: Optional[EmailStr]=None

class ChangePassword(BaseModel):
    old_password: str
    new_password: str

class ForgotPassword(BaseModel):
    email: EmailStr

class ResetPassword(BaseModel):
    email: EmailStr
    new_password: str

class StudentProfileCreate(BaseModel):
    phone_number: Optional[str] = None
    address: Optional[str] = None
    college: Optional[str] = None
    branch: Optional[str] = None
    graduation_year: Optional[int] = None
    bio: Optional[str] = None


class StudentProfileOut(StudentProfileCreate):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    user_id: uuid.UUID

