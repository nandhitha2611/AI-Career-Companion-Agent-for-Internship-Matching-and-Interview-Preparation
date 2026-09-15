# schemas_ats.py
from pydantic import BaseModel
from typing import List, Optional

# --- Request Schemas ---
class AtsGeneralCheckRequest(BaseModel):
    resume_id: str

class AtsAnalysisByIdRequest(BaseModel):
    resume_id: str
    internship_id: str


# --- General ATS Health Check Response Schemas ---
class AtsScoreCategory(BaseModel):
    name: str
    score: int
    max: int
    weight_label: str
    feedback: str

class AtsGeneralCheckResponse(BaseModel):
    resume_id: str
    overall_ats_score: int
    ats_readability_label: str
    detected_skills_count: int
    categories: List[AtsScoreCategory]
    strengths: List[str]
    improvements: List[str]


# --- Internship/Job Specific Match Response Schemas ---
class ScoreCategory(BaseModel):
    name: str
    score: int
    max: int
    weight_label: str

class AtsAnalysisResponse(BaseModel):
    resume_id: str
    internship_id: str
    overall_match_score: int
    overall_fit_label: str
    categories: List[ScoreCategory]
    matched_skills: List[str]
    missing_skills: List[str]
    recommendations: List[str]