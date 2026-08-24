/**
 * HomePage.jsx — Main analysis page
 *
 * This is the orchestrator. It:
 *  1. Renders InputTabs (collects user input)
 *  2. Calls the correct API function based on input type
 *  3. Shows LoadingSpinner while waiting
 *  4. Renders RiskGauge + ExplanationCard + AdviceCard with results
 *  5. Handles errors clearly
 *  6. Collects user feedback
 *
 * STATE FLOW:
 *  user types → InputTabs → handleAnalyze()
 *  → setLoading(true) → api call
 *  → setResult(response) → render results
 *  → user clicks feedback → submitFeedback()
 */

import { useState, useRef }  from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import InputTabs       from '../components/InputTabs.jsx'
import RiskGauge       from '../components/RiskGauge.jsx'
import ExplanationCard from '../components/ExplanationCard.jsx'
import AdviceCard      from '../components/AdviceCard.jsx'
import LoadingSpinner  from '../components/LoadingSpinner.jsx'

import {
  analyzeText,
  analyzeURL,
  analyzeImage,
  analyzeVoice,
  submitFeedback,
} from '../services/api.js'

// ── Loading messages per input type ───────────────────────────
const LOADING_MESSAGES = {
  text:  { main: 'Analyzing text...',       sub: 'Running NLP models on your message'     },
  url:   { main: 'Checking URL...',         sub: 'Extracting and analyzing URL features'  },
  image: { main: 'Scanning screenshot...',  sub: 'Running OCR then scam detection'        },
  voice: { main: 'Analyzing voice input...',sub: 'Processing transcribed text'            },
}

// ── Feature tags shown in hero section ────────────────────────
const FEATURE_TAGS = [
  '✅ Explains WHY',
  '🇮🇳 Hindi + English',
  '🖼️ OCR Screenshots',
  '🎤 Voice Input',
  '🔗 URL Scanner',
  '📊 SHAP AI',
]


