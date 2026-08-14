"""
ScamShield AI — Image Analyzer Module
Pipeline: Screenshot → OCR → Text Classifier
"""

import re
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance
import cv2
from loguru import logger


class ImageAnalyzer:
    """OCR-based image analysis."""

    def __init__(self):
        self.reader    = None
        self.is_loaded = False

    def load(self):
        """Load EasyOCR reader."""
        try:
            import easyocr
            self.reader    = easyocr.Reader(['en', 'hi'], gpu=False)
            self.is_loaded = True
            logger.info("  [OK] EasyOCR loaded (EN + HI)")
        except Exception as e:
            logger.warning(f"  [SKIP] EasyOCR failed: {e}")

    def preprocess(self, image: Image.Image) -> np.ndarray:
        """Preprocess image for better OCR accuracy."""
        image = image.convert('RGB')
        w, h  = image.size

        if w < 300 or h < 300:
            scale = max(300/w, 300/h)
            image = image.resize((int(w*scale), int(h*scale)), Image.LANCZOS)

        image = ImageEnhance.Contrast(image).enhance(1.5)
        image = image.filter(ImageFilter.SHARPEN)

        arr      = np.array(image)
        gray     = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY)
        denoised = cv2.fastNlMeansDenoising(gray, h=10)
        binary   = cv2.adaptiveThreshold(
            denoised, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY, 11, 2
        )
        return binary

    def extract_text(self, image: Image.Image) -> dict:
        """
        Extract text from image using OCR.
        Returns extracted text and confidence.
        """
        if not self.is_loaded:
            return {
                'text': '',
                'confidence': 0.0,
                'word_count': 0,
                'error': 'OCR not loaded'
            }

        try:
            processed = self.preprocess(image)
            results   = self.reader.readtext(
                processed,
                detail=1,
                paragraph=False,
                min_size=10,
                text_threshold=0.7,
            )

            texts       = []
            confidences = []

            for (_, text, conf) in results:
                if conf >= 0.5:
                    texts.append(text.strip())
                    confidences.append(conf)

            full_text = ' '.join(texts)
            full_text = re.sub(r'\s+', ' ', full_text).strip()

            return {
                'text':       full_text,
                'confidence': float(np.mean(confidences)) if confidences else 0.0,
                'word_count': len(full_text.split()),
                'error':      None
            }

        except Exception as e:
            logger.error(f"OCR error: {e}")
            return {
                'text': '',
                'confidence': 0.0,
                'word_count': 0,
                'error': str(e)
            }


image_analyzer = ImageAnalyzer()