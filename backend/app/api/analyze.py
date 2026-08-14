"""
ScamShield AI — Analysis API Routes
=====================================
Core endpoints: /analyze/text, /analyze/url,
                /analyze/image, /analyze/voice
"""

import uuid
import time
import io
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
from loguru import logger
from PIL import Image

from app.schemas.request_schemas  import TextAnalysisRequest, URLAnalysisRequest
from app.schemas.response_schemas import AnalysisResponse, AdviceResponse, \
                                         WordContribution, TriggeredSignal, \
                                         HindiExplanation
from app.database.connection import get_db
from app.database.crud      import create_analysis
from app.models.text_classifier import text_classifier
from app.models.url_classifier  import url_classifier
from app.models.image_analyzer  import image_analyzer
from app.models.ensemble        import calculate_ensemble_score
from app.explainer.reason_generator import generate_reasons, generate_advice
from app.utils.language_detector    import detect_language, translate_to_english, \
                                            translate_to_hindi
from app.config import settings

router = APIRouter()


# ── HELPER: Build Full Response ───────────────────────────────

def _build_response(
    input_type: str,
    input_preview: str,
    ensemble_result: dict,
    explanation: dict,
    advice_result: dict,
    shap_result: dict,
    input_language: str,
    was_translated: bool,
    processing_time_ms: float,
    include_hindi: bool = False,
    db: Session = None
) -> AnalysisResponse:
    """
    Build standardized AnalysisResponse from all component outputs.
    Also saves to database.
    """

    analysis_id  = str(uuid.uuid4())
    risk_score   = ensemble_result['risk_score']
    risk_level   = ensemble_result['risk_level']
    is_scam      = risk_score > 50
    scam_type    = explanation.get('scam_type', 'Unknown')
    models_used  = ensemble_result.get('models_used', [])

    # Build word contributions list
    top_words = []
    for item in shap_result.get('top_scam_words', [])[:7]:
        top_words.append(WordContribution(
            word=item['word'], impact='scam',
            score=round(item['shap_value'], 4)
        ))
    for item in shap_result.get('top_legit_words', [])[:3]:
        top_words.append(WordContribution(
            word=item['word'], impact='legitimate',
            score=round(abs(item['shap_value']), 4)
        ))

    # Build triggered signals list
    triggered = [
        TriggeredSignal(
            category=s['category'],
            reason=s['reason'],
            severity=s['severity']
        )
        for s in explanation.get('triggered_signals', [])[:5]
    ]

    # Build advice
    advice = AdviceResponse(
        opening=advice_result.get('opening', ''),
        immediate_actions=advice_result.get('immediate_actions', []),
        preventive_measures=advice_result.get('preventive_measures', []),
        report_to=advice_result.get('report_to', []),
        summary=advice_result.get('summary', ''),
        emergency_number=advice_result.get('emergency_number', '1930'),
        portal=advice_result.get('portal', 'https://cybercrime.gov.in')
    )

    # Build Hindi explanation if requested
    hindi_exp = None
    if include_hindi or input_language == 'hi':
        try:
            hindi_exp = HindiExplanation(
                summary_hi=translate_to_hindi(advice_result.get('summary', '')),
                primary_reason_hi=translate_to_hindi(
                    explanation.get('primary_reason', '')
                ),
                opening_hi=translate_to_hindi(advice_result.get('opening', '')),
                first_action_hi=translate_to_hindi(
                    advice_result.get('immediate_actions', [''])[0]
                )
            )
        except Exception as e:
            logger.warning(f"Hindi translation failed: {e}")

    # Save to database
    if db:
        try:
            create_analysis(db, {
                'input_type':      input_type,
                'input_preview':   input_preview,
                'input_language':  input_language,
                'risk_score':      risk_score,
                'risk_level':      risk_level,
                'is_scam':         is_scam,
                'scam_type':       scam_type,
                'scam_probability': ensemble_result.get(
                    'contributions', {}).get('XGBoost Text', risk_score/100
                ),
                'triggered_signals': [
                    {'category': s.category, 'severity': s.severity}
                    for s in triggered
                ],
                'top_words':       [w.dict() for w in top_words],
                'primary_reason':  explanation.get('primary_reason', ''),
                'processing_time_ms': processing_time_ms,
                'models_used':     models_used,
            })
        except Exception as e:
            logger.error(f"DB save error: {e}")

    return AnalysisResponse(
        analysis_id=analysis_id,
        input_type=input_type,
        timestamp=datetime.utcnow(),
        risk_score=risk_score,
        risk_level=risk_level,
        risk_color=ensemble_result.get('risk_color', '#2ecc71'),
        risk_emoji=ensemble_result.get('risk_emoji', '✅'),
        confidence=ensemble_result.get('confidence', 'Low'),
        is_scam=is_scam,
        scam_type=scam_type,
        scam_probability=risk_score / 100,
        summary=advice_result.get('summary', ''),
        primary_reason=explanation.get('primary_reason', ''),
        all_reasons=explanation.get('reasons', [])[:5],
        triggered_signals=triggered,
        top_words=top_words,
        advice=advice,
        input_language=input_language,
        was_translated=was_translated,
        hindi=hindi_exp,
        models_used=models_used,
        processing_time_ms=processing_time_ms
    )


