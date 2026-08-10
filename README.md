# 🛡️ ScamShield AI

> A Multimodal AI-powered Scam and Phishing Detection Assistant

[![Python](https://img.shields.io/badge/Python-3.11-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-green.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 📌 Problem Statement

People cannot identify whether a message, email, URL, or screenshot is a scam 
or phishing attempt. This causes money loss, account hacking, identity theft, 
and UPI/OTP fraud in India.

## 💡 Solution

ScamShield AI is a multimodal, explainable scam detection assistant that:

- ✅ Accepts **email text, SMS, URLs, screenshots, and voice input**
- ✅ Uses **ML models** (DistilBERT, XGBoost, Random Forest) to predict scam probability
- ✅ Uses **SHAP** to explain *WHY* something is suspicious
- ✅ Guides users on **what to do next**
- ✅ Supports **Hindi + English** (multilingual)
- ✅ Shows **scam trend dashboard**

## 🏗️ Architecture

User Input → FastAPI Backend → ML Models → Ensemble Scorer
→ SHAP Explainer → JSON Response → React Frontend


## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, Tailwind CSS, Recharts |
| Backend | FastAPI, Python 3.11, Uvicorn |
| ML Models | DistilBERT, XGBoost, Random Forest, TF-IDF |
| Explainability | SHAP |
| OCR | EasyOCR |
| Speech-to-Text | OpenAI Whisper |
| Database | PostgreSQL, SQLAlchemy |
| Deployment | Docker, Railway, Vercel |

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/scamshield-ai.git
cd scamshield-ai

# Create virtual environment
python -m venv scamshield-env
scamshield-env\Scripts\activate  # Windows
source scamshield-env/bin/activate  # Linux/Mac

# Install dependencies
pip install -r backend/requirements.txt

# Run backend
cd backend
uvicorn app.main:app --reload

# Run frontend (in new terminal)
cd frontend
npm install
npm start

📊 Model Performance
Model	                     Accuracy	F1 Score	ROC-AUC
TF-IDF + Logistic Regression	-	       -	       -
TF-IDF + XGBoost	            -	       -	       -
DistilBERT Fine-tuned	        -	       -	       -

📁 Project Structure
See docs/architecture.md for detailed structure.

👨‍💻 Author
Soujanya — GitHub 


