"""
ScamShield AI — URL Classifier Module
"""

import os
import re
import pickle
import json
import numpy as np
from urllib.parse import urlparse
import tldextract
from loguru import logger
from app.config import settings


SUSPICIOUS_TLDS = {
    'xyz', 'tk', 'ml', 'ga', 'cf', 'gq', 'pw', 'top',
    'loan', 'click', 'download', 'racing', 'review',
    'country', 'stream', 'gdn', 'win', 'bid'
}

LEGITIMATE_BRANDS = [
    'google', 'facebook', 'amazon', 'paypal', 'apple',
    'microsoft', 'netflix', 'sbi', 'hdfc', 'icici',
    'paytm', 'phonepe', 'flipkart', 'irctc', 'uidai'
]

URGENCY_WORDS_IN_URL = [
    'verify', 'secure', 'update', 'confirm', 'login',
    'suspend', 'block', 'validate', 'urgent', 'alert',
    'prize', 'winner', 'claim', 'free', 'lucky', 'kyc'
]


class URLClassifier:
    """URL phishing detection model."""

    def __init__(self):
        self.model     = None
        self.is_loaded = False

    def load(self):
        models_dir = settings.models_dir
        model_path = os.path.join(models_dir, 'url_classifier_xgb.pkl')

        if os.path.exists(model_path):
            with open(model_path, 'rb') as f:
                self.model = pickle.load(f)
            self.is_loaded = True
            logger.info("  [OK] URL Classifier loaded")
        else:
            logger.warning(f"  [SKIP] URL model not found: {model_path}")

    def extract_features(self, url: str) -> dict:
        """Extract 25 structural features from a URL."""
        try:
            parsed    = urlparse(url)
            extracted = tldextract.extract(url)
        except Exception:
            return {f'feature_{i}': 0 for i in range(25)}

        scheme    = parsed.scheme.lower()
        domain    = extracted.domain.lower()
        suffix    = extracted.suffix.lower()
        subdomain = extracted.subdomain.lower()
        path      = parsed.path.lower()
        full_url  = url.lower()

        subdomains = [s for s in subdomain.split('.') if s and s != 'www']
        brand_in_url    = any(b in full_url for b in LEGITIMATE_BRANDS)
        brand_is_domain = any(b == domain for b in LEGITIMATE_BRANDS)
        urgency_count   = sum(1 for w in URGENCY_WORDS_IN_URL if w in full_url)

        features = {
            'url_length':         len(url),
            'domain_length':      len(domain),
            'path_length':        len(path),
            'subdomain_length':   len(subdomain),
            'uses_https':         1 if scheme == 'https' else 0,
            'uses_http':          1 if scheme == 'http' else 0,
            'has_ip_address':     1 if re.match(r'^(\d{1,3}\.){3}\d{1,3}$',
                                                parsed.netloc) else 0,
            'dot_count':          url.count('.'),
            'dash_count':         url.count('-'),
            'slash_count':        url.count('/'),
            'at_count':           url.count('@'),
            'question_count':     url.count('?'),
            'equals_count':       url.count('='),
            'underscore_count':   url.count('_'),
            'digit_count':        sum(c.isdigit() for c in url),
            'digit_ratio':        sum(c.isdigit() for c in url) / max(len(url), 1),
            'subdomain_count':    len(subdomains),
            'has_multiple_subdomains': 1 if len(subdomains) >= 2 else 0,
            'is_suspicious_tld':  1 if suffix in SUSPICIOUS_TLDS else 0,
            'is_gov_domain':      1 if 'gov' in suffix else 0,
            'brand_in_subdomain_or_path': 1 if (brand_in_url and not brand_is_domain) else 0,
            'urgency_word_count': urgency_count,
            'has_urgency_words':  1 if urgency_count > 0 else 0,
            'is_url_shortener':   1 if any(s in full_url
                                           for s in ['bit.ly', 'tinyurl',
                                                     'goo.gl', 't.co']) else 0,
            'has_hex_encoding':   1 if '%' in url else 0,
        }
        return features

    def predict(self, url: str) -> dict:
        """
        Predict if URL is phishing.
        Returns probability and feature dict.
        """
        features     = self.extract_features(url)
        feature_vals = list(features.values())

        if self.model is not None:
            feat_array = np.array(feature_vals).reshape(1, -1)
            proba      = self.model.predict_proba(feat_array)[0][1]
        else:
            # Heuristic fallback if model not loaded
            proba = self._heuristic_score(features)

        return {
            'url_proba':  float(proba),
            'features':   features,
            'is_loaded':  self.is_loaded
        }

    def _heuristic_score(self, features: dict) -> float:
        """Simple rule-based fallback when model unavailable."""
        score = 0.1
        if features.get('has_ip_address'):       score += 0.4
        if features.get('is_suspicious_tld'):    score += 0.3
        if features.get('brand_in_subdomain_or_path'): score += 0.3
        if features.get('has_multiple_subdomains'): score += 0.15
        if features.get('has_urgency_words'):    score += 0.2
        if not features.get('uses_https'):       score += 0.1
        return min(score, 0.99)


url_classifier = URLClassifier()