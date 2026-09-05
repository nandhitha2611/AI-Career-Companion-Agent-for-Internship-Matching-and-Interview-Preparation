# ---------------------------------------------------------------------------
# RESUME PARSING = pull structured fields out of an uploaded resume file.
# ---------------------------------------------------------------------------

import io
import json
import re
from pathlib import Path

import fitz  # PyMuPDF
import pdfplumber
from docx import Document

from config import settings

REQUIRED_FIELDS = ["full_name", "email", "phone_number", "skills", "education"]

MAX_TEXT_CHARS_FOR_LLM = 12000
MAX_LIST_ITEMS = 10
MAX_SHORT_LIST_ITEMS = 20

EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
PHONE_RE = re.compile(
    r"(?:(?:\+|00)\d{1,3}[\s.-]?)?(?:\(\d{2,4}\)[\s.-]?)?\d{3,5}[\s.-]?\d{3,4}[\s.-]?\d{0,4}"
)
DEGREE_RE = re.compile(
    r"(?:B\.?\s?Tech|M\.?\s?Tech|B\.?\s?E\.?|M\.?\s?E\.?|B\.?\s?Sc|M\.?\s?Sc|BCA|MCA|MBA|BBA|"
    r"Bachelor(?:'?s)?(?:\s+of\s+\w+)?|Master(?:'?s)?(?:\s+of\s+\w+)?|Ph\.?D|Diploma)"
    r"[^\n,;]{0,100}",
    re.IGNORECASE,
)
NAME_LINE_RE = re.compile(r"^[A-Z][a-zA-Z.'-]+(?:\s+[A-Z][a-zA-Z.'-]+){0,3}$")

KNOWN_SKILLS = [
    "Python", "Java", "JavaScript", "TypeScript", "C++", "C#", "C", "Go", "Rust",
    "PHP", "Ruby", "Kotlin", "Swift", "R", "MATLAB", "Scala",
    "HTML", "CSS", "SQL", "NoSQL", "React", "React Native", "Angular", "Vue",
    "Node.js", "Express", "Django", "Flask", "FastAPI", "Spring", "Spring Boot",
    ".NET", "ASP.NET", "jQuery", "Bootstrap", "Tailwind CSS",
    "MySQL", "PostgreSQL", "MongoDB", "SQLite", "Redis", "Oracle", "Firebase",
    "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Jenkins", "Terraform",
    "Git", "GitHub", "GitLab", "CI/CD", "Linux",
    "Machine Learning", "Deep Learning", "NLP", "Computer Vision",
    "TensorFlow", "PyTorch", "Keras", "Scikit-learn", "Pandas", "NumPy",
    "Data Analysis", "Data Structures", "Algorithms", "REST API", "GraphQL",
    "Agile", "Scrum", "JIRA", "Excel", "Power BI", "Tableau",
    "Communication", "Leadership", "Teamwork", "Problem Solving",
]


class ResumeParseError(Exception):
    """Raised when the file's text can't be extracted at all."""


def extract_text(file_path: Path, extension: str) -> str:
    """Pulls text and embedded hyperlinked URLs out of PDF/DOCX files, searching deep PDF object streams."""
    try:
        if extension == ".pdf":
            extracted_text = ""
            extracted_urls = set()
            
            with fitz.open(file_path) as doc:
                for page in doc:
                    extracted_text += page.get_text() + "\n"
                    
                    # 1. Page-level standard link annotations
                    for link in page.get_links():
                        uri = link.get("uri")
                        if uri:
                            extracted_urls.add(uri)
                            
                    # 2. Interactive Form Field Widgets / Links
                    for annot in page.annots():
                        info = annot.info
                        if "uri" in info and info["uri"]:
                            extracted_urls.add(info["uri"])

                # 3. Deep Object Stream Scanning for hidden / structural URIs
                for i in range(1, doc.xref_length()):
                    try:
                        xref_str = doc.xref_object(i)
                        # Extract any HTTP/HTTPS URLs embedded in PDF dictionary objects
                        found_uris = re.findall(r'https?://[^\s<>"{}|\\^`()]+', xref_str)
                        for uri in found_uris:
                            # Filter out standard XML schema definitions
                            if "w3.org" not in uri and "adobe.com" not in uri:
                                extracted_urls.add(uri.rstrip('/>]'))
                    except Exception:
                        continue

            if extracted_urls:
                extracted_text += "\n\nEmbedded Document Hyperlinks:\n" + "\n".join(extracted_urls)

            return extracted_text

        if extension == ".docx":
            document = Document(file_path)
            return "\n".join(p.text for p in document.paragraphs)
    except Exception as exc:
        raise ResumeParseError(f"Could not read text from {extension} file") from exc

    raise ResumeParseError(f"Text extraction not supported for {extension}")
