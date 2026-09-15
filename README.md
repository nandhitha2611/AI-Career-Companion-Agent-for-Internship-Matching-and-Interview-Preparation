# AI Career Companion Agent for Internship Matching and Interview Preparation

An **AI-powered web platform** designed to help students and early-career candidates discover suitable internships, optimize resumes, generate applications, and prepare for technical and HR interviews.

---

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Architecture](#project-architecture)
- [Setup Instructions](#setup-instructions)
- [API Endpoints](#api-endpoints)
- [Security](#security)
- [Future Enhancements](#future-enhancements)

---

## Features

- **User Authentication:** Secure user registration, login, and profile management using JWT authentication.
- **Resume Management:** Upload, parse, store, and manage resumes in `.pdf` and `.docx` formats.
- **Internship Search & Matching:** Matches candidate skills and resume information with suitable internship opportunities and generates Match Scores.
- **ATS Resume Checker:** Analyzes resumes for ATS optimization and provides an ATS score with improvement feedback.
- **AI Cover Letter Generation:** Generates personalized cover letters based on internship and candidate information.
- **Platform AI Assistant:** Helps users understand and navigate the features and workflows of the internship platform.
- **AI Interview Preparation Agent:** Provides resume-based role recommendations, interview questions, answer guidance, and preparation roadmaps.
- **Document-Based Q&A:** Allows users to upload PDF/DOCX documents and ask questions based on their content.
- **Application Tracking:** Allows users to manage and track internship applications.

---

## Technology Stack

| Category | Technology |
|----------|------------|
| Frontend | React, Vite, JavaScript |
| Backend | FastAPI, Python |
| Database | PostgreSQL |
| ORM | SQLAlchemy |
| AI / LLM | Groq (openai/gpt-oss-20b) |
| AI Framework | LangChain |
| Vector Store | FAISS |
| Embeddings | FastEmbed |
| Document Processing | PyPDF, python-docx |
| Authentication | JWT |
| API Communication | Axios |

---

## Project Architecture

```
                    ┌─────────────────────┐
                    │        User         │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   React + Vite      │
                    │      Frontend       │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   FastAPI Backend   │
                    └──────┬───────┬──────┘
                           │       │
                ┌──────────┘       └──────────┐
                ▼                             ▼
      ┌─────────────────┐           ┌─────────────────┐
      │   PostgreSQL    │           │   AI Services   │
      │     Database    │           │   Groq +        │
      │                 │           │   LangChain     │
      └─────────────────┘           └─────────────────┘
                                            │
                                            ▼
                                   ┌─────────────────┐
                                   │     Results     │
                                   └─────────────────┘
```

---

## Project Structure

```
AI-Internship-Agent/
│
├── frontend/
│   ├── src/
│   └── ...
│
├── routers/
│   ├── auth.py
│   ├── chatbot.py
│   ├── resume.py
│   ├── internships.py
│   ├── match.py
│   └── interview_agent.py
│
├── services/
│   ├── chatbot_service.py
│   ├── interview_agent_service.py
│   ├── document_parser.py
│   └── ...
│
├── migrations/
│
├── data/
│
├── main.py
├── models.py
├── schemas.py
├── crud.py
├── database.py
├── PRODUCT_DOCS.md
├── requirements.txt
└── README.md
```

---

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/nandhitha2611/AI-Internship-Agent.git
cd AI-Internship-Agent
```

### 2. Backend Setup

#### Create a Python Virtual Environment

```bash
python -m venv venv
```

#### Activate the Virtual Environment

**On Windows:**
```bash
venv\Scripts\activate
```

**On macOS/Linux:**
```bash
source venv/bin/activate
```

#### Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Environment Variables

Create a `.env` file in the backend project directory with the following configuration:

```env
GROQ_API_KEY=your_groq_api_key
DATABASE_URL=postgresql://user:password@localhost/ai_internship_agent
JWT_SECRET_KEY=your_jwt_secret_key
```

**Important:** Never commit your `.env` file or API keys to GitHub. Add `.env` to your `.gitignore` file.

### 4. Start the Backend

```bash
uvicorn main:app --reload
```

The FastAPI backend will start on `http://localhost:8000`

### 5. Start the Frontend

Open a new terminal and run:

```bash
cd frontend
npm install
npm run dev
```

The frontend will start using the local URL provided by Vite (typically `http://localhost:5173`)

---

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | User registration |
| POST | `/auth/login` | User login |
| POST | `/auth/refresh` | Refresh JWT token |
| POST | `/auth/logout` | User logout |
| GET | `/auth/me` | Get current user info |

### Profile Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/profile/` | Get user profile |
| PUT | `/profile/` | Update user profile |

### Resume Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/resume/upload` | Upload resume |
| GET | `/resume/` | Get user resumes |

### Platform AI Assistant

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Chat with platform assistant |

### Interview Preparation Agent

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/interview-agent/chat` | Interview preparation chat |
| POST | `/api/interview-agent/extract-document` | Extract and analyze documents |

### Internship Matching

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/internships/` | Get all internships |
| POST | `/match/` | Get matching internships |

---

## AI Components

### Platform AI Assistant

The **Platform AI Assistant** helps users understand and navigate the application.

**Capabilities:**
- Answer questions about resume upload and management
- Explain profile management features
- Guide through internship matching process
- Explain ATS Resume Checker functionality
- Provide cover letter generation guidance
- Clarify application workflows

**Implementation:** Uses `PRODUCT_DOCS.md` as knowledge source with FAISS, FastEmbed, and Groq LLM for retrieval-augmented generation.

### AI Interview Preparation Agent

The **AI Interview Preparation Agent** helps candidates prepare for internship and technical interviews using their resume, profile information, and uploaded documents.

**Provides:**
- Role Recommendations
- Strongest Technical Skills Analysis
- Technical Interview Questions
- HR Interview Questions
- Answer Guidance
- Interview Preparation Roadmaps
- Topics to Prepare
- PDF/DOCX Document-Based Q&A

**Implementation:** Grounds responses in candidate's resume/profile data and uploaded document content.

---

## Supported Document Formats

The application supports:

- PDF (`.pdf`)
- Microsoft Word (`.docx`)

These documents can be processed for:

- Resume parsing
- Interview preparation
- Document-based question answering
- AI-assisted analysis

---

## Security

The application uses **JWT (JSON Web Tokens)** based authentication to protect authenticated resources.

**Key Security Features:**

- Secure user registration and login
- JWT token-based authentication for API requests
- User-specific data isolation (profiles and resumes)
- Protected API endpoints that verify current user before accessing restricted resources
- Environment variable management for sensitive credentials

**Best Practices:**

- Always keep `.env` file out of version control
- Use strong JWT secret keys
- Rotate API keys regularly
- Use HTTPS in production
- Implement rate limiting on authentication endpoints

---

## API Documentation

Once the backend is running, access interactive API documentation via Swagger UI:

```
http://localhost:8000/docs
```

Alternative ReDoc documentation available at:

```
http://localhost:8000/redoc
```

---

## System Workflow

### Resume Processing

```
Resume Upload
    ↓
PDF/DOCX Text Extraction
    ↓
Resume Parsing
    ↓
Structured Resume Data
    ↓
Resume Storage
    ↓
Matching / ATS / Interview Preparation
```

### Internship Matching

```
Select / Upload Resume
    ↓
Extract Resume Skills
    ↓
Compare with Internship Requirements
    ↓
Calculate Match Score
    ↓
Rank Internship Opportunities
    ↓
Display Matched Roles
```

### ATS Analysis

```
Select Saved Resume / Upload Resume
    ↓
Resume Processing
    ↓
ATS Analysis
    ↓
Generate ATS Score & Report
    ↓
Display Results
```

### Interview Preparation

```
Resume / Profile / PDF / DOCX
    ↓
Text & Context Extraction
    ↓
Interview Preparation Agent
    ↓
Groq LLM Processing
    ↓
Role Recommendation
Technical Questions
HR Questions
Preparation Roadmap
Document Q&A
    ↓
User
```

---

## Key Distinction Between AI Components

### Platform AI Assistant
- Helps users understand and navigate the application
- Answers questions about how the platform works
- Uses product documentation as knowledge base

### Interview Preparation Agent
- Helps users prepare for internships and interviews
- Uses resume/profile information and uploaded documents
- Provides career and interview preparation assistance

This separation ensures that platform-related questions and candidate-specific interview preparation are handled independently.

---

## Future Enhancements

- [ ] Advanced Mock Interview Simulation
- [ ] Enhanced Interview Answer Evaluation
- [ ] Additional Internship Sources
- [ ] Support for Additional Document Formats
- [ ] Cloud Deployment
- [ ] Advanced AI Interview Assessment

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## Support

For issues, questions, or suggestions, please open an issue on the GitHub repository.

---

## Author

**Nandhitha R**

GitHub: [@nandhitha2611](https://github.com/nandhitha2611)

---

**Last Updated:** September 2026
