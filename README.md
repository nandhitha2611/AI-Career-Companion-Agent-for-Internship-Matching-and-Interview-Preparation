# AI-Powered Resume Parser & Internship Agent

A full-stack RESTful API built with **FastAPI**, **PostgreSQL**, and **Groq LLaMA 3.3** that extracts, standardizes, and stores structured candidate metadata from uploaded resume files (`.pdf`, `.docx`).

---

## Features

- **Multi-Format Ingestion:** Supports `.pdf`, `.doc`, and `.docx` uploads (up to 5 MB).
- **Hybrid Parsing Pipeline:** Combines deterministic **Regex** (for exact phone/email matching) with **Groq LLaMA 3.3** (for context-aware summary, experience, and skills extraction).
- **Relational Persistence:** Automatically saves parsed data as native JSON objects (`JSONB`) in PostgreSQL linked via Foreign Keys to user accounts.
- **Secure File Handling:** Implements per-user disk organization using isolated UUID filename mapping to prevent directory traversal attacks.
- **JWT Authentication:** Protects endpoints using Bearer token verification.

---

## Tech Stack

- **Backend:** FastAPI, Python 3.10+
- **Database:** PostgreSQL, SQLAlchemy ORM
- **LLM Integration:** Groq SDK (`llama-3.3-70b-versatile`)
- **Document Processing:** `pypdf`, `python-docx`
- **Authentication:** OAuth2 with JWT tokens

---

## Getting Started

### 1. Prerequisites
- Python 3.10+ installed
- PostgreSQL database running locally or hosted

### 2. Clone the Repository
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd <REPOSITORY_FOLDER_NAME>

### 3. Set Up Virtual Environment
# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate

### 4. Install Dependencies
pip install -r requirements.txt

### 5. Configure Environment Variables
Create a .env file in the root directory (refer to .env.example):
DATABASE_URL=postgresql://<USERNAME>:<PASSWORD>@localhost:5432/<DATABASE_NAME>
GROQ_API_KEY=your_groq_api_key_here
SECRET_KEY=your_jwt_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

### 6. Start the Server
uvicorn app.main:app --reload

---

## API Documentation & Usage

Once the server is running, access the interactive Swagger UI at:
http://127.0.0.1:8000/docs

### Primary Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/auth/register` | Register a new student account |
| `POST` | `/auth/token` | Obtain JWT access token |
| `POST` | `/resume/upload` | Upload and parse resume file (`.docx`/`.pdf`) |
| `GET` | `/resume/` | List all parsed resumes for current user |
| `GET` | `/resume/{id}/download` | Stream original resume file |

---

## Project Structure

```text
├── routers/             # API Route definitions (/auth, /resume)
├── config.py            # Environment & app configurations
├── crud.py              # Database CRUD operations
├── database.py          # SQLAlchemy engine & session setup
├── main.py              # FastAPI app initialization & endpoint routing
├── models.py            # SQLAlchemy database models
├── parser.py            # Hybrid parsing logic (Regex + Groq LLaMA)
├── schemas.py           # Pydantic validation schemas
├── security.py          # Password hashing & JWT helper utilities
├── .env.example         # Environment template
├── .gitignore           # Git ignore settings
├── requirements.txt     # Python project dependencies
└── README.md            # Project documentation
