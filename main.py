import uuid
from pathlib import Path
from routers import chatbot


from fastapi import Depends, FastAPI, status, HTTPException
from dotenv import load_dotenv
load_dotenv()
from database import Base, engine, get_db
from routers import applications, auth, resume, profile, match, internships, chatbot, ats, interview_agent
from routers.auth import get_current_user
from routers.resume import extract_raw_text
from services.cover_letter_service import CoverLetterGenerator
from schemas import CoverLetterGenerateRequest, CoverLetterResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
import crud
import models


Base.metadata.create_all(bind=engine)
cover_letter_service=CoverLetterGenerator()

app = FastAPI(title="Internship Assistant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Or ["*"]
    allow_credentials=True,
    allow_methods=["*"],  # Ensures OPTIONS and POST are allowed
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(resume.router)
app.include_router(profile.router)
app.include_router(applications.router)
app.include_router(match.router)
app.include_router(internships.router)
app.include_router(chatbot.router)
app.include_router(ats.router)
app.include_router(interview_agent.router)  # Include the new interview agent router

class CoverLetterRequest(BaseModel):
    resume_id: uuid.UUID
    company_name: Optional[str] = ""
    role_title: Optional[str] = ""
    skills_required: Optional[List[str]] = []
    resume_text: Optional[str] = ""

@app.get("/")
def root():
    return {"status": "ok"}

@app.post("/generate-cover-letter")
async def generate_cover_letter(
    payload: CoverLetterRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    try:
        resume = crud.get_resume_by_id(db, payload.resume_id)
        if not resume or resume.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Resume not found")

        try:
            resume_bytes = Path(resume.file_path).read_bytes()
            resume_text = extract_raw_text(
                resume_bytes, Path(resume.original_filename).suffix.lower()
            )
        except OSError:
            raise HTTPException(status_code=404, detail="Stored resume file not found")

        if not resume_text.strip():
            raise HTTPException(status_code=422, detail="The selected resume has no readable text")

        letter_text = cover_letter_service.generate_cover_letter(
            company_name=payload.company_name,
            role_title=payload.role_title,
            skills_required=payload.skills_required,
            resume_text=resume_text,
        )
        return {"cover_letter": letter_text}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Cover Letter Generation Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
