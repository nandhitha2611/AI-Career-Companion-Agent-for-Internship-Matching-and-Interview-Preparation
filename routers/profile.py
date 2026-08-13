from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import crud, schemas, models
from database import get_db
from routers.auth import get_current_user

router = APIRouter(prefix="/profile", tags=["User Profile"])


@router.post("/", response_model=schemas.StudentProfileOut)
def create_or_update_profile(
    payload: schemas.StudentProfileCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return crud.create_or_update_profile(db, current_user.id, payload)


@router.get("/", response_model=schemas.StudentProfileOut)
def get_profile(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    profile = crud.get_profile_by_user_id(db, current_user.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found. Please create one first.",
        )
    return profile