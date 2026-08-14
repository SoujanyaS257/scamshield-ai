"""
ScamShield AI — CRUD Operations
==================================
CRUD = Create, Read, Update, Delete

All database operations go here.
Endpoints call these functions — they never write SQL directly.

WHY SEPARATE CRUD FILE?
  - Endpoints stay clean (just handle HTTP logic)
  - Database logic is reusable across endpoints
  - Easy to test database operations independently
"""

import uuid
from datetime import datetime, date
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.database.models import AnalysisRecord, FeedbackRecord, ScamTrendRecord


# ── Analysis CRUD ─────────────────────────────────────────────

def create_analysis(db: Session, analysis_data: dict) -> AnalysisRecord:
    """
    Save a new analysis result to database.
    
    Args:
        db:            Database session
        analysis_data: Dict with all analysis fields
    
    Returns:
        AnalysisRecord: The saved record with generated ID
    """
    record = AnalysisRecord(
        id=str(uuid.uuid4()),
        input_type=analysis_data.get('input_type', 'text'),
        # Only store first 200 chars for privacy
        input_preview=str(analysis_data.get('input_preview', ''))[:200],
        input_language=analysis_data.get('input_language', 'en'),
        risk_score=analysis_data.get('risk_score', 0),
        risk_level=analysis_data.get('risk_level', 'LOW'),
        is_scam=analysis_data.get('is_scam', False),
        scam_type=analysis_data.get('scam_type', 'Unknown'),
        scam_probability=analysis_data.get('scam_probability', 0.0),
        triggered_signals=analysis_data.get('triggered_signals', []),
        top_words=analysis_data.get('top_words', []),
        primary_reason=analysis_data.get('primary_reason', ''),
        processing_time_ms=analysis_data.get('processing_time_ms', 0),
        models_used=analysis_data.get('models_used', []),
        timestamp=datetime.utcnow()
    )

    db.add(record)
    db.commit()
    db.refresh(record)  # Reload from DB to get auto-generated fields

    # Update daily trend
    _update_daily_trend(db, record)

    return record


def get_analysis_by_id(db: Session, analysis_id: str) -> Optional[AnalysisRecord]:
    """Get a single analysis by ID."""
    return db.query(AnalysisRecord).filter(
        AnalysisRecord.id == analysis_id
    ).first()


def get_recent_analyses(db: Session, limit: int = 50) -> List[AnalysisRecord]:
    """Get most recent analyses for dashboard."""
    return db.query(AnalysisRecord)\
             .order_by(desc(AnalysisRecord.timestamp))\
             .limit(limit)\
             .all()


# ── Feedback CRUD ─────────────────────────────────────────────

def create_feedback(db: Session, feedback_data: dict) -> FeedbackRecord:
    """Save user feedback on an analysis."""
    record = FeedbackRecord(
        id=str(uuid.uuid4()),
        analysis_id=feedback_data['analysis_id'],
        is_correct=feedback_data['is_correct'],
        actual_label=feedback_data.get('actual_label'),
        comment=feedback_data.get('comment', ''),
        timestamp=datetime.utcnow()
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


# ── Dashboard/Trend CRUD ──────────────────────────────────────

def _update_daily_trend(db: Session, analysis: AnalysisRecord):
    """
    Update or create today's trend record.
    Called automatically after each analysis.
    Private function (prefixed with _).
    """
    today = date.today().isoformat()

    # Try to get existing record for today
    trend = db.query(ScamTrendRecord).filter(
        ScamTrendRecord.date == today
    ).first()

    if trend is None:
        # Create new record for today
        trend = ScamTrendRecord(
            id=str(uuid.uuid4()),
            date=today,
            total_analyses=0,
            scam_count=0,
            legitimate_count=0,
            avg_risk_score=0.0,
            scam_type_breakdown={}
        )
        db.add(trend)

    # Update counts
    trend.total_analyses  += 1
    
    if analysis.is_scam:
        trend.scam_count += 1
        # Update scam type breakdown
        breakdown = trend.scam_type_breakdown or {}
        scam_type = analysis.scam_type or 'Unknown'
        breakdown[scam_type] = breakdown.get(scam_type, 0) + 1
        trend.scam_type_breakdown = breakdown
        
        # Update top scam type
        trend.top_scam_type = max(breakdown, key=breakdown.get)
    else:
        trend.legitimate_count += 1

    # Recalculate average risk score
    total = trend.total_analyses
    old_avg = trend.avg_risk_score or 0
    trend.avg_risk_score = ((old_avg * (total - 1)) + analysis.risk_score) / total

    db.commit()


def get_dashboard_data(db: Session) -> dict:
    """
    Aggregate data for the dashboard.
    Returns counts, trends, and breakdowns.
    """
    # Total counts
    total     = db.query(func.count(AnalysisRecord.id)).scalar() or 0
    scam_cnt  = db.query(func.count(AnalysisRecord.id))\
                  .filter(AnalysisRecord.is_scam == True).scalar() or 0
    legit_cnt = total - scam_cnt

    # Daily trend (last 14 days)
    daily_trends = db.query(ScamTrendRecord)\
                     .order_by(desc(ScamTrendRecord.date))\
                     .limit(14)\
                     .all()

    daily_trend_data = [
        {
            'date':         t.date,
            'total':        t.total_analyses,
            'scams':        t.scam_count,
            'legitimate':   t.legitimate_count,
            'avg_risk':     round(t.avg_risk_score or 0, 1)
        }
        for t in reversed(daily_trends)
    ]

    # Scam type breakdown
    scam_type_query = db.query(
        AnalysisRecord.scam_type,
        func.count(AnalysisRecord.id).label('count')
    ).filter(
        AnalysisRecord.is_scam == True
    ).group_by(
        AnalysisRecord.scam_type
    ).order_by(desc('count')).limit(8).all()

    scam_types = [
        {'type': row.scam_type or 'Unknown', 'count': row.count}
        for row in scam_type_query
    ]

    # Risk level distribution
    risk_query = db.query(
        AnalysisRecord.risk_level,
        func.count(AnalysisRecord.id).label('count')
    ).group_by(AnalysisRecord.risk_level).all()

    risk_dist = [
        {'level': row.risk_level, 'count': row.count}
        for row in risk_query
    ]

    return {
        'total_analyses':    total,
        'scam_detected':     scam_cnt,
        'legitimate_count':  legit_cnt,
        'scam_percentage':   round((scam_cnt / total * 100) if total > 0 else 0, 1),
        'daily_trend':       daily_trend_data,
        'scam_types':        scam_types,
        'risk_distribution': risk_dist,
        'top_signals':       [],
    }