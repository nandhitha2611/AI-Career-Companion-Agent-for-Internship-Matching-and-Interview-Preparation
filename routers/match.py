from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
import database, models
from services.internship_matcher import match_resume_to_internships
import numpy as np

router = APIRouter(prefix="/internships", tags=["Internship Matching"])

@router.post("/match/{resume_id}")
def match_resume(
    resume_id: str, 
    k: int = Query(default=5, ge=1, le=20), 
    db: Session = Depends(database.get_db)
):
    # 1. Fetch the Resume object from the database
    resume_obj = db.query(models.Resume).filter(models.Resume.id == resume_id).first()
    
    if not resume_obj:
        raise HTTPException(status_code=404, detail="Resume not found")

    # 2. Pass the Resume object directly into the mentor's function
    results = match_resume_to_internships(resume=resume_obj, k=k)

    return jsonable_encoder(results, custom_encoder={
        np.float32: lambda v: float(v),
        np.float64: lambda v: float(v)
    })