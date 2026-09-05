from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import json
import uuid

import crud, schemas, models
from database import get_db
from routers.auth import get_current_user

router = APIRouter(prefix="/profile", tags=["User Profile"])


@router.get("/", response_model=schemas.StudentProfileOut)
def get_profile(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    profile = crud.get_profile_by_user_id(db, current_user.id)

    if not profile:
        return schemas.StudentProfileOut(
            id=uuid.uuid4(),
            user_id=current_user.id,
            full_name=current_user.full_name,
            email=current_user.email,
            phone="",
            address="",
            linkedin="",
            github="",
            summary="",
            technical_skills=[],
            soft_skills=[],
            education=[],
            work_experience=[],
            projects=[],
            internships=[],
            certifications=[]
        )

    return profile


@router.get("/")
def get_profile(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    profile = crud.get_profile_by_user_id(db, current_user.id)
    
    # Extract baseline info from Auth User model
    auth_name = getattr(current_user, "full_name", f"{getattr(current_user, 'first_name', '')} {getattr(current_user, 'last_name', '')}".strip())
    
    # Default state if no database profile exists yet
    fallback_data = {
        "user_id": current_user.id,
        "full_name": auth_name,
        "first_name": getattr(current_user, "first_name", ""),
        "last_name": getattr(current_user, "last_name", ""),
        "email": getattr(current_user, "email", ""),
        "phone": getattr(current_user, "phone", ""),
        "address": "",
        "linkedin": "",
        "github": "",
        "summary": "",
        "technical_skills": [],
        "soft_skills": [],
        "education": [],
        "work_experience": [],
        "projects": [],
        "internships": [],
        "certifications": [],
    }

    if not profile:
        return fallback_data

    # Merge database profile fields
    profile_dict = profile.__dict__.copy()
    
    # Helper to parse stringified JSON or legacy comma-separated values back to arrays
    def ensure_list(val):
        if isinstance(val, list):
            return val
        if isinstance(val, str) and val.strip():
            if val.strip().startswith('['):
                try:
                    return json.loads(val)
                except Exception:
                    pass
            return [item.strip() for item in val.split(',') if item.strip()]
        return []

    return {
        "user_id": current_user.id,
        "full_name": getattr(profile, "full_name", None) or profile_dict.get("full_name") or auth_name,
        "first_name": getattr(profile, "first_name", None) or fallback_data["first_name"],
        "last_name": getattr(profile, "last_name", None) or fallback_data["last_name"],
        "email": getattr(profile, "email", None) or getattr(current_user, "email", ""),
        "phone": getattr(profile, "phone", None) or getattr(profile, "phone_number", None) or getattr(current_user, "phone", ""),
        "address": getattr(profile, "address", None) or getattr(profile, "location", ""),
        "linkedin": getattr(profile, "linkedin", None) or getattr(profile, "linkedin_profile", ""),
        "github": getattr(profile, "github", None) or getattr(profile, "github_profile", ""),
        "summary": getattr(profile, "summary", None) or getattr(profile, "bio", None) or getattr(profile, "professional_summary", ""),
        "technical_skills": ensure_list(getattr(profile, "technical_skills", None) or getattr(profile, "skills", None)),
        "soft_skills": ensure_list(getattr(profile, "soft_skills", None)),
        "education": ensure_list(getattr(profile, "education", None)),
        "work_experience": ensure_list(getattr(profile, "work_experience", None)),
        "projects": ensure_list(getattr(profile, "projects", None)),
        "internships": ensure_list(getattr(profile, "internships", None)),
        "certifications": ensure_list(getattr(profile, "certifications", None)),
    }


@router.post("/sync-resume/{resume_id}", response_model=schemas.StudentProfileOut)
def sync_profile_from_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    resume = crud.get_resume_by_id(db, resume_id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    parsed = resume.parsed_data or {}
    
    # Pass all parsed keys matching StudentProfileCreate
    payload = schemas.StudentProfileCreate(
        full_name=parsed.get("full_name", ""),
        email=parsed.get("email", ""),
        phone=parsed.get("phone_number") or parsed.get("phone", ""),
        address=parsed.get("address", ""),
        linkedin=parsed.get("linkedin_profile") or parsed.get("linkedin", ""),
        github=parsed.get("github_profile") or parsed.get("github", ""),
        summary=parsed.get("professional_summary") or parsed.get("summary", ""),
        technical_skills=parsed.get("technical_skills") or parsed.get("skills", []),
        soft_skills=parsed.get("soft_skills", []),
        education=parsed.get("education", []),
        work_experience=parsed.get("work_experience", []),
        projects=parsed.get("projects", []),
        internships=parsed.get("internships", []),
        certifications=parsed.get("certifications", []),
    )
    return crud.create_or_update_profile(db, current_user.id, payload)