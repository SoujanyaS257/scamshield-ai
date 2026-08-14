"""
ScamShield AI — Reason Generator Module
========================================
Converts ML predictions and SHAP values into
human-readable explanations.

Used by: FastAPI analyze endpoints
"""

import re
import json
import os
from typing import Optional

# ── Load configs from saved files ────────────────────────────
_MODULE_DIR  = os.path.dirname(os.path.abspath(__file__))
_MODELS_DIR  = os.path.join(
    os.path.dirname(os.path.dirname(_MODULE_DIR)), 
    'saved_models'
)

def _load_json(filename):
    """Load JSON config file from saved_models."""
    path = os.path.join(_MODELS_DIR, filename)
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

# Load configurations
SIGNAL_CATEGORIES  = _load_json('signal_categories.json').get('categories', {})
SCAM_ADVICE        = _load_json('scam_advice.json')
RISK_OPENINGS      = _load_json('risk_openings.json')
EMERGENCY_RESOURCES = _load_json('emergency_resources.json')


def generate_reasons(shap_explanation: dict, 
                     cleaned_text: str,
                     risk_score: float,
                     url_features: Optional[dict] = None) -> dict:
    """
    Generate human-readable reasons for scam prediction.
    
    Args:
        shap_explanation: SHAP output with top_scam_words
        cleaned_text:     Cleaned input text
        risk_score:       0-100 risk score
        url_features:     URL feature dict (optional)
    
    Returns:
        dict with triggered_signals, reasons, scam_type etc.
    """
    text_lower = cleaned_text.lower()
    
    shap_scam_words = set()
    if shap_explanation and 'top_scam_words' in shap_explanation:
        for item in shap_explanation['top_scam_words']:
            shap_scam_words.add(item['word'].lower())
    
    triggered = []
    
    for category_name, category_data in SIGNAL_CATEGORIES.items():
        keywords = category_data.get('keywords', [])
        text_match = any(kw in text_lower for kw in keywords)
        shap_match = any(kw in shap_scam_words for kw in keywords)
        
        if text_match or shap_match:
            triggered.append({
                'category': category_name,
                'reason':   category_data['reason'],
                'severity': category_data['severity'],
                'advice':   category_data['advice']
            })
    
    # URL-based signals
    if url_features:
        if url_features.get('has_ip_address'):
            triggered.append({
                'category': 'ip_url',
                'reason':   'IP address used as URL — very suspicious',
                'severity': 'CRITICAL',
                'advice':   'Never visit sites with IP addresses as URLs'
            })
        if url_features.get('is_suspicious_tld'):
            triggered.append({
                'category': 'suspicious_tld',
                'reason':   'Suspicious domain extension (.xyz, .tk etc.)',
                'severity': 'HIGH',
                'advice':   'Legitimate organizations use .com/.in/.gov.in'
            })
        if url_features.get('brand_in_subdomain_or_path'):
            triggered.append({
                'category': 'brand_impersonation_url',
                'reason':   'Brand name in URL path but not as official domain',
                'severity': 'CRITICAL',
                'advice':   'Verify the actual domain name carefully'
            })
    
    if not triggered:
        if risk_score > 50:
            triggered.append({
                'category': 'statistical_pattern',
                'reason':   'Statistical patterns similar to known scam messages',
                'severity': 'MEDIUM',
                'advice':   'Verify through official channels before acting'
            })
    
    severity_order = {'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3}
    triggered_sorted = sorted(
        triggered,
        key=lambda x: severity_order.get(x['severity'], 3)
    )
    
    primary_reason = (triggered_sorted[0]['reason'] 
                      if triggered_sorted else "Pattern analysis indicates risk")
    
    # Determine scam type
    scam_type = 'Unknown Scam'
    cat_names  = [t['category'] for t in triggered]
    
    if 'otp_request' in cat_names:
        scam_type = 'OTP/Credential Theft'
    elif 'upi_fraud' in cat_names:
        scam_type = 'UPI Payment Fraud'
    elif 'prize_lottery' in cat_names:
        scam_type = 'Lottery/Prize Scam'
    elif 'financial_lure' in cat_names and 'urgency' in cat_names:
        scam_type = 'Financial Fraud'
    elif 'impersonation' in cat_names:
        scam_type = 'Impersonation Scam'
    elif 'suspicious_url' in cat_names or 'ip_url' in cat_names:
        scam_type = 'Phishing Attack'
    elif 'personal_info_request' in cat_names:
        scam_type = 'Personal Data Theft'
    elif 'account_threat' in cat_names:
        scam_type = 'Account Takeover Attempt'
    
    severity_breakdown = {'CRITICAL': 0, 'HIGH': 0, 'MEDIUM': 0, 'LOW': 0}
    for t in triggered:
        sev = t.get('severity', 'LOW')
        severity_breakdown[sev] = severity_breakdown.get(sev, 0) + 1
    
    return {
        'triggered_signals':  triggered_sorted,
        'reasons':            [t['reason'] for t in triggered_sorted],
        'severity_breakdown': severity_breakdown,
        'primary_reason':     primary_reason,
        'scam_type':          scam_type,
        'signal_count':       len(triggered)
    }


def generate_advice(scam_type: str, 
                    risk_level: str,
                    risk_score: float) -> dict:
    """
    Generate actionable advice based on scam type and risk level.
    """
    advice_data = SCAM_ADVICE.get(scam_type, 
                                   SCAM_ADVICE.get('Unknown Scam', {
                                       'immediate': ['Do not engage with this message'],
                                       'preventive': ['Stay vigilant'],
                                       'report_to': ['cybercrime.gov.in']
                                   }))
    
    opening = RISK_OPENINGS.get(risk_level, 
                                  RISK_OPENINGS.get('MEDIUM', {})).get('en', '')
    
    if risk_score >= 76:
        summary = f"⚠️ SCAM ALERT: {scam_type} detected with {risk_score:.0f}% confidence"
    elif risk_score >= 51:
        summary = f"🔍 SUSPICIOUS: Possible {scam_type} — verify before acting"
    elif risk_score >= 26:
        summary = f"⚡ CAUTION: Some suspicious patterns detected"
    else:
        summary = f"✅ SAFE: Message appears legitimate (score: {risk_score:.0f}/100)"
    
    return {
        'opening':             opening,
        'immediate_actions':   advice_data.get('immediate', []),
        'preventive_measures': advice_data.get('preventive', []),
        'report_to':           advice_data.get('report_to', []),
        'summary':             summary,
        'emergency_number':    EMERGENCY_RESOURCES.get('cybercrime_helpline', '1930'),
        'portal':              EMERGENCY_RESOURCES.get('cybercrime_portal', 
                                                        'https://cybercrime.gov.in')
    }