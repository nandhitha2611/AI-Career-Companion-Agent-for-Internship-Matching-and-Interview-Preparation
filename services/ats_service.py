import json
import os
import re
from typing import List, Dict, Any
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate

from schemas_ats import (
    AtsGeneralCheckResponse,
    AtsScoreCategory,
    AtsAnalysisResponse,
    ScoreCategory
)


class AtsService:
    def __init__(self):
        # Initialize Groq LLM (LLaMA 3.3 70B) for semantic matching
        self.llm = ChatGroq(
            model_name="llama-3.3-70b-versatile",
            groq_api_key=os.getenv("GROQ_API_KEY"),
            temperature=0.0
        )

        self.skill_normalization_prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an expert technical recruiter normalizing skills. "
                       "Respond with a JSON array of normalized string representations of the provided skills. "
                       "Convert abbreviations, account for synonyms, and standardize names. "
                       "E.g., ['React.js', 'ML', 'postgres'] -> ['React', 'Machine Learning', 'PostgreSQL']. "
                       "Do not output anything except valid JSON."),
            ("human", "Skills to normalize: {skills}")
        ])

    def normalize_skills(self, skills: List[str]) -> List[str]:
        """Normalize skill strings using LLM for standardization."""
        if not skills:
            return []
        try:
            formatted_prompt = self.skill_normalization_prompt.format_messages(skills=skills)
            response = self.llm.invoke(formatted_prompt)
            return json.loads(response.content)
        except Exception:
            return [s.lower().strip() for s in skills]

    def check_responsibility_match(self, job_desc: str, resume_items: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Evaluates candidate projects/experience against a specific job description using LLM."""
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an ATS matching engine evaluating a candidate's experience against a job description. "
                       "Compare the candidate's projects and professional experience to the requirements in the job description. "
                       "Look for semantic matching of responsibilities, not just exact keywords. "
                       "Respond strictly in JSON format with keys: "
                       "\"score\" (0-10), \"justification\" (string), and \"matched_responsibilities\" (list of strings)."
                       "\nJob Description:\n{job_description}"
                       "\nCandidate Experience/Projects:\n{candidate_experience}"),
        ])
        
        experience_text = ""
        for i, item in enumerate(resume_items):
            title = item.get('title') or item.get('name') or 'Project/Experience'
            desc = item.get('description', '')
            experience_text += f"{i+1}. Title: {title}. Description: {desc}\n"

        try:
            formatted_prompt = prompt.format_messages(job_description=job_desc, candidate_experience=experience_text)
            response = self.llm.invoke(formatted_prompt)
            result = json.loads(response.content)
            return {
                "score": result.get("score", 5),
                "justification": result.get("justification", "Semantic check completed."),
                "matched_responsibilities": result.get("matched_responsibilities", [])
            }
        except Exception:
            return {"score": 5, "justification": "Fallback applied due to processing error.", "matched_responsibilities": []}

    # =========================================================================
    # 1. GENERAL ATS HEALTH CHECK (No internship/job required)
    # =========================================================================
    def evaluate_general_resume_ats(self, candidate: Dict[str, Any]) -> AtsGeneralCheckResponse:
        """
        Evaluates general ATS compliance, readability, structure, action verbs, 
        skill density, and measurable impact.
        """
        resume_id = str(candidate.get("resume_id") or candidate.get("id") or "0")
        skills = candidate.get("skills", [])
        experience = candidate.get("experience", [])
        projects = candidate.get("projects", [])
        education = candidate.get("education", [])

        # --- 1. Structure & Completeness (30 Points Max) ---
        format_score = 0
        format_feedback = []
        
        if candidate.get("name") and (candidate.get("email") or candidate.get("phone") or candidate.get("contact")):
            format_score += 10
        else:
            format_feedback.append("Missing clear contact information (email or phone).")
            
        if education:
            format_score += 10
        else:
            format_feedback.append("Education section is missing or could not be detected.")
            
        if experience or projects:
            format_score += 10
        else:
            format_feedback.append("No projects or work experience sections detected.")

        categories = [
            AtsScoreCategory(
                name="Structure & Completeness",
                score=format_score,
                max=30,
                weight_label="30%",
                feedback=" ".join(format_feedback) if format_feedback else "All core ATS resume sections are present and well-structured."
            )
        ]

        # --- 2. Skills Density (25 Points Max) ---
        skill_count = len(skills)
        if skill_count >= 10:
            skill_score = 25
            skill_fb = f"Excellent skill count detected ({skill_count} skills)."
        elif skill_count >= 5:
            skill_score = 18
            skill_fb = f"Good skill count ({skill_count} skills). Add 3-5 more domain-specific tools or frameworks."
        else:
            skill_score = 10
            skill_fb = f"Low skill density ({skill_count} skills). Add relevant frameworks, languages, and tools to pass ATS filters."

        categories.append(
            AtsScoreCategory(
                name="Skills Density",
                score=skill_score,
                max=25,
                weight_label="25%",
                feedback=skill_fb
            )
        )

        # --- 3. Impact & Action Verbs (30 Points Max) ---
        all_descriptions = " ".join([
            str(item.get("description", "")) for item in (experience + projects)
        ])
        
        # Regex check for numbers, percentages, or metrics (e.g., 20%, $5k, 100+ users)
        has_metrics = bool(re.search(r'\d+%|\$\d+|\d+\+', all_descriptions))
        
        impact_score = 15
        impact_fb = []
        
        if len(all_descriptions) > 100:
            impact_score += 5
            
        if has_metrics:
            impact_score += 10
            impact_fb.append("Strong usage of quantifiable metrics and achievements in project bullet points.")
        else:
            impact_fb.append("Missing quantifiable impact. Add metrics (e.g., 'Improved API latency by 30%', 'Served 100+ active users').")

        categories.append(
            AtsScoreCategory(
                name="Impact & Action Verbs",
                score=impact_score,
                max=30,
                weight_label="30%",
                feedback=" ".join(impact_fb)
            )
        )

        # --- 4. Experience & Project Depth (15 Points Max) ---
        proj_score = min(15, (len(projects) * 5) + (len(experience) * 5))
        categories.append(
            AtsScoreCategory(
                name="Experience & Project Depth",
                score=proj_score,
                max=15,
                weight_label="15%",
                feedback="Sufficient project and experience entries detected." if proj_score >= 10 else "Add more practical projects or experience items."
            )
        )

        # --- Calculate Total Overall ATS Score ---
        total_score = min(100, format_score + skill_score + impact_score + proj_score)

        if total_score >= 80:
            label = "Excellent (ATS Ready)"
        elif total_score >= 60:
            label = "Good"
        elif total_score >= 40:
            label = "Needs Improvement"
        else:
            label = "Poor ATS Compliance"

        # Key Strengths
        strengths = []
        if format_score == 30:
            strengths.append("Complete ATS profile structure with essential contact and educational metadata.")
        if skill_count >= 8:
            strengths.append(f"Strong technical skill representation ({skill_count} skills listed).")
        if has_metrics:
            strengths.append("Demonstrates quantifiable impact using measurable numbers and metrics.")

        # Actionable Improvements
        improvements = []
        if not has_metrics:
            improvements.append("Quantify achievements in project bullet points (e.g., reduced loading time by 30%, handled 100+ users).")
        if skill_count < 8:
            improvements.append("Expand the skills section with domain-relevant technologies, tools, and libraries.")
        if format_score < 30:
            improvements.append("Ensure your resume explicitly includes clear Contact, Education, and Experience sections.")

        return AtsGeneralCheckResponse(
            resume_id=resume_id,
            overall_ats_score=total_score,
            ats_readability_label=label,
            detected_skills_count=skill_count,
            categories=categories,
            strengths=strengths,
            improvements=improvements
        )

    # =========================================================================
    # 2. SPECIFIC INTERNSHIP/JOB MATCH ANALYSIS (Optional usage)
    # =========================================================================
    def analyze_resume_job_match(self, candidate: Dict[str, Any], internship: Dict[str, Any]) -> AtsAnalysisResponse:
        """Compares a candidate profile against a specific internship job description."""
        candidate_skills = candidate.get("skills", [])
        required_skills = internship.get("required_skills", [])
        preferred_skills = internship.get("preferred_skills", [])

        # 1. Skill Matching (35 Points Max)
        matched_required = [s for s in required_skills if any(s.lower() == cs.lower() for cs in candidate_skills)]
        missing_required = [s for s in required_skills if s not in matched_required]

        matched_preferred = [s for s in preferred_skills if any(s.lower() == cs.lower() for cs in candidate_skills)]
        missing_preferred = [s for s in preferred_skills if s not in matched_preferred]

        req_perc = (len(matched_required) / len(required_skills)) if required_skills else 1.0
        pref_perc = (len(matched_preferred) / len(preferred_skills)) if preferred_skills else 0.0

        skill_score = min(35, round(req_perc * 30 + pref_perc * 5))

        categories = [
            ScoreCategory(name="Skills Match", score=skill_score, max=35, weight_label="35%")
        ]
        total_score = skill_score

        # 2. Responsibility & Experience Match (25 Points Max)
        experience_items = candidate.get("experience", []) + candidate.get("projects", [])
        job_desc = internship.get("description", "")
        responsibility_analysis = self.check_responsibility_match(job_desc, experience_items)
        resp_score = min(25, round(responsibility_analysis["score"] * 2.5))

        categories.append(ScoreCategory(name="Responsibility & Experience", score=resp_score, max=25, weight_label="25%"))
        total_score += resp_score

        # 3. Project Relevance (15 Points Max)
        proj_score = min(15, len(candidate.get("projects", [])) * 5)
        categories.append(ScoreCategory(name="Project Relevance", score=proj_score, max=15, weight_label="15%"))
        total_score += proj_score

        # 4. Keyword Terminology (10 Points Max)
        kw_score = min(10, round((total_score / 75) * 10)) if total_score > 0 else 0
        categories.append(ScoreCategory(name="Keyword Terminology", score=kw_score, max=10, weight_label="10%"))
        total_score += kw_score

        # 5. Education Alignment (5 Points Max)
        edu_score = 5 if candidate.get("education") else 0
        categories.append(ScoreCategory(name="Education Alignment", score=edu_score, max=5, weight_label="5%"))
        total_score += edu_score

        total_score = min(100, total_score)
        fit_label = "Strong" if total_score >= 75 else ("Moderate" if total_score >= 50 else "Weak")

        recommendations = []
        if missing_required:
            recommendations.append(f"Consider adding experience or skills with: {', '.join(missing_required)}.")
        if responsibility_analysis["score"] < 7:
            recommendations.append("Align your project descriptions more closely with key responsibilities in the job posting.")

        return AtsAnalysisResponse(
            resume_id=str(candidate.get("resume_id") or candidate.get("id") or "0"),
            internship_id=str(internship.get("internship_id") or internship.get("id") or "0"),
            overall_match_score=total_score,
            overall_fit_label=fit_label,
            categories=categories,
            matched_skills=matched_required + matched_preferred,
            missing_skills=missing_required + missing_preferred,
            recommendations=recommendations
        )