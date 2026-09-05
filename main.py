from fastapi import FastAPI, status, HTTPException
from dotenv import load_dotenv
load_dotenv()
from database import Base, engine
from routers import auth, resume, profile, match, internships
from services.cover_letter_service import CoverLetterGenerator
from schemas import CoverLetterGenerateRequest, CoverLetterResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional


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
app.include_router(match.router)
app.include_router(internships.router)

class CoverLetterRequest(BaseModel):
    resume_id: Optional[str] = None
    company_name: Optional[str] = ""
    role_title: Optional[str] = ""
    skills_required: Optional[List[str]] = []
    resume_text: Optional[str] = ""

@app.get("/")
def root():
    return {"status": "ok"}

@app.post("/generate-cover-letter")  # or whatever your endpoint URL path is
async def generate_cover_letter(payload: CoverLetterRequest):
    try:
        # Pass payload properties into the service method
        letter_text = cover_letter_service.generate_cover_letter(
            company_name=payload.company_name,
            role_title=payload.role_title,
            skills_required=payload.skills_required,
            resume_text=payload.resume_text
        )
        return {"cover_letter": letter_text}
        
    except Exception as e:
        print(f"Cover Letter Generation Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))