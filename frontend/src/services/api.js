/**
 * ScamShield AI — API Service
 * ============================
 * Single file for ALL backend communication.
 *
 * WHY A DEDICATED SERVICE FILE?
 *   - If backend URL changes, update ONE place
 *   - Components never hardcode URLs
 *   - All error handling in one place
 *   - Easy to mock during testing
 *
 * HOW AXIOS INTERCEPTORS WORK:
 *   Request interceptor  → runs BEFORE every request
 *   Response interceptor → runs AFTER every response
 *   Think of them as middleware for HTTP calls
 */

import axios from 'axios'

// ── Base URL ──────────────────────────────────────────────────
// import.meta.env is Vite's way of reading .env variables
// VITE_ prefix is REQUIRED — Vite strips other env vars for security
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// ── Create Axios Instance ─────────────────────────────────────
// Instead of using axios directly, we create a configured instance
// This instance has our defaults pre-applied
const api = axios.create({
  baseURL: BASE_URL,
  // 60 second timeout — ML inference can be slow on CPU
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ── Request Interceptor ───────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    // Log every outgoing request during development
    if (import.meta.env.DEV) {
      console.log(
        `🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`
      )
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response Interceptor ──────────────────────────────────────
api.interceptors.response.use(
  // Success: just return the response as-is
  (response) => response,

  // Error: extract a clean message and reject
  (error) => {
    // FastAPI returns errors in error.response.data.detail
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'Something went wrong. Please try again.'

    if (import.meta.env.DEV) {
      console.error('❌ API Error:', message, error.response?.status)
    }

    // Reject with a clean object instead of raw axios error
    return Promise.reject({
      message,
      status: error.response?.status,
    })
  }
)

// ═════════════════════════════════════════════════════════════
// API FUNCTIONS
// Each function = one backend endpoint
// ═════════════════════════════════════════════════════════════

/**
 * Analyze SMS or email text for scam patterns
 *
 * @param {string}  text         - Raw text to analyze
 * @param {boolean} includeHindi - Also return Hindi explanation
 * @returns {Promise<object>}    - AnalysisResponse from backend
 */
export const analyzeText = async (text, includeHindi = false) => {
  const response = await api.post('/analyze/text', {
    text,
    language: 'auto',                        // Auto-detect Hindi/English
    include_hindi_explanation: includeHindi,
  })
  return response.data
}

/**
 * Analyze a URL for phishing indicators
 *
 * @param {string} url        - URL to analyze
 * @returns {Promise<object>} - AnalysisResponse from backend
 */
export const analyzeURL = async (url) => {
  const response = await api.post('/analyze/url', { url })
  return response.data
}

/**
 * Analyze a screenshot image for scam text
 * Uses multipart/form-data (not JSON) because we're sending a file
 *
 * @param {File} imageFile    - Image File object from browser
 * @returns {Promise<object>} - AnalysisResponse from backend
 */
export const analyzeImage = async (imageFile) => {
  const formData = new FormData()
  formData.append('file', imageFile)
  formData.append('include_hindi', 'false')

  const response = await api.post('/analyze/image', formData, {
    // Override Content-Type for file upload
    // axios sets the correct multipart boundary automatically
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 90000, // OCR takes longer than text analysis
  })
  return response.data
}

/**
 * Analyze voice input
 * Accepts EITHER a transcribed string OR an audio File
 *
 * @param {string|File} input - Transcribed text OR audio file
 * @returns {Promise<object>} - AnalysisResponse from backend
 */
export const analyzeVoice = async (input) => {
  const formData = new FormData()

  if (typeof input === 'string') {
    // From Web Speech API — browser already transcribed it
    formData.append('transcribed_text', input)
  } else {
    // Raw audio file — server will transcribe with Whisper
    formData.append('audio_file', input)
  }

  const response = await api.post('/analyze/voice', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

/**
 * Get scam trend dashboard data
 *
 * @returns {Promise<object>} - DashboardResponse from backend
 */
export const getDashboard = async () => {
  const response = await api.get('/dashboard/')
  return response.data
}

/**
 * Submit user feedback on analysis accuracy
 *
 * @param {string}  analysisId - UUID from the analysis response
 * @param {boolean} isCorrect  - Was our prediction correct?
 * @param {string}  comment    - Optional user comment
 * @returns {Promise<object>}  - FeedbackResponse from backend
 */
export const submitFeedback = async (
  analysisId,
  isCorrect,
  comment = ''
) => {
  const response = await api.post('/feedback/', {
    analysis_id: analysisId,
    is_correct: isCorrect,
    comment,
  })
  return response.data
}

/**
 * Check if backend is online
 *
 * @returns {Promise<object>} - Health status from backend
 */
export const checkHealth = async () => {
  const response = await api.get('/health')
  return response.data
}

export default api