# ── ENDPOINT 1: Text Analysis ─────────────────────────────────

@router.post(
    "/text",
    response_model=AnalysisResponse,
    summary="Analyze SMS or email text for scam",
    description="Submit SMS or email text to detect scam/phishing patterns"
)
async def analyze_text(
    request: TextAnalysisRequest,
    db: Session = Depends(get_db)
):
    """
    POST /analyze/text
    
    Accepts SMS or email text and returns:
    - Risk score (0-100)
    - Risk level (LOW/MEDIUM/HIGH/CRITICAL)
    - Explanation of why it's suspicious
    - Actionable advice
    """
    start_time = time.time()
    logger.info(f"Text analysis request: '{request.text[:50]}...'")

    try:
        # ── Language Detection & Translation ──────────────
        input_lang     = detect_language(request.text)
        was_translated = (input_lang == 'hi')

        if was_translated:
            english_text = translate_to_english(request.text, 'hi')
        else:
            english_text = request.text

        # ── Text Model Predictions ────────────────────────
        text_preds = text_classifier.predict(english_text)

        # ── URL Detection in Text ─────────────────────────
        import re
        urls_in_text = re.findall(
            r'http[s]?://\S+|www\.\S+|bit\.ly/\S+', 
            request.text, re.IGNORECASE
        )
        
        url_proba   = None
        url_features = None
        
        if urls_in_text:
            url_result  = url_classifier.predict(urls_in_text[0])
            url_proba   = url_result['url_proba']
            url_features = url_result['features']

        # ── Ensemble Score ────────────────────────────────
        ensemble = calculate_ensemble_score(
            text_proba_lr=text_preds.get('lr_proba'),
            text_proba_xgb=text_preds.get('xgb_proba'),
            text_proba_bert=text_preds.get('bert_proba'),
            url_proba=url_proba
        )

        # ── SHAP Explanation ──────────────────────────────
        shap_result = text_classifier.get_shap_explanation(english_text)

        # ── Reason + Advice Generation ────────────────────
        explanation  = generate_reasons(
            shap_result,
            text_preds.get('cleaned_text', english_text),
            ensemble['risk_score'],
            url_features
        )
        advice_result = generate_advice(
            explanation['scam_type'],
            ensemble['risk_level'],
            ensemble['risk_score']
        )

        processing_time = (time.time() - start_time) * 1000

        return _build_response(
            input_type='text',
            input_preview=request.text[:200],
            ensemble_result=ensemble,
            explanation=explanation,
            advice_result=advice_result,
            shap_result=shap_result,
            input_language=input_lang,
            was_translated=was_translated,
            processing_time_ms=round(processing_time, 2),
            include_hindi=request.include_hindi_explanation,
            db=db
        )

    except Exception as e:
        logger.error(f"Text analysis error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )


# ── ENDPOINT 2: URL Analysis ──────────────────────────────────

@router.post(
    "/url",
    response_model=AnalysisResponse,
    summary="Analyze URL for phishing"
)
async def analyze_url(
    request: URLAnalysisRequest,
    db: Session = Depends(get_db)
):
    """POST /analyze/url"""
    start_time = time.time()
    logger.info(f"URL analysis: {request.url}")

    try:
        # URL prediction
        url_result   = url_classifier.predict(request.url)
        url_proba    = url_result['url_proba']
        url_features = url_result['features']

        # Ensemble (URL only)
        ensemble = calculate_ensemble_score(url_proba=url_proba)

        # Generate explanation
        shap_result  = {'top_scam_words': [], 'top_legit_words': []}
        explanation  = generate_reasons(
            shap_result, request.url,
            ensemble['risk_score'], url_features
        )
        advice_result = generate_advice(
            explanation['scam_type'],
            ensemble['risk_level'],
            ensemble['risk_score']
        )

        processing_time = (time.time() - start_time) * 1000

        return _build_response(
            input_type='url',
            input_preview=request.url,
            ensemble_result=ensemble,
            explanation=explanation,
            advice_result=advice_result,
            shap_result=shap_result,
            input_language='en',
            was_translated=False,
            processing_time_ms=round(processing_time, 2),
            db=db
        )

    except Exception as e:
        logger.error(f"URL analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── ENDPOINT 3: Image Analysis ────────────────────────────────

@router.post(
    "/image",
    response_model=AnalysisResponse,
    summary="Analyze screenshot for scam text"
)
async def analyze_image(
    file: UploadFile = File(..., description="Screenshot image file"),
    include_hindi: bool = Form(default=False),
    db: Session = Depends(get_db)
):
    """POST /analyze/image"""
    start_time = time.time()
    logger.info(f"Image analysis: {file.filename}")

    # Validate file type
    allowed = {'image/jpeg', 'image/png', 'image/jpg', 'image/webp'}
    if file.content_type not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {file.content_type}. Allowed: JPEG, PNG, WebP"
        )

    # Validate file size
    max_bytes = settings.max_file_size_mb * 1024 * 1024
    contents  = await file.read()
    if len(contents) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Max {settings.max_file_size_mb}MB"
        )

    try:
        # Load image
        image = Image.open(io.BytesIO(contents))

        # Extract text via OCR
        ocr_result = image_analyzer.extract_text(image)
        extracted_text = ocr_result['text']

        if not extracted_text or len(extracted_text.strip()) < 3:
            raise HTTPException(
                status_code=422,
                detail="Could not extract text from image. Please ensure image is clear."
            )

        # Now analyze extracted text (same as /analyze/text)
        input_lang = detect_language(extracted_text)
        if input_lang == 'hi':
            english_text = translate_to_english(extracted_text, 'hi')
        else:
            english_text = extracted_text

        text_preds  = text_classifier.predict(english_text)
        ensemble    = calculate_ensemble_score(
            text_proba_lr=text_preds.get('lr_proba'),
            text_proba_xgb=text_preds.get('xgb_proba'),
        )
        shap_result  = text_classifier.get_shap_explanation(english_text)
        explanation  = generate_reasons(
            shap_result,
            text_preds.get('cleaned_text', english_text),
            ensemble['risk_score']
        )
        advice_result = generate_advice(
            explanation['scam_type'],
            ensemble['risk_level'],
            ensemble['risk_score']
        )

        processing_time = (time.time() - start_time) * 1000

        return _build_response(
            input_type='image',
            input_preview=f"[IMAGE: {file.filename}] {extracted_text[:150]}",
            ensemble_result=ensemble,
            explanation=explanation,
            advice_result=advice_result,
            shap_result=shap_result,
            input_language=input_lang,
            was_translated=(input_lang == 'hi'),
            processing_time_ms=round(processing_time, 2),
            include_hindi=include_hindi,
            db=db
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Image analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── ENDPOINT 4: Voice Analysis ────────────────────────────────

@router.post(
    "/voice",
    response_model=AnalysisResponse,
    summary="Analyze voice input (transcribed text)"
)
async def analyze_voice(
    audio_file: Optional[UploadFile] = File(default=None),
    transcribed_text: Optional[str]  = Form(default=None),
    db: Session = Depends(get_db)
):
    """
    POST /analyze/voice
    
    Accepts EITHER:
    1. audio_file: Audio file → Whisper STT → text analysis
    2. transcribed_text: Already transcribed text (from Web Speech API)
    """
    start_time = time.time()

    final_text = None

    # ── Option A: Use pre-transcribed text ────────────────
    if transcribed_text:
        final_text = transcribed_text
        logger.info(f"Voice analysis (pre-transcribed): '{final_text[:50]}'")

    # ── Option B: Transcribe audio with Whisper ───────────
    elif audio_file:
        logger.info(f"Voice analysis (audio file): {audio_file.filename}")
        try:
            import whisper
            contents  = await audio_file.read()
            
            # Save temporarily for Whisper
            import tempfile
            import os
            with tempfile.NamedTemporaryFile(
                suffix='.wav', delete=False
            ) as tmp:
                tmp.write(contents)
                tmp_path = tmp.name

            # Load Whisper model (base = fast, good enough)
            whisper_model = whisper.load_model("base")
            result        = whisper_model.transcribe(tmp_path)
            final_text    = result['text']
            os.unlink(tmp_path)  # Delete temp file

            logger.info(f"Whisper transcribed: '{final_text[:50]}'")

        except Exception as e:
            logger.error(f"Whisper transcription failed: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Audio transcription failed: {str(e)}"
            )
    else:
        raise HTTPException(
            status_code=400,
            detail="Provide either audio_file or transcribed_text"
        )

    if not final_text or len(final_text.strip()) < 3:
        raise HTTPException(
            status_code=422,
            detail="Could not extract meaningful text from voice input"
        )

    # ── Analyze the transcribed text ──────────────────────
    input_lang = detect_language(final_text)
    if input_lang == 'hi':
        english_text = translate_to_english(final_text, 'hi')
    else:
        english_text = final_text

    text_preds   = text_classifier.predict(english_text)
    ensemble     = calculate_ensemble_score(
        text_proba_lr=text_preds.get('lr_proba'),
        text_proba_xgb=text_preds.get('xgb_proba'),
    )
    shap_result  = text_classifier.get_shap_explanation(english_text)
    explanation  = generate_reasons(
        shap_result,
        text_preds.get('cleaned_text', english_text),
        ensemble['risk_score']
    )
    advice_result = generate_advice(
        explanation['scam_type'],
        ensemble['risk_level'],
        ensemble['risk_score']
    )

    processing_time = (time.time() - start_time) * 1000

    return _build_response(
        input_type='voice',
        input_preview=f"[VOICE] {final_text[:150]}",
        ensemble_result=ensemble,
        explanation=explanation,
        advice_result=advice_result,
        shap_result=shap_result,
        input_language=input_lang,
        was_translated=(input_lang == 'hi'),
        processing_time_ms=round(processing_time, 2),
        db=db
    )