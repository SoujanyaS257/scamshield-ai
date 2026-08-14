"""
ScamShield AI — Configuration Module
======================================
Loads all environment variables using pydantic-settings.
Single source of truth for all configuration.

WHY PYDANTIC SETTINGS?
  - Reads from .env file automatically
  - Type validation on all config values
  - Raises clear errors if required vars are missing
  - Works identically in dev and production
"""

import os
from pydantic_settings import BaseSettings
from pydantic import Field
from functools import lru_cache


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    
    pydantic-settings reads these from:
    1. Environment variables (highest priority)
    2. .env file
    3. Default values (lowest priority)
    """

    # ── App ───────────────────────────────────────────────
    app_name:    str = "ScamShield AI"
    app_version: str = "1.0.0"
    debug:       bool = True
    secret_key:  str = "dev-secret-key-change-in-production"

    # ── Database ──────────────────────────────────────────
    # Default: SQLite for development (no setup needed)
    # Switch to PostgreSQL for production
    database_url: str = "sqlite:///./scamshield.db"

    # ── Model Settings ────────────────────────────────────
    # Build absolute path to saved_models directory
    models_dir: str = Field(
        default_factory=lambda: os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "saved_models"
        )
    )

    # Use DistilBERT or fall back to XGBoost
    # Set False for faster startup (uses XGBoost)
    use_distilbert: bool = False

    # ── API Limits ────────────────────────────────────────
    max_text_length:     int = 5000
    max_file_size_mb:    int = 10
    rate_limit_per_minute: int = 30

    # ── Optional External APIs ────────────────────────────
    openai_api_key: str = ""

    class Config:
        # Tell pydantic to read from .env file
        env_file = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            ".env"
        )
        env_file_encoding = "utf-8"
        # Allow extra fields (don't crash on unknown env vars)
        extra = "ignore"


# ── Singleton Pattern ─────────────────────────────────────────
# @lru_cache means Settings() is only created ONCE
# Every time get_settings() is called, same object returned
# This is important — we don't want to re-read .env every request

@lru_cache()
def get_settings() -> Settings:
    """
    Get application settings (cached singleton).
    
    Usage:
        from app.config import get_settings
        settings = get_settings()
        print(settings.app_name)
    """
    return Settings()


# Create module-level instance for convenience
settings = get_settings()