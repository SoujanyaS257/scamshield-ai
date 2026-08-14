"""
ScamShield AI — Response Schemas
==================================
Pydantic models that define what our API returns.

Consistent response format means:
  - Frontend always knows what to expect
  - Easy to version API later
  - Auto-documented in /docs
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class WordContribution(BaseModel):
    """A single word and its impact on the scam score."""
    word:   str
    impact: str   # 'scam' or 'legitimate'
    score:  float


class TriggeredSignal(BaseModel):
    """A detected scam signal/pattern."""
    category: str
    reason:   str
    severity: str  # LOW, MEDIUM, HIGH, CRITICAL


class AdviceResponse(BaseModel):
    """Actionable advice for the user."""
    opening:             str
    immediate_actions:   List[str]
    preventive_measures: List[str]
    report_to:           List[str]
    summary:             str
    emergency_number:    str
    portal:              str


class HindiExplanation(BaseModel):
    """Hindi translation of key explanation parts."""
    summary_hi:       Optional[str] = None
    primary_reason_hi: Optional[str] = None
    opening_hi:       Optional[str] = None
    first_action_hi:  Optional[str] = None


class AnalysisResponse(BaseModel):
    """
    Standard response for all /analyze/* endpoints.
    
    Every analysis returns this same structure
    regardless of input type (text/URL/image/voice).
    This makes the frontend code simpler.
    """

    # ── Identity ──────────────────────────────────────────
    analysis_id:  str = Field(description="Unique ID for this analysis")
    input_type:   str = Field(description="text/url/image/voice")
    timestamp:    datetime = Field(default_factory=datetime.utcnow)

    # ── Risk Score ────────────────────────────────────────
    risk_score:   float = Field(ge=0, le=100, description="0-100 risk score")
    risk_level:   str   = Field(description="LOW/MEDIUM/HIGH/CRITICAL")
    risk_color:   str   = Field(description="Hex color for UI gauge")
    risk_emoji:   str   = Field(description="Emoji for risk level")
    confidence:   str   = Field(description="High/Medium/Low confidence")

    # ── Prediction Details ────────────────────────────────
    is_scam:      bool
    scam_type:    str
    scam_probability: float = Field(ge=0, le=1)

    # ── Explanation ───────────────────────────────────────
    summary:          str
    primary_reason:   str
    all_reasons:      List[str]
    triggered_signals: List[TriggeredSignal]
    top_words:        List[WordContribution]

    # ── Advice ───────────────────────────────────────────
    advice:           AdviceResponse

    # ── Multilingual ─────────────────────────────────────
    input_language:   str   = Field(description="Detected input language")
    was_translated:   bool  = Field(description="Was input translated?")
    hindi:            Optional[HindiExplanation] = None

    # ── Model Details (for transparency) ─────────────────
    models_used:      List[str]
    processing_time_ms: Optional[float] = None

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}


class DashboardResponse(BaseModel):
    """Response for GET /dashboard"""
    
    total_analyses:    int
    scam_detected:     int
    legitimate_count:  int
    scam_percentage:   float
    
    # Trend data for charts
    daily_trend:       List[Dict[str, Any]]
    scam_types:        List[Dict[str, Any]]
    risk_distribution: List[Dict[str, Any]]
    top_signals:       List[Dict[str, Any]]
    
    last_updated:      datetime = Field(default_factory=datetime.utcnow)


class FeedbackResponse(BaseModel):
    """Response for POST /feedback"""
    success:  bool
    message:  str
    feedback_id: str


class HealthResponse(BaseModel):
    """Response for GET /health"""
    status:   str
    version:  str
    models_loaded: bool
    database_connected: bool
    uptime_seconds: float