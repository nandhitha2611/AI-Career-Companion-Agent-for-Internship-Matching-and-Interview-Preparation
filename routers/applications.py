from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import crud, models, schemas
from database import get_db
from routers.auth import get_current_user

router = APIRouter(prefix="/applications", tags=["Applications"])


def serialize_application(application: models.InternshipApplication) -> dict:
    return {
        "id": application.id,
        "user_id": application.user_id,
        "internship_id": application.internship_id,
        "resume_id": application.resume_id,
        "resume_filename": application.resume.original_filename,
        "role_title": application.role_title,
        "company": application.company,
        "cover_letter": application.cover_letter,
        "status": application.status,
        "submitted_at": application.submitted_at,
    }


@router.post("/", response_model=schemas.InternshipApplicationOut, status_code=status.HTTP_201_CREATED)
def create_application(
    payload: schemas.InternshipApplicationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    resume = crud.get_resume_by_id(db, payload.resume_id)
    if not resume or resume.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

    application = crud.create_application(db, current_user.id, payload, resume)
    return serialize_application(application)


@router.get("/", response_model=list[schemas.InternshipApplicationOut])
def list_my_applications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    applications = crud.get_applications_by_user(db, current_user.id)
    return [serialize_application(application) for application in applications]
