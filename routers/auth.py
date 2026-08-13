import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import crud
import schemas
import security
from config import settings
from database import get_db
import models
from models import User

router = APIRouter(prefix="/auth", tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


@router.post("/register", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    if crud.get_user_by_email(db, payload.email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    return crud.create_user(db, payload.full_name, payload.email, payload.password)


@router.post("/login", response_model=schemas.TokenPair)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, form_data.username)
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user")

    access_token = security.create_access_token(str(user.id))
    refresh_token = security.create_refresh_token(str(user.id))
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    crud.store_refresh_token(db, user.id, refresh_token, expires_at)

    return schemas.TokenPair(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=schemas.TokenPair)
def refresh(payload: schemas.RefreshRequest, db: Session = Depends(get_db)):
    try:
        decoded = security.decode_token(payload.refresh_token)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    if decoded.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

    db_token = crud.get_valid_refresh_token(db, payload.refresh_token)
    if db_token is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired or revoked")

    crud.revoke_refresh_token(db, db_token)

    user_id = decoded["sub"]
    access_token = security.create_access_token(user_id)
    new_refresh_token = security.create_refresh_token(user_id)
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    crud.store_refresh_token(db, db_token.user_id, new_refresh_token, expires_at)

    return schemas.TokenPair(access_token=access_token, refresh_token=new_refresh_token)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(payload: schemas.RefreshRequest, db: Session = Depends(get_db)):
    db_token = crud.get_valid_refresh_token(db, payload.refresh_token)
    if db_token:
        crud.revoke_refresh_token(db, db_token)
    return None


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        decoded = security.decode_token(token)
    except ValueError:
        raise credentials_error

    if decoded.get("type") != "access":
        raise credentials_error

    try:
        user_id = uuid.UUID(decoded["sub"])
    except (KeyError, ValueError):
        raise credentials_error

    user = crud.get_user_by_id(db, user_id)
    if user is None:
        raise credentials_error
    return user


@router.get("/me", response_model=schemas.UserOut)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=schemas.UserOut)
def update_profile(
    payload: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.update_user(db, current_user, payload)


@router.post("/change-password")
def change_password(
    payload: schemas.ChangePassword,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    success = crud.change_user_password(db, current_user, payload.old_password, payload.new_password)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect old password"
        )
    return {"message": "Password updated successfully"}


@router.post("/forgot-password")
def forgot_password(
    payload: schemas.ForgotPassword,
    db: Session = Depends(get_db)
):
    return {"message": f"Password reset instructions sent to {payload.email}"}


@router.post("/reset-password")
def reset_password(
    payload: schemas.ResetPassword,
    db: Session = Depends(get_db)
):
    success = crud.reset_user_password(db, payload.email, payload.new_password)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User with this email not found"
        )
    return {"message": "Password reset successfully"}


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    crud.delete_user_account(db, current_user)
    return None