def _extract_email(text: str) -> str | None:
    match = EMAIL_RE.search(text)
    return match.group(0) if match else None


def _extract_phone(text: str) -> str | None:
    for candidate in PHONE_RE.findall(text):
        digits = re.sub(r"\D", "", candidate)
        if 10 <= len(digits) <= 13:
            return candidate.strip()
    return None


def _extract_skills(text: str) -> list[str]:
    found = []
    for skill in KNOWN_SKILLS:
        # Bypassing single-letter skills (C, R) in Regex pass to avoid false positives.
        # Groq LLM pass will handle C/R extraction cleanly from actual context.
        if len(skill) <= 1:
            continue

        pattern = r"(?<![\w.+#-])" + re.escape(skill) + r"(?![\w.+#-])"
        if re.search(pattern, text, re.IGNORECASE):
            found.append(skill)
    return found

def _extract_education(text: str) -> str | None:
    match = DEGREE_RE.search(text)
    return match.group(0).strip(" -:") if match else None


def _extract_name(text: str) -> str | None:
    for line in text.splitlines()[:5]:
        line = line.strip()
        if line and NAME_LINE_RE.match(line):
            return line
    return None


def _merge_skills(regex_skills: list[str], llm_skills: list[str]) -> list[str]:
    merged: dict[str, str] = {}
    for skill in regex_skills:
        merged[skill.lower()] = skill
    for skill in llm_skills:
        key = skill.strip().lower()
        if key and key not in merged:
            merged[key] = skill.strip()
    return list(merged.values())


def _clean_str(value: object) -> str | None:
    if isinstance(value, str) and value.strip():
        return value.strip()
    return None


def _clean_str_list(value: object, max_items: int) -> list[str]:
    if not isinstance(value, list):
        return []
    cleaned = []
    for item in value:
        if isinstance(item, str) and item.strip():
            cleaned.append(item.strip())
        if len(cleaned) >= max_items:
            break
    return cleaned


def _clean_object_list(value: object, keys: list[str], max_items: int) -> list[dict]:
    if not isinstance(value, list):
        return []
    cleaned = []
    for item in value:
        if not isinstance(item, dict):
            continue
        cleaned.append({key: _clean_str(item.get(key)) for key in keys})
        if len(cleaned) >= max_items:
            break
    return cleaned


def _format_url(val: object, domain: str) -> str | None:
    """Formats raw usernames into full valid URLs."""
    if not val or not isinstance(val, str):
        return None
    val = val.strip()
    if val.startswith("http://") or val.startswith("https://"):
        return val
    if domain in val:
        return f"https://{val}"
    return f"https://{domain}/{val.lstrip('@')}"


def regex_extract(text: str) -> dict:
    return {
        "full_name": _extract_name(text),
        "email": _extract_email(text),
        "phone_number": _extract_phone(text),
        "skills": _extract_skills(text),
        "education": _extract_education(text),
    }


