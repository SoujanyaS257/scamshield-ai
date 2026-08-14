"""
ScamShield AI — Database Connection
=====================================
Sets up SQLAlchemy database connection.

WHY SQLALCHEMY?
  - Write Python, not SQL
  - Works with SQLite (dev) and PostgreSQL (prod)
  - Just change DATABASE_URL in .env to switch
  - Prevents SQL injection automatically

WHY SQLITE FOR DEVELOPMENT?
  - Zero setup — just a file on disk
  - Perfect for development and testing
  - Switch to PostgreSQL for production deployment
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

# ── Create Engine ─────────────────────────────────────────────
# The engine is the connection to the database
# check_same_thread=False is needed for SQLite with FastAPI
# (FastAPI uses multiple threads)

connect_args = {}
if settings.database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.database_url,
    connect_args=connect_args,
    # echo=True logs all SQL queries (useful for debugging)
    echo=settings.debug
)

# ── Session Factory ───────────────────────────────────────────
# Each request gets its own database session
# autocommit=False: we manually commit transactions
# autoflush=False: we control when data is flushed to DB
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# ── Base Class ────────────────────────────────────────────────
# All our database models inherit from this
# It provides the metadata SQLAlchemy needs
Base = declarative_base()


def get_db():
    """
    Dependency function for FastAPI endpoints.
    
    Provides a database session for each request.
    Automatically closes session when request ends.
    
    Usage in FastAPI:
        @app.get("/something")
        def my_endpoint(db: Session = Depends(get_db)):
            # db is available here
            # automatically closed after function returns
    
    The try/finally ensures session is ALWAYS closed,
    even if an exception occurs during the request.
    """
    db = SessionLocal()
    try:
        yield db        # Give session to the endpoint
    finally:
        db.close()      # Always close, no matter what


def create_tables():
    """
    Create all database tables.
    Called once at application startup.
    """
    # Import models so SQLAlchemy knows about them
    from app.database import models  # noqa: F401
    Base.metadata.create_all(bind=engine)