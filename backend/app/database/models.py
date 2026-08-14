"""
ScamShield AI — Database Models
==================================
SQLAlchemy ORM models = Python classes that map to DB tables.

Each class = one database table
Each attribute = one column
"""

import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Float, Integer,
    Boolean, DateTime, Text, JSON
)
from app.database.connection import Base


def generate_uuid():
    """Generate a unique ID for each record."""
    return str(uuid.uuid4())


class AnalysisRecord(Base):
    """
    Stores every analysis performed.
    Used for dashboard trends and history.
    
    Table name: analysis_records
    """
    __tablename__ = "analysis_records"

    # ── Primary Key ───────────────────────────────────────
    id = Column(
        String(36),
        primary_key=True,
        default=generate_uuid,
        index=True
    )

    # ── Input Info ────────────────────────────────────────
    input_type    = Column(String(20), nullable=False)   # text/url/image/voice
    input_preview = Column(String(200), nullable=True)   # First 200 chars (privacy)
    input_language = Column(String(5), default='en')

    # ── Results ───────────────────────────────────────────
    risk_score    = Column(Float,   nullable=False)
    risk_level    = Column(String(10), nullable=False)   # LOW/MEDIUM/HIGH/CRITICAL
    is_scam       = Column(Boolean, nullable=False)
    scam_type     = Column(String(100), nullable=True)
    scam_probability = Column(Float, nullable=True)

    # ── Explanation (stored as JSON) ──────────────────────
    triggered_signals = Column(JSON, nullable=True)
    top_words         = Column(JSON, nullable=True)
    primary_reason    = Column(Text, nullable=True)

    # ── Metadata ──────────────────────────────────────────
    timestamp         = Column(DateTime, default=datetime.utcnow, index=True)
    processing_time_ms = Column(Float, nullable=True)
    models_used       = Column(JSON, nullable=True)

    def __repr__(self):
        return (f"<Analysis id={self.id[:8]} "
                f"type={self.input_type} "
                f"score={self.risk_score} "
                f"level={self.risk_level}>")


class FeedbackRecord(Base):
    """
    Stores user feedback on analysis accuracy.
    Used to improve models over time.
    
    Table name: feedback_records
    """
    __tablename__ = "feedback_records"

    id          = Column(String(36), primary_key=True, default=generate_uuid)
    analysis_id = Column(String(36), nullable=False, index=True)
    is_correct  = Column(Boolean, nullable=False)
    actual_label = Column(Integer, nullable=True)   # 0 or 1
    comment     = Column(Text, nullable=True)
    timestamp   = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return (f"<Feedback analysis={self.analysis_id[:8]} "
                f"correct={self.is_correct}>")


class ScamTrendRecord(Base):
    """
    Daily aggregated scam statistics.
    Used for dashboard charts.
    
    Table name: scam_trends
    """
    __tablename__ = "scam_trends"

    id              = Column(String(36), primary_key=True, default=generate_uuid)
    date            = Column(String(10), nullable=False, index=True)  # YYYY-MM-DD
    total_analyses  = Column(Integer, default=0)
    scam_count      = Column(Integer, default=0)
    legitimate_count = Column(Integer, default=0)
    avg_risk_score  = Column(Float, default=0.0)
    top_scam_type   = Column(String(100), nullable=True)
    scam_type_breakdown = Column(JSON, nullable=True)

    def __repr__(self):
        return f"<Trend date={self.date} total={self.total_analyses}>"