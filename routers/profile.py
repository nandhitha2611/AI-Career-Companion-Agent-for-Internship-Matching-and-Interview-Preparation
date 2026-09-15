import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

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
        )

    return profile


@router.post("/", response_model=schemas.StudentProfileOut)
def create_or_update_user_profile(
    payload: schemas.StudentProfileCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return crud.create_or_update_profile(db, current_user.id, payload)


@router.post("/sync-resume/{resume_id}", response_model=schemas.StudentProfileOut)
def sync_profile_from_resume(
    resume_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    resume = crud.get_resume_by_id(db, resume_id)
    if not resume or resume.user_id != current_user.id:
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
        languages=parsed.get("languages", []),
        achievements=parsed.get("achievements", []),
    )
    return crud.create_or_update_profile(db, current_user.id, payload)