def llm_extract_full(text: str) -> dict:
    if not settings.groq_api_key:
        return {}

    data = {}
    try:
        from groq import Groq

        client = Groq(api_key=settings.groq_api_key)
        
        prompt = f"""
Extract details from this resume text into a strict JSON object.

Resume Text:
{text[:MAX_TEXT_CHARS_FOR_LLM]}

CRITICAL EXTRACTION RULES:
1. "address": Extract ANY location string near the header (even single words like "Chennai", "Bangalore", or "California").
2. "internships": Put ANY role, experience, or project explicitly described as an "intern", "internship", or "trainee" HERE.
3. "work_experience": Put ONLY full-time, part-time, or contract employment here (EXCLUDE internships).
4. "linkedin_profile": Extract full URLs OR raw usernames/handles. Check the 'Embedded Document Hyperlinks' section if present.
5. "github_profile": Extract full URLs OR raw usernames/handles. Check the 'Embedded Document Hyperlinks' section if present.

Respond ONLY with valid JSON using this EXACT structure:
{{
    "full_name": "string or null",
    "email": "string or null",
    "phone_number": "string or null",
    "address": "City, Location or null",
    "linkedin_profile": "URL or handle or null",
    "github_profile": "URL or handle or null",
    "portfolio_url": "URL or null",
    "technical_skills": ["array", "of", "skills"],
    "soft_skills": ["array", "of", "soft skills"],
    "education": [
        {{
            "institution": "School/University",
            "degree": "Degree",
            "year": "Year/Dates"
        }}
    ],
    "internships": [
        {{
            "title": "Internship Title",
            "company": "Company Name",
            "duration": "Dates/Duration",
            "description": "Responsibilities"
        }}
    ],
    "work_experience": [
        {{
            "title": "Job Title",
            "company": "Company Name",
            "duration": "Dates/Duration",
            "description": "Responsibilities"
        }}
    ],
    "projects": [
        {{
            "name": "Project Name",
            "description": "Description",
            "tech_stack": "Tech stack"
        }}
    ],
    "achievements": ["array of strings"],
    "certifications": ["array of strings"],
    "languages": ["array of strings"],
    "professional_summary": "string or null"
}}
"""

        completion = client.chat.completions.create(
            model=settings.groq_model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            max_tokens=3000,
            response_format={"type": "json_object"},
        )
        data = json.loads(completion.choices[0].message.content)
    except Exception as e:
        print(f"GROQ PARSER ERROR: {e}")
        return {}

    # Backup regex link matching if LLM misses embedded links
    # Robust URL fallback regex
    if not data.get("linkedin_profile"):
        li_match = re.search(r'https?://(?:www\.)?linkedin\.com/in/[a-zA-Z0-9%_\-]+/?', text, re.I)
        if li_match:
            data["linkedin_profile"] = li_match.group(0)

    if not data.get("github_profile"):
        gh_match = re.search(r'https?://(?:www\.)?github\.com/[a-zA-Z0-9%_\-]+/?', text, re.I)
        if gh_match:
            data["github_profile"] = gh_match.group(0)

    # Programmatic separation of Internships and Work Experience
    raw_exp = data.get("work_experience") or []
    raw_internships = data.get("internships") or []

    final_experience = []
    final_internships = list(raw_internships) if isinstance(raw_internships, list) else []

    if isinstance(raw_exp, list):
        for item in raw_exp:
            if isinstance(item, dict):
                title = (item.get("title") or "").lower()
                desc = (item.get("description") or "").lower()
                if "intern" in title or "intern" in desc or "trainee" in title:
                    final_internships.append(item)
                else:
                    final_experience.append(item)
            else:
                final_experience.append(item)

    extracted_skills = data.get("technical_skills") or data.get("skills") or []

    return {
        "full_name": _clean_str(data.get("full_name")),
        "email": _clean_str(data.get("email")),
        "phone_number": _clean_str(data.get("phone_number")),
        "address": _clean_str(data.get("address") or data.get("location")),
        "linkedin_url": _format_url(data.get("linkedin_profile") or data.get("linkedin_url"), "linkedin.com/in"),
        "github_url": _format_url(data.get("github_profile") or data.get("github_url"), "github.com"),
        "portfolio_url": _clean_str(data.get("portfolio_url")),
        "professional_summary": _clean_str(data.get("professional_summary")),
        "technical_skills": _clean_str_list(extracted_skills, max_items=60),
        "soft_skills": _clean_str_list(data.get("soft_skills"), MAX_SHORT_LIST_ITEMS),
        "education": _clean_object_list(data.get("education"), ["institution", "degree", "year"], MAX_LIST_ITEMS),
        "internships": _clean_object_list(final_internships, ["title", "company", "duration", "description"], MAX_LIST_ITEMS),
        "experience": _clean_object_list(final_experience, ["title", "company", "duration", "description"], MAX_LIST_ITEMS),
        "projects": _clean_object_list(data.get("projects"), ["name", "description", "tech_stack"], MAX_LIST_ITEMS),
        "certifications": _clean_str_list(data.get("certifications"), MAX_SHORT_LIST_ITEMS),
        "languages": _clean_str_list(data.get("languages"), MAX_SHORT_LIST_ITEMS),
        "achievements": _clean_str_list(data.get("achievements"), MAX_SHORT_LIST_ITEMS),
    }


