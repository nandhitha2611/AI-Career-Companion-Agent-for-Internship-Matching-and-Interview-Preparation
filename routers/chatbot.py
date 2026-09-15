# routers/chatbot.py

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import ChatConversation, StudentProfile, Resume
from schemas import ChatRequest, ChatResponse
from services.chatbot_service import ChatbotService


router = APIRouter(
    prefix="/api/chat",
    tags=["Chatbot"]
)


_chatbot_service = None


def get_chatbot_service():

    global _chatbot_service

    if _chatbot_service is None:
        _chatbot_service = ChatbotService(
            "PRODUCT_DOCS.md"
        )

    return _chatbot_service


# ============================================================
# Convert candidate data into a readable context
# ============================================================

def build_candidate_context(
    profile: StudentProfile | None,
    resume: Resume | None
):

    sections = []

    # --------------------------------------------------------
    # Latest resume
    # --------------------------------------------------------

    if resume:

        parsed_data = resume.parsed_data

        if isinstance(parsed_data, dict):

            sections.append(
                "LATEST UPLOADED RESUME\n"
                + str(parsed_data)
            )

        else:

            sections.append(
                "LATEST UPLOADED RESUME\n"
                "No parsed resume data is available."
            )

    # --------------------------------------------------------
    # Saved profile
    # --------------------------------------------------------

    if profile:

        profile_data = {
            "full_name": profile.full_name,
            "email": profile.email,
            "phone": profile.phone,
            "address": profile.address,
            "linkedin": profile.linkedin,
            "github": profile.github,
            "summary": profile.summary,
            "technical_skills": profile.technical_skills,
            "soft_skills": profile.soft_skills,
            "education": profile.education,
            "work_experience": profile.work_experience,
            "projects": profile.projects,
            "internships": profile.internships,
            "certifications": profile.certifications,
            "languages": profile.languages,
            "achievements": profile.achievements,
        }

        sections.append(
            "SAVED CANDIDATE PROFILE\n"
            + str(profile_data)
        )

    # --------------------------------------------------------
    # Nothing available
    # --------------------------------------------------------

    if not sections:

        return (
            "No resume or candidate profile has been "
            "uploaded or saved yet."
        )

    return "\n\n".join(sections)


# ============================================================
# Chat endpoint
# ============================================================

@router.post(
    "",
    response_model=ChatResponse
)
def handle_chat(
    req: ChatRequest,
    db: Session = Depends(get_db),
    chatbot_service: ChatbotService = Depends(
        get_chatbot_service
    )
):

    # --------------------------------------------------------
    # Validate user ID
    # --------------------------------------------------------

    try:
        user_uuid = uuid.UUID(str(req.user_id))
    except (ValueError, TypeError,AttributeError):
        user_uuid = None

    # --------------------------------------------------------
    # Chat history
    # --------------------------------------------------------

    history = (
        db.query(ChatConversation)
        .filter(
            ChatConversation.user_id == str(user_uuid),
            ChatConversation.session_id == req.session_id
        )
        .order_by(
            ChatConversation.id.asc()
        )
        .all()
    )

    # --------------------------------------------------------
    # Get latest uploaded resume
    # --------------------------------------------------------

    latest_resume = (
        db.query(Resume)
        .filter(
            Resume.user_id == user_uuid
        )
        .order_by(
            Resume.uploaded_at.desc()
        )
        .first()
    )

    # --------------------------------------------------------
    # Get saved candidate profile
    # --------------------------------------------------------

    profile = (
        db.query(StudentProfile)
        .filter(
            StudentProfile.user_id == user_uuid
        )
        .first()
    )

    # --------------------------------------------------------
    # Build personalized candidate context
    # --------------------------------------------------------

    candidate_context = build_candidate_context(
        profile=profile,
        resume=latest_resume
    )

    resume_name = (
        latest_resume.original_filename
        if latest_resume
        else "No resume uploaded"
    )

    # --------------------------------------------------------
    # Generate response
    # --------------------------------------------------------

    answer, sources = chatbot_service.generate_response(
        query=req.message,
        history_records=history,
        candidate_context=candidate_context,
        resume_name=resume_name
    )

    # --------------------------------------------------------
    # Save conversation
    # --------------------------------------------------------

    record = ChatConversation(
        user_id=str(user_uuid),
        session_id=req.session_id,
        user_query=req.message,
        assistant_response=answer
    )

    db.add(record)
    db.commit()

    # --------------------------------------------------------
    # Return response
    # --------------------------------------------------------

    return {
        "user_id": str(user_uuid),
        "session_id": req.session_id,
        "response": answer,
        "sources": sources
    }