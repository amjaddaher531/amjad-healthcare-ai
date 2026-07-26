"""
Amjad Healthcare AI — backend entrypoint.

Run locally:
    cd backend
    pip install -r requirements.txt
    cp .env.example .env   # then add your ANTHROPIC_API_KEY
    uvicorn app.main:app --reload --port 8000
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.db.database import init_db
from app.api.routes_analyze import router as analyze_router
from app.api.routes_feedback import router as feedback_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="Amjad Healthcare AI",
    description="Multi-agent AI platform for medical coding, billing, RCM, claims review, and audit.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze_router)
app.include_router(feedback_router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "Amjad Healthcare AI", "ai_configured": bool(settings.anthropic_api_key)}