def _empty_result() -> dict:
    result = {field: None for field in REQUIRED_FIELDS}
    result.update(
        {
            "address": None,
            "location": None,
            "linkedin_profile": None,
            "github_profile": None,
            "linkedin_url": None,
            "github_url": None,
            "portfolio_url": None,
            "professional_summary": None,
            "work_experience": [],
            "experience": [],
            "internships": [],
            "projects": [],
            "certifications": [],
            "languages": [],
            "achievements": [],
            "extracted_text": None,
            "parse_status": "failed",
            "parsed_with": None,
        }
    )
    return result


def parse_resume_text(text: str) -> dict:
    result = _empty_result()

    if not text.strip():
        result["extracted_text"] = text
        return result

    result["extracted_text"] = text

    regex_data = regex_extract(text)
    llm_data = llm_extract_full(text)

    llm_tech = llm_data.get("technical_skills") or []
    llm_soft=llm_data.get("soft_skills") or []
    regex_skills = regex_data.get("skills") or []

    if isinstance(regex_skills, str):
        regex_skills = [s.strip() for s in regex_skills.split(",") if s.strip()]

    merged_skills = _merge_skills(regex_skills, llm_tech)
    merged_all_skills=_merge_skills(merged_skills,llm_soft)

    result["email"] = regex_data.get("email") or llm_data.get("email")
    result["phone_number"] = regex_data.get("phone_number") or llm_data.get("phone_number")
    result["full_name"] = llm_data.get("full_name") or regex_data.get("full_name")
    
    result["education"] = llm_data.get("education") or regex_data.get("education") or []
    result["technical_skills"] = merged_skills
    result["soft_skills"] = llm_soft
    result["skills"] = merged_all_skills

    result["address"] = llm_data.get("address")
    result["location"] = llm_data.get("address")
    result["linkedin_profile"] = llm_data.get("linkedin_url")
    result["github_profile"] = llm_data.get("github_url")
    result["linkedin_url"] = llm_data.get("linkedin_url")
    result["github_url"] = llm_data.get("github_url")
    result["portfolio_url"] = llm_data.get("portfolio_url")
    
    result["professional_summary"] = llm_data.get("professional_summary")
    result["work_experience"] = llm_data.get("experience", [])
    result["experience"] = llm_data.get("experience", [])
    result["internships"] = llm_data.get("internships", [])
    result["projects"] = llm_data.get("projects", [])
    result["certifications"] = llm_data.get("certifications", [])
    result["languages"] = llm_data.get("languages", [])
    result["achievements"] = llm_data.get("achievements", [])

    result["parsed_with"] = "regex+llm" if llm_data else "regex"

    still_missing = [f for f in REQUIRED_FIELDS if not result.get(f)]
    if not still_missing:
        result["parse_status"] = "success"
    elif len(still_missing) < len(REQUIRED_FIELDS):
        result["parse_status"] = "partial"
    else:
        result["parse_status"] = "failed"

    return result


def parse_resume_file(file_path: Path, extension: str) -> dict:
    try:
        text = extract_text(file_path, extension)
    except ResumeParseError:
        return _empty_result()

    return parse_resume_text(text)