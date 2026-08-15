"""
ScamShield AI — Voice Processor Module
========================================
Handles speech-to-text conversion.

TWO APPROACHES (both implemented):
─────────────────────────────────────
Approach A: Web Speech API (browser-side)
  - Browser records and transcribes audio
  - Sends transcribed TEXT to our API
  - No server processing needed
  - Works offline, zero cost
  - Used in frontend (Phase 5)

Approach B: OpenAI Whisper (server-side)
  - Browser sends raw AUDIO FILE to our API
  - Our server transcribes using Whisper
  - Better accuracy, supports Hindi
  - Works when browser API unavailable
  - Implemented here

The /analyze/voice endpoint in analyze.py
already handles both approaches.
This module provides the Whisper wrapper.
"""

import os
import tempfile
import time
from loguru import logger


class VoiceProcessor:
    """
    Server-side speech-to-text using OpenAI Whisper.
    
    Whisper is a free, open-source model that runs locally.
    No API key needed. Supports 99 languages including Hindi.
    
    Model sizes (tradeoff: accuracy vs speed):
      tiny   → fastest, least accurate (~1GB RAM)
      base   → good balance (~1GB RAM) ← we use this
      small  → better accuracy (~2GB RAM)
      medium → great accuracy (~5GB RAM)
      large  → best accuracy (~10GB RAM)
    """

    def __init__(self, model_size: str = "base"):
        self.model      = None
        self.model_size = model_size
        self.is_loaded  = False

    def load(self):
        """
        Load Whisper model into memory.
        Called at app startup via lifespan.
        
        First run downloads model weights (~150MB for base).
        Subsequent runs load from local cache.
        """
        try:
            import whisper
            logger.info(f"  Loading Whisper model: {self.model_size}...")
            self.model     = whisper.load_model(self.model_size)
            self.is_loaded = True
            logger.info(f"  [OK] Whisper '{self.model_size}' loaded")
        except ImportError:
            logger.warning(
                "  [SKIP] openai-whisper not installed. "
                "Voice via audio file won't work. "
                "Web Speech API (browser) still works."
            )
        except Exception as e:
            logger.warning(f"  [SKIP] Whisper load failed: {e}")

    def transcribe_file(self, audio_bytes: bytes,
                        file_extension: str = ".wav") -> dict:
        """
        Transcribe audio bytes to text using Whisper.

        Args:
            audio_bytes:    Raw audio file content (bytes)
            file_extension: File type e.g. '.wav', '.mp3', '.m4a'

        Returns:
            dict: {
                'text':        Transcribed text string,
                'language':    Detected language code ('en', 'hi' etc),
                'confidence':  Approximate confidence (0-1),
                'duration_s':  Audio duration in seconds,
                'error':       None or error message string
            }
        """

        if not self.is_loaded or self.model is None:
            return {
                'text':       '',
                'language':   'en',
                'confidence': 0.0,
                'duration_s': 0.0,
                'error':      'Whisper model not loaded'
            }

        tmp_path = None
        try:
            # Save bytes to a temporary file
            # Whisper needs a file path, not raw bytes
            with tempfile.NamedTemporaryFile(
                suffix=file_extension,
                delete=False
            ) as tmp:
                tmp.write(audio_bytes)
                tmp_path = tmp.name

            start = time.time()

            # Transcribe
            # language=None → auto-detect language
            # fp16=False    → use float32 (required for CPU)
            result = self.model.transcribe(
                tmp_path,
                language=None,
                fp16=False,
                verbose=False
            )

            duration = time.time() - start

            transcribed_text = result.get('text', '').strip()
            detected_lang    = result.get('language', 'en')

            # Whisper doesn't give direct confidence scores
            # We approximate from segment no_speech_prob values
            segments = result.get('segments', [])
            if segments:
                avg_no_speech = sum(
                    s.get('no_speech_prob', 0) for s in segments
                ) / len(segments)
                confidence = round(1.0 - avg_no_speech, 3)
            else:
                confidence = 0.8 if transcribed_text else 0.0

            logger.info(
                f"  Whisper transcribed {len(transcribed_text)} chars "
                f"in {duration:.1f}s | lang={detected_lang}"
            )

            return {
                'text':       transcribed_text,
                'language':   detected_lang,
                'confidence': confidence,
                'duration_s': round(duration, 2),
                'error':      None
            }

        except Exception as e:
            logger.error(f"Whisper transcription error: {e}")
            return {
                'text':       '',
                'language':   'en',
                'confidence': 0.0,
                'duration_s': 0.0,
                'error':      str(e)
            }

        finally:
            # Always delete the temp file
            if tmp_path and os.path.exists(tmp_path):
                try:
                    os.unlink(tmp_path)
                except Exception:
                    pass

    def transcribe_bytes_direct(self, audio_bytes: bytes) -> str:
        """
        Simplified wrapper — returns just the text string.
        Used by the /analyze/voice endpoint.

        Args:
            audio_bytes: Raw audio content

        Returns:
            str: Transcribed text or empty string on failure
        """
        result = self.transcribe_file(audio_bytes)
        return result.get('text', '')


# ── Module-level singleton ─────────────────────────────────────
# Loaded once at app startup
voice_processor = VoiceProcessor(model_size="base")