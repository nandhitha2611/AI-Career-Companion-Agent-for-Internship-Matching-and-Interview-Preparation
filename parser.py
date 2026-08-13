import os
import io
import json
import re
from typing import Dict, Any
import docx
from pypdf import PdfReader
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

def get_groq_client()->Groq:
    api_key=os.getenv("GROQ_API_KEY")
    if not api_key:
        print("DEBUG ERROR: GROQ_API_KEY is not set in your .env file!")
        raise ValueError("GROQ_API_KEY is missing from enviroment variables.")
    return Groq(api_key=api_key)

# 1. Text Extraction (PDF + DOCX)
def extract_raw_text(file_bytes: bytes, filename: str) -> str:
    """Extracts raw plain text from PDF or DOCX files."""
    if not file_bytes:
        return ""
        
    fn = filename.lower()
    text = ""
    try:
        if fn.endswith(".docx"):
            doc = docx.Document(io.BytesIO(file_bytes))
            for para in doc.paragraphs:
                if para.text:
                    text += para.text + "\n"
        elif fn.endswith(".pdf"):
            reader = PdfReader(io.BytesIO(file_bytes))
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
    except Exception as e:
        print(f"Text extraction failed: {e}")
        
    return text.strip()

# 2. Fast Regex Extractor (Deterministic Layer)
def parse_regex(raw_text: str) -> Dict[str, Any]:
    """Uses pattern matching for exact structured fields."""
    email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    email_match = re.search(email_pattern, raw_text)
    
    phone_pattern = r'(\+\d{1,3}[-.\s]?)?\d{3,5}[-.\s]?\d{3,5}[-.\s]?\d{3,4}'
    phone_match = re.search(phone_pattern, raw_text)
    
    return {
        "email": email_match.group(0) if email_match else None,
        "phone_number": phone_match.group(0).strip() if phone_match else None
    }

# 3. Groq LLM Extractor (Generative Layer)
def parse_with_groq(raw_text: str) -> Dict[str, Any]:
    if not raw_text:
        return {}

    system_prompt = """
    You are a resume parsing assistant. Extract candidate information from the provided resume text into a valid JSON object matching this exact schema:
    {
        "full_name": string or null,
        "email": string or null
        "phone_number": string or null,
        "address": string or null,
        "linkedin_profile": string or null,
        "github_profile": string or null,
        "soft_skills": list of strings,
        "summary": string or null,
        "technical_skills": list of strings,
        "work_experience": [{"company": string, "role": string, "duration": string, "description": string}],
        "education": [{"degree": string, "institution": string, "year": string}],
        "certifications": list of strings,
        "languages": list of strings
    }
    Rules:
    1. Extract the phone number as written in the resume
    2. Extract the contact and profile links if present
    3. Return ONLY valid JSON with no markdown formatting, backticks(```),or extra commentary.
    """

    try:
        client = get_groq_client()
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Resume Text:\n{raw_text}"}
            ],
            temperature=0.1,
            response_format={"type": "json_object"}
        )
        
        response_content = completion.choices[0].message.content
        print(f"DEBUG Groq raw output: {response_content}")
        return json.loads(response_content)
    except Exception as e:
        print(f"DEBUG Groq execution failed: {e}")
        return {"error": str(e)}

# 4. Master Hybrid Pipeline
def parse_resume_hybrid(contents: bytes, original_name: str) -> Dict[str, Any]:
    raw_text = extract_raw_text(contents, original_name)
    
    regex_data = parse_regex(raw_text)
    groq_data = parse_with_groq(raw_text)  # Call to your Groq LLaMA parser
    
    # Map Groq's key names to match your response schema
    candidate_name = groq_data.get("candidate_name") or groq_data.get("full_name")
    summary = groq_data.get("summary") or groq_data.get("professional_summary")
    phone = (
        regex_data.get("phone_number")
        or regex_data.get("phone")
        or groq_data.get("phone_number")
        or groq_data.get("phone")
    )
    email = regex_data.get("email") or groq_data.get("email")

    return {
        "full_name": candidate_name,
        "email": email,
        "phone_number": phone,
        "address": groq_data.get("address"),
        "linkedin_profile": groq_data.get("linkedin_profile"),
        "github_profile": groq_data.get("github_profile"),
        "professional_summary": summary,
        "technical_skills": groq_data.get("technical_skills", []),
        "soft_skills": groq_data.get("soft_skills", []),
        "skills": groq_data.get("skills", []),
        "education": groq_data.get("education", []),
        "work_experience": groq_data.get("work_experience", []),
        "projects": groq_data.get("projects", []),
        "certifications": groq_data.get("certifications", []),
        "internships": groq_data.get("internships", []),
        "languages": groq_data.get("languages", []),
        "achievements": groq_data.get("achievements", []),
        "parsing_metadata": {
            "method": "Hybrid (Regex + Groq LLaMA 3.3)",
            "text_length": len(raw_text)
        }
    }