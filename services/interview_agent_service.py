import os
import json
import logging
from typing import Dict, Any, Optional
from groq import Groq, GroqError

# Safeguard to load .env directly if present
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

try:
    from config import settings
except ImportError:
    try:
        from config import settings
    except ImportError:
        settings = None

logger = logging.getLogger(__name__)

# Conservative safety limits to keep total request < 4,000 tokens (well under 8,000 TPM limit)
MAX_DOCUMENT_CHARS = 4000
MAX_RESUME_CHARS = 3500

GROQ_MODEL = "openai/gpt-oss-20b"


class InterviewAgentService:
    def __init__(self):
        # Gracefully retrieve API key from settings or environment variables
        api_key = None
        if settings:
            api_key = getattr(settings, "GROQ_API_KEY", None)
        if not api_key:
            api_key = os.getenv("GROQ_API_KEY")

        if not api_key:
            logger.warning("GROQ_API_KEY is not set in environment or settings.")

        self.client = Groq(api_key=api_key or "")

    def _compact_candidate_context(self, context: Dict[str, Any], prioritize_projects: bool = False) -> Dict[str, Any]:
        """
        Filters and compacts raw candidate context into essential structured fields.
        Avoids sending massive raw DB dumps.
        """
        if not context:
            return {}

        compact = {}

        # Retain professional summary and core skills
        if "summary" in context or "professional_summary" in context:
            compact["summary"] = context.get("summary") or context.get("professional_summary")

        if "technical_skills" in context:
            compact["technical_skills"] = context["technical_skills"]
        if "soft_skills" in context:
            compact["soft_skills"] = context["soft_skills"]

        # Projects, Experience, and Internships
        if "projects" in context:
            compact["projects"] = context["projects"]
        if "work_experience" in context or "experience" in context:
            compact["work_experience"] = context.get("work_experience") or context.get("experience")
        if "internships" in context:
            compact["internships"] = context["internships"]

        # Secondary fields
        if not prioritize_projects:
            if "education" in context:
                compact["education"] = context["education"]
            if "certifications" in context:
                compact["certifications"] = context["certifications"]
            if "achievements" in context:
                compact["achievements"] = context["achievements"]
            if "languages" in context:
                compact["languages"] = context["languages"]

        # Enforce safe character limits on serialized JSON
        compact_json = json.dumps(compact)
        if len(compact_json) > MAX_RESUME_CHARS:
            minimal = {
                "summary": compact.get("summary"),
                "technical_skills": compact.get("technical_skills"),
                "projects": compact.get("projects"),
                "work_experience": compact.get("work_experience")
            }
            return minimal

        return compact

    def _prepare_document_text(self, document_text: Optional[str]) -> tuple[Optional[str], bool]:
        """
        Truncates uploaded document text safely if it exceeds max character length.
        """
        if not document_text or not document_text.strip():
            return None, False

        doc_text = document_text.strip()
        if len(doc_text) > MAX_DOCUMENT_CHARS:
            truncated = doc_text[:MAX_DOCUMENT_CHARS] + "\n\n[NOTE: The uploaded document text was truncated due to context length limits.]"
            return truncated, True

        return doc_text, False

    def generate_interview_response(
        self,
        user_message: str,
        candidate_context: Optional[Dict[str, Any]] = None,
        target_role: Optional[str] = None,
        document_text: Optional[str] = None
    ) -> str:
        """
        Generates grounded interview preparation guidance using Groq while respecting token limits.
        """
        # 1. Detect prompt intent
        msg_lower = user_message.lower()
        is_project_query = any(k in msg_lower for k in ["project", "technical skills", "role", "suitable", "roadmap", "my skills"])

        # 2. Compact candidate context
        compact_resume = self._compact_candidate_context(
            candidate_context or {}, 
            prioritize_projects=is_project_query
        )

        # 3. Process and truncate document context
        doc_content, was_doc_truncated = self._prepare_document_text(document_text)

        # 4. Construct System Prompt with strict guardrails
        system_instructions = (
            "You are an expert AI Technical Interviewer and Career Coach.\n"
            "CRITICAL GUARDRAILS:\n"
            "1. STRICT TRUTH: Base all answers STRICTLY on the candidate context and uploaded document provided below.\n"
            "2. NO HALLUCINATIONS: Do NOT invent skills, projects, technologies, or achievements not explicitly stated in the context.\n"
            "3. NO INVENTED DETAILS: Do not make up specific implementation details or experience missing from the profile.\n"
            "4. CLEAR GAP IDENTIFICATION: If asked about a skill or technology missing from the context, explicitly point out that it is not in the candidate's profile, then offer general high-level guidance.\n"
        )

        # 5. Build Context Payload
        context_parts = []

        if target_role:
            context_parts.append(f"TARGET ROLE FOR PREPARATION: {target_role}")

        if compact_resume:
            context_parts.append(f"CANDIDATE RESUME/PROFILE CONTEXT:\n{json.dumps(compact_resume, indent=2)}")

        if doc_content:
            context_parts.append(f"UPLOADED DOCUMENT CONTEXT:\n{doc_content}")

        full_context = "\n\n---\n\n".join(context_parts)
        user_prompt = f"{full_context}\n\n---\n\nUSER REQUEST: {user_message}"

        # 6. Call Groq API with robust error catching
        try:
            response = self.client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[
                    {"role": "system", "content": system_instructions},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                max_tokens=1024
            )
            return response.choices[0].message.content

        except GroqError as e:
            logger.error(f"Groq API Error in InterviewAgentService: {str(e)}", exc_info=True)
            error_str = str(e).lower()
            
            if "413" in error_str or "rate_limit_exceeded" in error_str or "too large" in error_str:
                return (
                    "The request contained too much context to process at once. "
                    "Please ask a more specific question or try uploading a shorter document."
                )
            
            return "Interview Agent is currently unavailable due to a service error. Please try again shortly."
            
        except Exception as e:
            logger.error(f"Unexpected error in InterviewAgentService: {str(e)}", exc_info=True)
            return "An unexpected error occurred while generating interview responses."