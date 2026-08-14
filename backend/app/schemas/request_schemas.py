"""
ScamShield AI — Request Schemas
=================================
Pydantic models that define what data our API accepts.

WHY SCHEMAS?
  FastAPI validates incoming JSON against these schemas
  AUTOMATICALLY before your code runs.
  
  If user sends:  {"text": 12345}  (number instead of string)
  FastAPI returns: 422 Unprocessable Entity with clear message
  Your handler never even runs — clean separation.
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional
from enum import Enum


class LanguageEnum(str, Enum):
    """Supported languages for analysis."""
    english = "en"
    hindi   = "hi"
    auto    = "auto"  # Auto-detect


class TextAnalysisRequest(BaseModel):
    """
    Request body for POST /analyze/text
    
    Accepts SMS messages, email content, or any text
    the user suspects might be a scam.
    """
    
    text: str = Field(
        ...,  # ... means REQUIRED
        min_length=5,
        max_length=5000,
        description="The SMS/email text to analyze",
        examples=["URGENT: Your SBI account will be blocked! Verify OTP now."]
    )
    
    language: LanguageEnum = Field(
        default=LanguageEnum.auto,
        description="Input language (auto-detected if not specified)"
    )
    
    include_hindi_explanation: bool = Field(
        default=False,
        description="Also return explanation in Hindi"
    )

    @field_validator('text')
    @classmethod
    def text_must_not_be_empty(cls, v):
        """Reject text that is only whitespace."""
        if not v.strip():
            raise ValueError("Text cannot be empty or whitespace only")
        return v.strip()


class URLAnalysisRequest(BaseModel):
    """
    Request body for POST /analyze/url
    """
    
    url: str = Field(
        ...,
        min_length=4,
        max_length=2000,
        description="The URL to analyze for phishing",
        examples=["http://sbi-secure-verify.xyz/login"]
    )

    @field_validator('url')
    @classmethod
    def url_basic_validation(cls, v):
        """Basic URL format check."""
        v = v.strip()
        # Add http:// if no scheme provided
        if not v.startswith(('http://', 'https://', 'ftp://')):
            v = 'http://' + v
        return v


class FeedbackRequest(BaseModel):
    """
    Request body for POST /feedback
    User tells us if our prediction was correct.
    """
    
    analysis_id: str = Field(
        ...,
        description="ID of the analysis to provide feedback for"
    )
    
    is_correct: bool = Field(
        ...,
        description="Was our prediction correct?"
    )
    
    actual_label: Optional[int] = Field(
        default=None,
        ge=0, le=1,
        description="Actual label: 0=legitimate, 1=scam"
    )
    
    comment: Optional[str] = Field(
        default=None,
        max_length=500,
        description="Optional user comment"
    )


class VoiceAnalysisRequest(BaseModel):
    """
    Request body for POST /analyze/voice (text fallback)
    When frontend sends transcribed text from voice.
    """
    
    transcribed_text: str = Field(
        ...,
        min_length=3,
        max_length=2000,
        description="Text transcribed from voice input"
    )
    
    language: LanguageEnum = Field(default=LanguageEnum.auto)