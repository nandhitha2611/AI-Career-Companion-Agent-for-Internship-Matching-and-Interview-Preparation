import os
import json

from dotenv import load_dotenv
load_dotenv()

from langchain_community.document_loaders import (
    TextLoader,
    PyPDFLoader,
    Docx2txtLoader,
)
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import FastEmbedEmbeddings
from langchain_groq import ChatGroq
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage


class ChatbotService:

    def __init__(self, doc_path="PRODUCT_DOCS.md"):

        groq_api_key = os.getenv("GROQ_API_KEY")

        if not groq_api_key:
            raise RuntimeError(
                "GROQ_API_KEY is missing from your .env file!"
            )

        # -----------------------------
        # Product documentation RAG
        # -----------------------------
        embeddings = FastEmbedEmbeddings()

        if doc_path.endswith(".pdf"):
            loader = PyPDFLoader(doc_path)
        elif doc_path.endswith(".docx"):
            loader = Docx2txtLoader(doc_path)
        else:
            loader = TextLoader(doc_path)

        docs = loader.load()

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=50
        )

        chunks = splitter.split_documents(docs)

        self.vectorstore = FAISS.from_documents(
            chunks,
            embeddings
        )

        self.retriever = self.vectorstore.as_retriever(
            search_kwargs={"k": 3}
        )

        # -----------------------------
        # LLM
        # -----------------------------
        self.llm = ChatGroq(
            model_name="openai/gpt-oss-20b",
            groq_api_key=groq_api_key,
            temperature=0.2
        )

    # ============================================================
    # Convert candidate data into readable text for the LLM
    # ============================================================
    def _format_candidate_data(self, data):

        if not data:
            return "No candidate information is available."

        if isinstance(data, str):
            return data

        try:
            return json.dumps(
                data,
                indent=2,
                ensure_ascii=False,
                default=str
            )
        except Exception:
            return str(data)

    # ============================================================
    # Generate personalized chatbot response
    # ============================================================
    def generate_response(
        self,
        query: str,
        history_records: list,
        candidate_context: str = "",
        resume_name: str = ""
    ):

        # -----------------------------
        # Chat history
        # -----------------------------
        chat_history = []

        for rec in history_records:
            chat_history.append(
                HumanMessage(content=rec.user_query)
            )

            chat_history.append(
                AIMessage(content=rec.assistant_response)
            )

        # -----------------------------
        # Product documentation
        # -----------------------------
        docs = self.retriever.invoke(query)

        product_context = "\n\n".join(
            [d.page_content for d in docs]
        )

        # -----------------------------
        # Resume information
        # -----------------------------
        if candidate_context:
            resume_context = candidate_context
        else:
            resume_context = (
                "No resume or candidate profile information "
                "is currently available."
            )

        # -----------------------------
        # Resume-aware prompt
        # -----------------------------
        system_prompt = """
You are the AI Internship Application Agent's
Interview Preparation and Career Assistant.

Your main purpose is to help the candidate with:

1. Role recommendations
2. Internship suitability
3. Technical skill analysis
4. Interview preparation
5. Technical interview questions
6. HR interview questions
7. Answer guidance
8. Interview preparation roadmaps
9. Topics to study
10. Personalized learning recommendations

You have access to the candidate's saved resume/profile information.

IMPORTANT RULES:

- Use the candidate information when answering career,
  internship, role, resume, or interview questions.
- Never invent skills, projects, education, certifications,
  internships, work experience, or achievements that are
  not present in the candidate information.
- If something is not present in the candidate information,
  clearly say that it is not available.
- Base role recommendations on the candidate's actual skills,
  projects, education, internships, and experience.
- When preparing interview questions, personalize them to
  the candidate's actual background whenever possible.
- When suggesting areas to improve, identify gaps between the
  candidate's current skills and the target role.
- Give practical and actionable preparation advice.
- If the user asks for an interview roadmap, organize it into
  clear steps or stages.
- If the user asks for questions, provide questions and,
  when useful, briefly explain what a good answer should cover.
- Do not claim that the candidate knows a technology unless it
  appears in the provided candidate information.

PRODUCT DOCUMENTATION:

The product documentation explains how the AI Internship
Application Agent itself works.

Use the product documentation mainly for questions about:
- how to use the application
- where features are located
- resume upload
- profile
- internship matching
- applications
- other application functionality

CANDIDATE INFORMATION:

{candidate_context}

LATEST RESUME:

{resume_name}

PRODUCT DOCUMENTATION CONTEXT:

{product_context}

RESPONSE STYLE:

- Keep responses concise and easy to scan.
- Use simple bold headings when useful.
- Use bullet points or numbered lists.
- Do NOT use Markdown tables.
- Do NOT use horizontal dividers.
- Do NOT use complex Markdown headers.
- Avoid unnecessary long explanations.
- For personalized recommendations, explain the reasoning briefly.
"""

        prompt = ChatPromptTemplate.from_messages(
            [
                ("system", system_prompt),
                MessagesPlaceholder(
                    variable_name="chat_history"
                ),
                ("human", "{input}")
            ]
        )

        chain = prompt | self.llm

        response = chain.invoke(
            {
                "candidate_context": resume_context,
                "resume_name": resume_name or "No resume selected",
                "product_context": product_context,
                "chat_history": chat_history,
                "input": query,
            }
        )

        return (
            response.content,
            [d.page_content[:150] for d in docs]
        )