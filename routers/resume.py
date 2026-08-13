import uuid
import re
import io
from pathlib import Path
from typing import Dict, Any
from docx import Document

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

import crud, schemas
from database import get_db
from models import User
from routers.auth import get_current_user
from parser import parse_resume_hybrid

router = APIRouter(prefix="/resume", tags=["resume"])

ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx"}
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads" / "resumes"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def extract_text_from_file(contents: bytes, extension: str) -> str:
    text = ""
    try:
        if extension == ".pdf":
            # Basic PDF text extraction using pypdf/pdfplumber if available, 
            # falling back to regex text extraction
            try:
                import pypdf
                reader = pypdf.PdfReader(io.BytesIO(contents))
                text = "\n".join([page.extract_text() or "" for page in reader.pages])
            except ImportError:
                text = contents.decode("utf-8", errors="ignore")
                
        elif extension in {".doc", ".docx"}:
            try:
                import docx
                doc = docx.Document(io.BytesIO(contents))
                text = "\n".join([para.text for para in doc.paragraphs])
            except ImportError:
                text = contents.decode("utf-8", errors="ignore")
    except Exception as e:
        text = contents.decode("utf-8", errors="ignore")
    return text


def parse_resume_text(text: str) -> Dict[str, Any]:
    # Email extraction
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
    email = email_match.group(0) if email_match else None

    # Phone number extraction
    phone_match = re.search(r'(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}', text)
    phone_number = phone_match.group(0) if phone_match else None

    # Social links
    linkedin_match = re.search(r'(https?://[^\s]*linkedin\.com/[^\s]+)', text, re.IGNORECASE)
    linkedin_profile = linkedin_match.group(0) if linkedin_match else None

    github_match = re.search(r'(https?://[^\s]*github\.com/[^\s]+)', text, re.IGNORECASE)
    github_profile = github_match.group(0) if github_match else None

    # Technical Skills detection
    common_skills = [
        "Python", "Java", "C++", "JavaScript", "TypeScript", "React", "FastAPI", 
        "PostgreSQL", "SQL", "AWS", "Docker", "Git", "HTML", "CSS", "Node.js"
    ]
    extracted_skills = [skill for skill in common_skills if re.search(r'\b' + re.escape(skill) + r'\b', text, re.I)]

    # Soft Skills detection
    common_soft_skills = ["Communication", "Leadership", "Problem Solving", "Teamwork", "Adaptability"]
    extracted_soft_skills = [skill for skill in common_soft_skills if re.search(r'\b' + re.escape(skill) + r'\b', text, re.I)]

    # Extract first line as possible Full Name fallback
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    full_name = lines[0] if lines else None

    return {
        "full_name": full_name,
        "email": email,
        "phone_number": phone_number,
        "address": None,
        "linkedin_profile": linkedin_profile,
        "github_profile": github_profile,
        "professional_summary": text[:300] if text else None,
        "technical_skills": extracted_skills,
        "soft_skills": extracted_soft_skills,
        "skills": extracted_skills + extracted_soft_skills,
        "education": [],
        "work_experience": [],
        "projects": [],
        "certifications": [],
        "internships": [],
        "languages": [],
        "achievements": []
    }

@router.post("/upload", response_model=schemas.ResumeOut, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    
    await file.seek(0)

    original_name = Path(file.filename or "").name  # Strips any directory path safely
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

    # One folder per user keeps resumes organized on disk and prevents filename collisions
    user_dir = UPLOAD_DIR / str(current_user.id)
    user_dir.mkdir(parents=True, exist_ok=True)

    # Unique identifier for local storage to prevent path traversal issues
    stored_filename = f"{uuid.uuid4().hex}{extension}"
    file_path = user_dir / stored_filename
    file_path.write_bytes(contents)

    # Parse resume with both required parameters (bytes & filename)
    parsed_info = parse_resume_hybrid(contents, original_name)

    db_resume=crud.create_resume(
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
    return crud.get_resumes_by_user(db=db, user_id=current_user.id)


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
