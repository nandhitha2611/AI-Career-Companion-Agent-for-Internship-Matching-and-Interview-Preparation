from fastapi import FastAPI
from dotenv import load_dotenv
load_dotenv()
from database import Base, engine
from routers import auth, resume, profile


Base.metadata.create_all(bind=engine)

app = FastAPI(title="Internship Assistant API")
app.include_router(auth.router)
app.include_router(resume.router)
app.include_router(profile.router)


@app.get("/")
def root():
    return {"status": "ok"}
