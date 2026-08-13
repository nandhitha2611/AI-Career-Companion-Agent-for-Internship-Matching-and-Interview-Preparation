import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session
import models
import security
import schemas
from security import hash_password, verify_password


def get_user_by_email(db: Session, email: str) -> models.User | None:
    """SELECT * FROM users WHERE email = :email LIMIT 1"""
    return db.query(models.User).filter(models.User.email == email).first()


def get_user_by_id(db: Session, user_id: uuid.UUID) -> models.User | None:
    return db.query(models.User).filter(models.User.id == user_id).first()


def create_user(db: Session, full_name: str, email: str, password: str) -> models.User:
    """Hashes the password, then INSERTs a new row into `users`."""
    user = models.User(
        full_name=full_name,
        email=email,
        hashed_password=security.hash_password(password),
    )
    db.add(user)      # stages new row
    db.commit()       # write it to Postgres
    db.refresh(user)  # pulls back DB-generated fields (id, created_at)
    return user


def store_refresh_token(db: Session, user_id: uuid.UUID, token: str, expires_at: datetime) -> models.RefreshToken:
    db_token = models.RefreshToken(user_id=user_id, token=token, expires_at=expires_at)
    db.add(db_token)
    db.commit()
    db.refresh(db_token)
    return db_token


def get_valid_refresh_token(db: Session, token: str) -> models.RefreshToken | None:
    db_token = db.query(models.RefreshToken).filter(models.RefreshToken.token == token).first()
    if db_token is None or db_token.revoked:
        return None
    if db_token.expires_at < datetime.now(timezone.utc):
        return None
    return db_token


def revoke_refresh_token(db: Session, db_token: models.RefreshToken) -> None:
    db_token.revoked = True
    db.commit()

def create_or_update_profile(db: Session, user_id: uuid.UUID, profile_data: schemas.StudentProfileCreate) -> models.StudentProfile:
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == user_id).first()
    if profile:
        for key, value in profile_data.model_dump(exclude_unset=True).items():
            setattr(profile, key, value)
    else:
        profile = models.StudentProfile(user_id=user_id, **profile_data.model_dump())
        db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


def get_profile_by_user_id(db: Session, user_id: uuid.UUID) -> models.StudentProfile | None:
    return db.query(models.StudentProfile).filter(models.StudentProfile.user_id == user_id).first()

def create_resume(
    db: Session,
    user_id: str,
    original_filename: str,
    stored_filename: str,
    file_path: str,
    content_type: str,
    file_size: int,
    parsed_data: dict,  # Accepts parsed_data
):
    db_resume = models.Resume(
        user_id=user_id,
        original_filename=original_filename,
        stored_filename=stored_filename,
        file_path=file_path,
        content_type=content_type,
        file_size=file_size,
        parsed_data=parsed_data,  
    )
    db.add(db_resume)
    db.commit()
    db.refresh(db_resume)
    return db_resume


def get_resumes_by_user(db: Session, user_id: uuid.UUID) -> list[models.Resume]:
    """All resumes a given student has uploaded, most recent first."""
    return (
        db.query(models.Resume)
        .filter(models.Resume.user_id == user_id)
        .order_by(models.Resume.uploaded_at.desc())
        .all()
    )


def get_resume_by_id(db: Session, resume_id: uuid.UUID) -> models.Resume | None:
    return db.query(models.Resume).filter(models.Resume.id == resume_id).first()

def update_user(db: Session, user: models.User, update_data: schemas.UserUpdate):
    if update_data.full_name is not None:
        user.full_name = update_data.full_name
    if update_data.email is not None:
        user.email = update_data.email
    db.commit()
    db.refresh(user)
    return user

def change_user_password(db: Session, user: models.User, old_pass: str, new_pass: str) -> bool:
    if not verify_password(old_pass, user.hashed_password):
        return False
    user.hashed_password = hash_password(new_pass)
    db.commit()
    return True

def reset_user_password(db: Session, email: str, new_pass: str) -> bool:
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        return False
    user.hashed_password = hash_password(new_pass)
    db.commit()
    return True

def delete_user_account(db: Session, user: models.User):
    db.delete(user)
    db.commit()