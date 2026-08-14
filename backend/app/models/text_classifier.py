"""
ScamShield AI — Text Classifier Module
========================================
Loads trained models and provides prediction functions.

WHY A SEPARATE LOADER MODULE?
  Models are loaded ONCE at startup (expensive operation).
  Each request then uses the already-loaded model.
  Without this pattern, each request would reload models
  from disk → 10-30 seconds per request (unusable).
"""

import os
import re
import pickle
import numpy as np
from typing import Optional
from loguru import logger

from app.config import settings


class TextClassifier:
    """
    Manages text classification models.
    Loaded once at app startup via lifespan event.
    """

    def __init__(self):
        self.tfidf     = None
        self.lr_model  = None
        self.xgb_model = None
        self.bert_model    = None
        self.bert_tokenizer = None
        self.shap_explainer = None
        self.feature_names  = None
        self.is_loaded = False

    def load(self):
        """
        Load all text classification models from disk.
        Called once at application startup.
        """
        models_dir = settings.models_dir
        logger.info(f"Loading text models from: {models_dir}")

        try:
            # ── Load TF-IDF ───────────────────────────────
            tfidf_path = os.path.join(models_dir, 'tfidf_vectorizer.pkl')
            if os.path.exists(tfidf_path):
                with open(tfidf_path, 'rb') as f:
                    self.tfidf = pickle.load(f)
                self.feature_names = self.tfidf.get_feature_names_out()
                logger.info("  [OK] TF-IDF Vectorizer loaded")
            else:
                logger.warning(f"  [SKIP] TF-IDF not found: {tfidf_path}")

            # ── Load Logistic Regression ──────────────────
            lr_path = os.path.join(models_dir, 'text_classifier_lr.pkl')
            if os.path.exists(lr_path):
                with open(lr_path, 'rb') as f:
                    self.lr_model = pickle.load(f)
                logger.info("  [OK] Logistic Regression loaded")

            # ── Load XGBoost ──────────────────────────────
            xgb_path = os.path.join(models_dir, 'text_classifier_xgb.pkl')
            if os.path.exists(xgb_path):
                with open(xgb_path, 'rb') as f:
                    self.xgb_model = pickle.load(f)
                logger.info("  [OK] XGBoost loaded")

            # ── Load SHAP Explainer ───────────────────────
            shap_path = os.path.join(models_dir, 'shap_lr_explainer.pkl')
            if os.path.exists(shap_path):
                with open(shap_path, 'rb') as f:
                    self.shap_explainer = pickle.load(f)
                logger.info("  [OK] SHAP Explainer loaded")

            # ── Load DistilBERT (optional) ────────────────
            if settings.use_distilbert:
                self._load_distilbert(models_dir)

            self.is_loaded = True
            logger.info("Text classifier ready!")

        except Exception as e:
            logger.error(f"Error loading text models: {e}")
            raise

    def _load_distilbert(self, models_dir: str):
        """Load DistilBERT model (optional, memory intensive)."""
        try:
            from transformers import (
                DistilBertTokenizer,
                DistilBertForSequenceClassification
            )
            import torch

            bert_dir = os.path.join(models_dir, 'distilbert_finetuned')
            if os.path.exists(bert_dir):
                self.bert_tokenizer = DistilBertTokenizer.from_pretrained(bert_dir)
                self.bert_model     = DistilBertForSequenceClassification\
                                        .from_pretrained(bert_dir)
                self.bert_model.eval()
                logger.info("  [OK] DistilBERT loaded")
        except Exception as e:
            logger.warning(f"  [SKIP] DistilBERT failed to load: {e}")

    def _clean_text(self, text: str) -> str:
        """Basic text cleaning matching training preprocessing."""
        text = text.lower()
        text = re.sub(r'<[^>]+>', ' ', text)
        text = re.sub(r'http[s]?://\S+|www\.\S+', ' url_present ', text)
        text = re.sub(r'\b\d{10}\b', ' phone_present ', text)
        text = re.sub(r'rs\.?\s*\d+|₹\s*\d+', ' money_amount ', text)
        text = re.sub(r'[^a-zA-Z\s_]', ' ', text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text

    def predict(self, text: str) -> dict:
        """
        Run text through all available models.
        
        Args:
            text: Raw input text (any language)
        
        Returns:
            dict: {
                'lr_proba': float,
                'xgb_proba': float,
                'bert_proba': float or None,
                'cleaned_text': str
            }
        """
        if not self.is_loaded:
            raise RuntimeError("Models not loaded. Call load() first.")

        cleaned = self._clean_text(text)
        result  = {'cleaned_text': cleaned}

        # ── LR + XGBoost prediction ───────────────────────
        if self.tfidf is not None:
            vectorized = self.tfidf.transform([cleaned])

            if self.lr_model is not None:
                lr_proba = self.lr_model.predict_proba(vectorized)[0][1]
                result['lr_proba'] = float(lr_proba)

            if self.xgb_model is not None:
                xgb_proba = self.xgb_model.predict_proba(vectorized)[0][1]
                result['xgb_proba'] = float(xgb_proba)

        # ── DistilBERT prediction (if loaded) ─────────────
        if self.bert_model is not None and self.bert_tokenizer is not None:
            result['bert_proba'] = self._bert_predict(text)

        return result

    def _bert_predict(self, text: str) -> float:
        """Run DistilBERT inference."""
        import torch
        encoding = self.bert_tokenizer(
            text,
            max_length=128,
            padding='max_length',
            truncation=True,
            return_tensors='pt'
        )
        with torch.no_grad():
            outputs = self.bert_model(**encoding)
            proba   = torch.softmax(outputs.logits, dim=-1)
            return float(proba[0][1].item())

    def get_shap_explanation(self, text: str) -> dict:
        """Get SHAP word-level explanation."""
        if self.tfidf is None or self.shap_explainer is None:
            return {'top_scam_words': [], 'top_legit_words': []}

        cleaned    = self._clean_text(text)
        vectorized = self.tfidf.transform([cleaned])

        try:
            shap_vals     = self.shap_explainer.shap_values(vectorized)
            shap_array    = shap_vals[0]
            text_features = vectorized.toarray()[0]
            present_mask  = text_features != 0

            present_features = self.feature_names[present_mask]
            present_shap     = shap_array[present_mask]
            sorted_order     = np.argsort(present_shap)[::-1]

            top_scam_words = []
            for idx in sorted_order:
                if present_shap[idx] > 0 and len(top_scam_words) < 10:
                    top_scam_words.append({
                        'word':       str(present_features[idx]),
                        'shap_value': float(present_shap[idx]),
                        'impact':     'scam'
                    })

            top_legit_words = []
            for idx in sorted_order[::-1]:
                if present_shap[idx] < 0 and len(top_legit_words) < 5:
                    top_legit_words.append({
                        'word':       str(present_features[idx]),
                        'shap_value': float(present_shap[idx]),
                        'impact':     'legitimate'
                    })

            return {
                'top_scam_words':  top_scam_words,
                'top_legit_words': top_legit_words
            }

        except Exception as e:
            logger.warning(f"SHAP explanation failed: {e}")
            return {'top_scam_words': [], 'top_legit_words': []}


# ── Module-level singleton ─────────────────────────────────────
text_classifier = TextClassifier()