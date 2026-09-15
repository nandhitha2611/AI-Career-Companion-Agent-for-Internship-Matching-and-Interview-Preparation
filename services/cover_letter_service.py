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
        
        resume = resume_text.strip()
        if not resume:
            raise ValueError("A readable resume is required to generate a cover letter")

        prompt = f"""
You write concise, professional cover letters that are strictly grounded in the supplied resume.

--- JOB DETAILS ---
Company: {company}
Role: {role}
Key Required Skills: {skills}

--- APPLICANT RESUME TEXT ---
{resume}

--- STRICT INSTRUCTIONS ---
1. ABSOLUTE HONESTY: Use only facts explicitly written in the resume text. Do not make inferences from typical degree timelines, job titles, dates, or industry conventions.
2. DO NOT INVENT: Never add a study year, student/fresher status, graduation year, skills, projects, certifications, work experience, seniority, or achievement unless it is explicitly in the resume.
3. MATCHING: Use the required skills only to choose relevant, explicitly stated skills and 1-2 real projects or experiences from the resume. Do not claim proficiency in a required skill that is absent from the resume.
4. FORMAT: Write exactly 3 short professional paragraphs. Output only the finished letter, beginning with "Dear Hiring Manager at {company}," and ending with a standard professional sign-off.
"""

        response = self.client.chat.completions.create(
            model="openai/gpt-oss-20b",  # Use "llama-3.1-8b-instant" or "mixtral-8x7b-32768"
            messages=[
                {"role": "system", "content": "You are a factual cover letter writer. Never invent or infer applicant details."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1
        )

        return response.choices[0].message.content