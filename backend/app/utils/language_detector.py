"""
ScamShield AI — Language Detector & Translator
================================================
Handles Hindi/English detection and translation.
Uses deep-translator (stable replacement for googletrans).
"""

from langdetect import detect, DetectorFactory
from deep_translator import GoogleTranslator

DetectorFactory.seed = 42  # Reproducible detection


def detect_language(text: str) -> str:
    """
    Detect whether text is Hindi or English.
    Returns 'hi', 'en', or 'unknown'.
    """
    try:
        if not text or len(text.strip()) < 10:
            return 'en'
        
        # Check for Devanagari script
        hindi_chars = sum(1 for c in text if '\u0900' <= c <= '\u097F')
        if hindi_chars > 3:
            return 'hi'
        
        detected = detect(text)
        return detected if detected in ['hi', 'en'] else 'en'
    
    except Exception:
        return 'en'


def translate_to_english(text: str, source_lang: str) -> str:
    """Translate text to English for model processing."""
    if source_lang == 'en':
        return text
    try:
        return GoogleTranslator(source=source_lang, target='en').translate(text) or text
    except Exception:
        return text


def translate_to_hindi(text: str) -> str:
    """Translate English text to Hindi for output."""
    try:
        return GoogleTranslator(source='en', target='hi').translate(text) or text
    except Exception:
        return text