from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
import database, models, schemas
from routers.auth import get_current_user
from services.interview_agent_service import InterviewAgentService
from services.document_parser import extract_text_from_file

router = APIRouter(prefix="/api/interview-agent", tags=["Interview Preparation Agent"])
interview_service = InterviewAgentService()


def get_candidate_context(db: Session, user_id: str):
    """Retrieve candidate context from the latest uploaded resume."""
    latest_resume = (
        db.query(models.Resume)
        .filter(models.Resume.user_id == user_id)
        .order_by(models.Resume.uploaded_at.desc())
        .first()
    )

    resume_found = False
    context = {}

    if latest_resume and latest_resume.parsed_data:
        context = latest_resume.parsed_data
        resume_found = True

    return context, resume_found


@router.post("/extract-document")
async def extract_document(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user)
):
    """Extract text from uploaded PDF or DOCX file."""
    if not file.filename.lower().endswith(('.pdf', '.docx')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload a PDF or DOCX document."
        )

    try:
        # 1. Read the file contents into raw bytes
        file_bytes = await file.read()

        # 2. Pass the raw bytes along with the filename to your parser
        text = extract_text_from_file(file_bytes, file.filename)
        
        return {
            "filename": file.filename,
            "extracted_text": text
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process file: {str(e)}"
        )


@router.post("/chat")
async def interview_agent_chat(
    req: schemas.InterviewAgentRequest,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Process chat interactions with candidate context and uploaded documents."""
    context, resume_found = get_candidate_context(db, str(current_user.id))

    response_text = interview_service.generate_interview_response(
        user_message=req.message,
        candidate_context=context,
        target_role=req.target_role,
        document_text=req.document_text
    )

    return {
        "response": response_text,
        "resume_found": resume_found
    }