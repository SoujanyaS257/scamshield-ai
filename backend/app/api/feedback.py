"""ScamShield AI — Feedback API Route"""

import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.crud import create_feedback, get_analysis_by_id
from app.schemas.request_schemas import FeedbackRequest
from app.schemas.response_schemas import FeedbackResponse

router = APIRouter()

@router.post(
    "/",
    response_model=FeedbackResponse,
    summary="Submit feedback on analysis accuracy"
)
async def submit_feedback(
    request: FeedbackRequest,
    db: Session = Depends(get_db)
):
    """POST /feedback — User tells us if prediction was correct."""
    
    # Verify analysis exists
    analysis = get_analysis_by_id(db, request.analysis_id)
    if not analysis:
        raise HTTPException(
            status_code=404,
            detail=f"Analysis {request.analysis_id} not found"
        )

    feedback = create_feedback(db, {
        'analysis_id':  request.analysis_id,
        'is_correct':   request.is_correct,
        'actual_label': request.actual_label,
        'comment':      request.comment or ''
    })

    return FeedbackResponse(
        success=True,
        message="Thank you for your feedback! It helps us improve.",
        feedback_id=feedback.id
    )