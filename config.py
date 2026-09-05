from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Required settings
    database_url: str
    secret_key: str

    # Auth defaults
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # Groq settings
    groq_api_key: str | None = None
    groq_model: str = "openai/gpt-oss-120b"

    # RAG & Vector Search settings (paths updated to match your root structure)
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    internship_data_path: str = "data/internships.json"
    internship_index_dir: str = "data/faiss_internship_index"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()