export default function HomePage() {
  // ── State ────────────────────────────────────────────────
  const [result,      setResult]      = useState(null)
  const [loading,     setLoading]     = useState(false)
  const [inputType,   setInputType]   = useState('text')
  const [error,       setError]       = useState(null)
  const [feedback,    setFeedback]    = useState(null) // null | 'sent'

  // Ref to scroll results into view
  const resultsRef = useRef(null)

  // ── Main analysis handler ────────────────────────────────
  const handleAnalyze = async ({ type, data }) => {
    // Reset previous state
    setLoading(true)
    setError(null)
    setResult(null)
    setFeedback(null)
    setInputType(type)

    try {
      let response

      switch (type) {
        case 'text':
          response = await analyzeText(data, false)
          break
        case 'url':
          response = await analyzeURL(data)
          break
        case 'image':
          response = await analyzeImage(data)
          break
        case 'voice':
          response = await analyzeVoice(data)
          break
        default:
          throw new Error(`Unknown input type: ${type}`)
      }

      setResult(response)

      // Scroll to results after a short delay
      // (lets React render the results first)
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({
          behavior: 'smooth',
          block:    'start',
        })
      }, 150)

    } catch (err) {
      // err is our clean object from api.js interceptor
      setError(err.message || 'Analysis failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Feedback handler ─────────────────────────────────────
  const handleFeedback = async (isCorrect) => {
    if (!result || feedback === 'sent') return

    try {
      await submitFeedback(
        result.analysis_id,
        isCorrect,
        ''
      )
      setFeedback('sent')
    } catch (err) {
      // Feedback failure is non-critical — don't show error
      console.warn('Feedback submission failed:', err)
      setFeedback('sent') // Still mark as sent to avoid repeated clicks
    }
  }

  // ── Loading messages for current type ────────────────────
  const loadingMsg = LOADING_MESSAGES[inputType] || LOADING_MESSAGES.text

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">

      {/* ── Hero section ───────────────────────────────── */}
      <div className="text-center space-y-4">
        <div className="space-y-2">
          <h1 className="text-4xl sm:text-5xl font-black
                         text-gray-900 dark:text-white
                         leading-tight">
            🛡️ ScamShield AI
          </h1>
          <p className="text-base sm:text-lg text-gray-500
                        dark:text-gray-400 max-w-2xl mx-auto
                        leading-relaxed">
            Detect scams instantly. Paste any suspicious SMS,
            email, URL, or screenshot — our AI analyzes it
            in seconds and tells you exactly what to do.
          </p>
        </div>

        {/* Feature tags */}
        <div className="flex flex-wrap justify-center gap-2">
          {FEATURE_TAGS.map(tag => (
            <span
              key={tag}
              className="px-3 py-1 text-xs sm:text-sm font-medium
                         rounded-full
                         bg-indigo-100 dark:bg-indigo-900/30
                         text-indigo-700 dark:text-indigo-300
                         border border-indigo-200 dark:border-indigo-700"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* ── Input section ──────────────────────────────── */}
      <InputTabs
        onAnalyze={handleAnalyze}
        loading={loading}
      />

      {/* ── Error display ───────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y:   0  }}
            exit={{    opacity: 0, y: -10  }}
            className="p-4 rounded-2xl
                       bg-red-50 dark:bg-red-900/20
                       border border-red-200 dark:border-red-800
                       space-y-2"
          >
            <p className="text-sm font-semibold
                          text-red-700 dark:text-red-300
                          flex items-center gap-2">
              <span>❌</span>
              <span>Analysis Failed</span>
            </p>
            <p className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
            {/* Hint if backend is not running */}
            {error.toLowerCase().includes('network') ||
             error.toLowerCase().includes('failed') ? (
              <p className="text-xs text-red-400 dark:text-red-500
                            font-mono bg-red-100 dark:bg-red-900/30
                            px-3 py-2 rounded-lg">
                💡 Make sure backend is running:
                uvicorn app.main:app --reload --port 8000
              </p>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Loading state ───────────────────────────────── */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{    opacity: 0 }}
          >
            <LoadingSpinner
              message={loadingMsg.main}
              subMessage={loadingMsg.sub}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Results section ─────────────────────────────── */}
      <AnimatePresence>
        {result && !loading && (
          <motion.div
            ref={resultsRef}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y:  0  }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="space-y-6"
          >

            {/* Results header row */}
            <div className="flex items-center justify-between
                            flex-wrap gap-3">
              <h2 className="text-xl font-bold
                             text-gray-900 dark:text-white
                             flex items-center gap-2">
                <span>📋</span>
                <span>Analysis Results</span>
              </h2>

              {/* Meta info */}
              <div className="flex items-center gap-3
                              text-xs text-gray-400
                              dark:text-gray-500">
                {result.processing_time_ms && (
                  <span className="flex items-center gap-1">
                    ⏱️ {Math.round(result.processing_time_ms)}ms
                  </span>
                )}
                {result.models_used?.length > 0 && (
                  <span className="flex items-center gap-1">
                    🤖 {result.models_used.length} model
                    {result.models_used.length !== 1 ? 's' : ''}
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-md
                                 bg-gray-100 dark:bg-gray-800
                                 font-mono">
                  {result.input_type}
                </span>
              </div>
            </div>

            {/* ── Main result grid ─────────────────────── */}
            {/* Mobile: stacked. Desktop: gauge left, explanation right */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Risk gauge — takes 1/3 width on desktop */}
              <div className="md:col-span-1">
                <RiskGauge
                  score={result.risk_score}
                  level={result.risk_level}
                  animate={true}
                />
              </div>

              {/* Explanation — takes 2/3 width on desktop */}
              <div className="md:col-span-2">
                <ExplanationCard result={result} />
              </div>

            </div>

            {/* ── Advice (full width) ──────────────────── */}
            <AdviceCard
              advice={result.advice}
              riskLevel={result.risk_level}
              hindi={result.hindi}
            />

            {/* ── Model details (collapsible) ──────────── */}
            <details className="card overflow-hidden group">
              <summary className="flex items-center justify-between
                                  p-4 cursor-pointer list-none
                                  hover:bg-gray-50 dark:hover:bg-gray-700/50
                                  transition-colors">
                <span className="text-sm font-medium
                                 text-gray-600 dark:text-gray-300
                                 flex items-center gap-2">
                  <span>🤖</span>
                  <span>Model details</span>
                </span>
                <span className="text-gray-400 text-xs
                                 group-open:rotate-180
                                 transition-transform duration-200">
                  ▼
                </span>
              </summary>

              <div className="px-4 pb-4 space-y-3
                              border-t border-gray-100
                              dark:border-gray-700">

                {/* Models used */}
                {result.models_used?.length > 0 && (
                  <div className="pt-3">
                    <p className="text-xs font-semibold text-gray-400
                                  uppercase tracking-wider mb-2">
                      Models used
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {result.models_used.map(model => (
                        <span
                          key={model}
                          className="px-2.5 py-1 rounded-lg text-xs
                                     font-medium font-mono
                                     bg-indigo-50 dark:bg-indigo-900/30
                                     text-indigo-600 dark:text-indigo-400
                                     border border-indigo-200
                                     dark:border-indigo-700"
                        >
                          ✓ {model}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Analysis metadata */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  {[
                    { label: 'Analysis ID',   value: result.analysis_id?.slice(0,8) + '...' },
                    { label: 'Input type',    value: result.input_type    },
                    { label: 'Language',      value: result.input_language || 'en' },
                    { label: 'Translated',    value: result.was_translated ? 'Yes' : 'No' },
                    { label: 'Confidence',    value: result.confidence    },
                    { label: 'Process time', value: result.processing_time_ms
                                                    ? `${Math.round(result.processing_time_ms)}ms`
                                                    : 'N/A' },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="p-3 bg-gray-50 dark:bg-gray-900/50
                                 rounded-xl space-y-0.5"
                    >
                      <p className="text-xxs font-bold text-gray-400
                                    uppercase tracking-wider">
                        {label}
                      </p>
                      <p className="text-xs font-mono text-gray-700
                                    dark:text-gray-300 font-medium">
                        {String(value)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </details>

            {/* ── Feedback bar ─────────────────────────── */}
            <div className="card p-4 flex items-center
                            justify-between gap-4 flex-wrap">
              <div>
                <p className="text-sm font-medium
                               text-gray-700 dark:text-gray-300">
                  Was this analysis accurate?
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Your feedback helps improve our AI
                </p>
              </div>

              {feedback === 'sent' ? (
                <span className="text-sm font-medium
                                 text-green-600 dark:text-green-400
                                 flex items-center gap-2">
                  <span>✅</span>
                  <span>Thank you for your feedback!</span>
                </span>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleFeedback(true)}
                    className="flex items-center gap-2 px-4 py-2
                               rounded-xl text-sm font-semibold
                               bg-green-100 dark:bg-green-900/30
                               text-green-700 dark:text-green-300
                               border border-green-200 dark:border-green-700
                               hover:bg-green-200 dark:hover:bg-green-900/50
                               transition-colors"
                  >
                    👍 Correct
                  </button>
                  <button
                    onClick={() => handleFeedback(false)}
                    className="flex items-center gap-2 px-4 py-2
                               rounded-xl text-sm font-semibold
                               bg-red-100 dark:bg-red-900/30
                               text-red-700 dark:text-red-300
                               border border-red-200 dark:border-red-700
                               hover:bg-red-200 dark:hover:bg-red-900/50
                               transition-colors"
                  >
                    👎 Wrong
                  </button>
                </div>
              )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Empty state (first visit) ───────────────────── */}
      {!result && !loading && !error && (
        <div className="text-center py-12 space-y-4">
          <p className="text-5xl">👆</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            Paste a suspicious message above to get started
          </p>
          <p className="text-xs text-gray-300 dark:text-gray-600">
            100% private — we never store your original message text
          </p>
        </div>
      )}

    </div>
  )
}