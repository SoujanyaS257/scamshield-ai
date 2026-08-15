"""
ScamShield AI — FastAPI Application Entry Point
================================================
This file:
1. Creates the FastAPI app
2. Loads ML models at startup (lifespan)
3. Registers all API routers
4. Configures middleware (CORS, rate limiting)
"""

import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from loguru import logger

from app.config import settings
from app.database.connection import create_tables

# ── Rate Limiter ──────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)


# ── Lifespan: Startup & Shutdown ──────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Runs ONCE at startup, ONCE at shutdown.
    
    WHY LIFESPAN INSTEAD OF @app.on_event?
    lifespan is the modern FastAPI approach.
    Code before 'yield' = startup.
    Code after 'yield'  = shutdown.
    """
    # ── STARTUP ───────────────────────────────────────────
    logger.info("=" * 50)
    logger.info("  ScamShield AI — Starting up...")
    logger.info("=" * 50)

    # Create database tables
    logger.info("Creating database tables...")
    create_tables()
    logger.info("  [OK] Database ready")

    # Load ML models
    logger.info("Loading ML models...")
    from app.models.text_classifier import text_classifier
    from app.models.url_classifier  import url_classifier
    from app.models.image_analyzer  import image_analyzer
    from app.models.voice_processor import voice_processor

    text_classifier.load()
    url_classifier.load()
    image_analyzer.load()
    voice_processor.load()

    logger.info("=" * 50)
    logger.info("  All systems ready!")
    logger.info(f"  Docs: http://localhost:8000/docs")
    logger.info("=" * 50)

    yield  # App runs here

    # ── SHUTDOWN ──────────────────────────────────────────
    logger.info("ScamShield AI shutting down...")


# ── Create App ────────────────────────────────────────────────
app = FastAPI(
    title="ScamShield AI",
    description="""
## 🛡️ ScamShield AI — Multimodal Scam Detection API

Detect scams in:
- **SMS/Email text** → `/analyze/text`
- **URLs** → `/analyze/url`
- **Screenshots** → `/analyze/image`
- **Voice** → `/analyze/voice`

Returns risk score (0-100), explanation, and actionable advice.
    """,
    version=settings.app_version,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# ── Rate Limiting ─────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ──────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://scamshield.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request Timing Middleware ─────────────────────────────────
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Add X-Process-Time header to every response."""
    start = time.time()
    response = await call_next(request)
    response.headers["X-Process-Time"] = str(
        round((time.time() - start) * 1000, 2)
    )
    return response


# ── Register Routers ──────────────────────────────────────────
from app.api import analyze, dashboard, feedback

app.include_router(
    analyze.router,
    prefix="/analyze",
    tags=["Analysis"]
)
app.include_router(
    dashboard.router,
    prefix="/dashboard",
    tags=["Dashboard"]
)
app.include_router(
    feedback.router,
    prefix="/feedback",
    tags=["Feedback"]
)


# ── Health Endpoints ──────────────────────────────────────────
_start_time = time.time()

@app.get("/", tags=["Health"])
async def root():
    return {
        "status":  "running",
        "message": "🛡️ ScamShield AI is live!",
        "version": settings.app_version,
        "docs":    "/docs"
    }

@app.get("/health", tags=["Health"])
async def health():
    from app.models.text_classifier import text_classifier
    from app.models.url_classifier  import url_classifier
    return {
        "status":             "healthy",
        "version":            settings.app_version,
        "models_loaded":      text_classifier.is_loaded,
        "url_model_loaded":   url_classifier.is_loaded,
        "uptime_seconds":     round(time.time() - _start_time, 1)
    }