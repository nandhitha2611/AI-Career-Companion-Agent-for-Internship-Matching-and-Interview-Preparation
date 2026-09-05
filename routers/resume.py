import uuid
import re
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

import crud, schemas
from database import get_db
from models import User
from routers.auth import get_current_user

# Import the actual service parser from services/
from services.resume_parser import parse_resume_text

router = APIRouter(prefix="/resume", tags=["resume"])

ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx"}
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB

UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads" / "resumes"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def extract_raw_text(contents: bytes, extension: str) -> str:
    """Extracts raw text safely from uploaded PDF or Word bytes."""
    text = ""
    try:
        if extension == ".pdf":
            import pypdf
            import io
            reader = pypdf.PdfReader(io.BytesIO(contents))
            text = "\n".join([page.extract_text() or "" for page in reader.pages])
        elif extension in {".doc", ".docx"}:
            import docx
            import io
            doc = docx.Document(io.BytesIO(contents))
            text = "\n".join([para.text for para in doc.paragraphs])
    except Exception:
        text = contents.decode("utf-8", errors="ignore")
    
    return text if text.strip() else contents.decode("utf-8", errors="ignore")


def clean_phone_number(phone_raw: str | None) -> str | None:
    """Fixes spaced out phone numbers extracted from PDF files."""
    if not phone_raw:
        return None
    # Removes whitespace between consecutive digits (e.g., "+ 9 1 9 8 8" -> "+91988")
    cleaned = re.sub(r'(?<=\d)\s+(?=\d)', '', phone_raw.strip())
    return re.sub(r'\s+', ' ', cleaned)


@router.post("/upload", response_model=schemas.ResumeOut, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await file.seek(0)

    original_name = Path(file.filename or "").name
    extension = Path(original_name).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{extension}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    contents = await file.read()
    if not contents:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty"
        )
    if len(contents) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="File too large (max 5 MB)"
        )

    # Save file to user folder
    user_dir = UPLOAD_DIR / str(current_user.id)
    user_dir.mkdir(parents=True, exist_ok=True)

    stored_filename = f"{uuid.uuid4().hex}{extension}"
    file_path = user_dir / stored_filename
    file_path.write_bytes(contents)

    # 1. Extract raw text from file bytes
    raw_text = extract_raw_text(contents, extension)

    # 2. Process through services/resume_parser.py
    parsed_info = parse_resume_text(raw_text)

    # Sanitize phone number spacing if present
    if isinstance(parsed_info, dict) and parsed_info.get("phone_number"):
        parsed_info["phone_number"] = clean_phone_number(parsed_info["phone_number"])

    # 3. Save to database
    db_resume = crud.create_resume(
        db=db,
        user_id=current_user.id,
        original_filename=original_name,
        stored_filename=stored_filename,
        file_path=str(file_path),
        content_type=file.content_type or "application/octet-stream",
        file_size=len(contents),
        parsed_data=parsed_info,
    )
    print("SAVED TO DB OBJECT:", db_resume.parsed_data)

    return db_resume


@router.get("/", response_model=list[schemas.ResumeOut])
def list_my_resumes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resumes = crud.get_resumes_by_user(db=db, user_id=current_user.id)
    
    # Normalize legacy string entries stored in DB to valid lists
    for r in resumes:
        if isinstance(r.parsed_data, dict):
            # Convert skills string to list
            skills = r.parsed_data.get("skills")
            if isinstance(skills, str):
                r.parsed_data["skills"] = [s.strip() for s in skills.split(",") if s.strip()]
            elif not isinstance(skills, list):
                r.parsed_data["skills"] = []

            # Convert education string to list
            edu = r.parsed_data.get("education")
            if isinstance(edu, str):
                r.parsed_data["education"] = [{"institution": edu, "degree": "", "year": ""}] if edu.strip() else []
            elif not isinstance(edu, list):
                r.parsed_data["education"] = []

    return resumes


@router.get("/{resume_id}/download")
def download_resume(
    resume_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resume = crud.get_resume_by_id(db=db, resume_id=resume_id)
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

    return FileResponse(
        path=resume.file_path,
        filename=resume.original_filename,
        media_type=resume.content_type,
    )