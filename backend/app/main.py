from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from app.database import engine, Base
from app.api import auth, ingest, stats

load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(title="YouTube Watch Stats API")

origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    os.getenv("FRONTEND_URL", "http://localhost:3000")
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(ingest.router)
app.include_router(stats.router)

@app.get("/")
def root():
    return {"message": "YouTube Watch Stats API"}

@app.get("/health")
def health():
    return {"status": "healthy"}