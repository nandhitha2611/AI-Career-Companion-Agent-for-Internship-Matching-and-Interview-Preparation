import os
from groq import Groq

class CoverLetterGenerator:
    def __init__(self):
        # Uses your existing GROQ_API_KEY environment variable
        self.client = Groq(api_key=os.getenv("GROQ_API_KEY"))

    def generate_cover_letter(self, company_name: str, role_title: str, skills_required: list, resume_text: str) -> str:
        company = company_name if company_name else "the Target Company"
        role = role_title if role_title else "Software Engineering Intern"
        skills = ", ".join(skills_required) if skills_required else "General Technical Skills"
        
        # Fallback text if frontend sends empty resume text
        resume = resume_text.strip() if (resume_text and resume_text.strip()) else "3rd year Computer Science Engineering student skilled in full-stack development, cloud engineering, Python, React, and databases."

        prompt = f"""
You are an expert career consultant. Write a highly tailored, professional, and compelling cover letter for an applicant applying for a specific role.

--- JOB DETAILS ---
Company: {company}
Role: {role}
Key Required Skills: {skills}

--- APPLICANT RESUME TEXT ---
{resume}

--- STRICT INSTRUCTIONS ---
1. ABSOLUTE HONESTY: ONLY use facts, projects, skills, and educational details explicitly stated in the APPLICANT RESUME DATA above. 
2. ZERO HALLUCINATIONS: DO NOT invent degree levels, graduation years, student status, capstones, certifications, or work experience that are not literally written in the resume text. If a detail is missing from the resume, leave it out completely.
3. MATCHING: Pick 1 or 2 real projects or experience points directly from the resume that best align with {skills}.
4. FORMAT: Write exactly 3 short, professional paragraphs. Output ONLY the finished letter text starting directly with "Dear Hiring Manager at {company}," and ending with a standard professional sign-off.
"""

        response = self.client.chat.completions.create(
            model="openai/gpt-oss-120b",  # Or whichever model name you use in your extraction service
            messages=[
                {"role": "system", "content": "You are a professional cover letter writer."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )

        return response.choices[0].message.content