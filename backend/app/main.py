"""
ScamShield AI — FastAPI Backend
================================
This is the entry point for the ScamShield AI backend.
All API routes are registered here.

Author: Your Name
Version: 0.1.0 (Phase 0 - Setup)
"""

# ── Imports ───────────────────────────────────────────────────────────────────
# fastapi: The main web framework
# FastAPI() creates our application instance
from fastapi import FastAPI

# CORSMiddleware: Allows our React frontend (running on port 3000) to talk
# to our FastAPI backend (running on port 8000).
# Without CORS, browsers block cross-origin requests for security reasons.
from fastapi.middleware.cors import CORSMiddleware

# ── App Instance ───────────────────────────────────────────────────────────────
# This creates the FastAPI application.
# title, description, version appear in the auto-generated API docs at /docs
app = FastAPI(
    title="ScamShield AI",
    description="Multimodal Scam and Phishing Detection Assistant",
    version="0.1.0",
    docs_url="/docs",        # Swagger UI at http://localhost:8000/docs
    redoc_url="/redoc"       # ReDoc UI at http://localhost:8000/redoc
)

# ── CORS Configuration ─────────────────────────────────────────────────────────
# CORS = Cross-Origin Resource Sharing
# Our frontend will run at http://localhost:3000
# Our backend will run at http://localhost:8000
# Without this, the browser refuses to let the frontend talk to the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",    # React dev server
        "http://localhost:5173",    # Vite dev server (alternative)
        "https://scamshield.vercel.app",  # Production frontend (later)
    ],
    allow_credentials=True,
    allow_methods=["*"],    # Allow GET, POST, PUT, DELETE, etc.
    allow_headers=["*"],    # Allow any headers
)

# ── Health Check Endpoint ──────────────────────────────────────────────────────
# This is a standard practice — a simple endpoint to verify the server is running
# Monitoring tools, Docker health checks, and deployment platforms use this
@app.get("/", tags=["Health"])
async def root():
    """
    Root endpoint — confirms the API is running.
    Used for health checks by deployment platforms.
    """
    return {
        "status": "running",
        "message": "🛡️ ScamShield AI Backend is live!",
        "version": "0.1.0",
        "docs": "/docs"
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint.
    Returns 200 OK when the service is healthy.
    """
    return {
        "status": "healthy",
        "service": "ScamShield AI",
        "version": "0.1.0"
    }


# ── Future Routers (we will add these in later phases) ────────────────────────
# from app.api import analyze, dashboard, feedback
# app.include_router(analyze.router, prefix="/analyze", tags=["Analysis"])
# app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
# app.include_router(feedback.router, prefix="/feedback", tags=["Feedback"])