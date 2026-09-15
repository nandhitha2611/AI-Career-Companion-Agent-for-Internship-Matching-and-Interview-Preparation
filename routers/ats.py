# routers/ats.py
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

import crud
from database import get_db
from models import User
from routers.auth import get_current_user
from schemas_ats import AtsGeneralCheckRequest, AtsGeneralCheckResponse
from services.ats_service import AtsService

router = APIRouter(prefix="/api/ats", tags=["ATS Match Analyzer"])

@router.post("/analyze", response_model=AtsGeneralCheckResponse)
async def analyze_general_ats_score(
    request: AtsGeneralCheckRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    ats_service: AtsService = Depends(),
):
    """
    General ATS resume health and compliance analyzer.
    """
    resume = crud.get_resume_by_id(db=db, resume_id=request.resume_id)
    if not resume or resume.user_id != current_user.id:
        raise HTTPException(status_code=404, detail=f"Resume '{request.resume_id}' not found")

    resume_data = dict(resume.parsed_data or {})
    resume_data["resume_id"] = str(resume.id)
    resume_data["name"] = resume_data.get("full_name")
    resume_data["phone"] = resume_data.get("phone_number")
    resume_data["experience"] = resume_data.get("experience") or resume_data.get("work_experience") or []
    resume_data["projects"] = resume_data.get("projects") or []
    resume_data["skills"] = resume_data.get("skills") or []
    resume_data["education"] = resume_data.get("education") or []

    return ats_service.evaluate_general_resume_ats(resume_data)

