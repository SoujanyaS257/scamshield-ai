"""
ScamShield AI — Ensemble Risk Scorer
Combines all model outputs into final 0-100 risk score.
"""

import json
import os
from loguru import logger
from app.config import settings

RISK_LEVELS = {
    'LOW':      (0,  25,  '#2ecc71', '✅'),
    'MEDIUM':   (26, 50,  '#f39c12', '⚠️'),
    'HIGH':     (51, 75,  '#e67e22', '🚨'),
    'CRITICAL': (76, 100, '#e74c3c', '🔴'),
}

DEFAULT_WEIGHTS = {
    'distilbert':   0.40,
    'xgboost_text': 0.25,
    'url_model':    0.25,
    'lr_text':      0.10,
}


def get_risk_level(score: float) -> tuple:
    for level, (low, high, color, emoji) in RISK_LEVELS.items():
        if low <= score <= high:
            return level, color, emoji
    return 'CRITICAL', '#e74c3c', '🔴'


def calculate_ensemble_score(
    text_proba_lr=None,
    text_proba_xgb=None,
    text_proba_bert=None,
    url_proba=None
) -> dict:
    """
    Calculate weighted ensemble risk score from model probabilities.
    Handles missing inputs gracefully.
    """
    weights      = DEFAULT_WEIGHTS.copy()
    weighted_sum = 0.0
    total_weight = 0.0
    contributions = {}
    models_used   = []

    if text_proba_bert is not None:
        w = weights['distilbert']
        weighted_sum += text_proba_bert * w
        total_weight += w
        contributions['DistilBERT']  = round(float(text_proba_bert), 4)
        models_used.append('DistilBERT')

    if text_proba_xgb is not None:
        w = weights['xgboost_text']
        weighted_sum += text_proba_xgb * w
        total_weight += w
        contributions['XGBoost Text'] = round(float(text_proba_xgb), 4)
        models_used.append('XGBoost-Text')

    if url_proba is not None:
        w = weights['url_model']
        weighted_sum += url_proba * w
        total_weight += w
        contributions['URL Model'] = round(float(url_proba), 4)
        models_used.append('URL-XGBoost')

    if text_proba_lr is not None:
        w = weights['lr_text']
        weighted_sum += text_proba_lr * w
        total_weight += w
        contributions['Logistic Regression'] = round(float(text_proba_lr), 4)
        models_used.append('Logistic-Regression')

    if total_weight == 0:
        return {
            'risk_score':    0.0,
            'risk_level':    'LOW',
            'risk_color':    '#2ecc71',
            'risk_emoji':    '✅',
            'confidence':    'No models',
            'models_used':   [],
            'contributions': {}
        }

    normalized = weighted_sum / total_weight
    risk_score  = round(normalized * 100, 1)
    risk_level, risk_color, risk_emoji = get_risk_level(risk_score)

    n = len(models_used)
    confidence = 'High' if n >= 3 else 'Medium' if n == 2 else 'Low'

    return {
        'risk_score':    risk_score,
        'risk_level':    risk_level,
        'risk_color':    risk_color,
        'risk_emoji':    risk_emoji,
        'confidence':    confidence,
        'models_used':   models_used,
        'contributions': contributions
    }