/**
 * AdviceCard.jsx — "What should you do now?"
 *
 * This is the MOST IMPORTANT card for the user.
 * A risk score tells them HOW bad it is.
 * This card tells them WHAT TO DO about it.
 *
 * FOUR sections:
 *  1. Opening statement  — risk-level summary sentence
 *  2. Emergency strip    — cybercrime helpline (HIGH/CRITICAL only)
 *  3. Immediate actions  — do THIS right now
 *  4. Prevention tips    — avoid this in future
 *  5. Report to          — where to report the scam
 *
 * HINDI TOGGLE:
 *  If backend returned Hindi translations, user can
 *  switch between English and Hindi with one button.
 *
 * DATA COMES FROM:
 *  result.advice.opening             → risk level statement
 *  result.advice.immediate_actions   → urgent steps list
 *  result.advice.preventive_measures → prevention tips list
 *  result.advice.report_to           → reporting options list
 *  result.advice.emergency_number    → "1930"
 *  result.advice.portal              → "cybercrime.gov.in"
 *  result.hindi                      → Hindi translations object
 */

import { useState } from 'react'

export default function AdviceCard({ advice, riskLevel, hindi }) {
  // Tracks whether Hindi or English is shown
  const [showHindi, setShowHindi] = useState(false)

  // Don't render if no advice data
  if (!advice) return null

  const {
    opening             = '',
    immediate_actions   = [],
    preventive_measures = [],
    report_to           = [],
    summary             = '',
    emergency_number    = '1930',
    portal              = 'cybercrime.gov.in',
  } = advice

  // Only show emergency strip for serious risk levels
  const showEmergency = riskLevel === 'CRITICAL' || riskLevel === 'HIGH'

  // Can we offer Hindi toggle?
  const hasHindi = hindi && (
    hindi.opening_hi       ||
    hindi.summary_hi       ||
    hindi.first_action_hi
  )

  return (
    <div className="card p-6 space-y-5 animate-slide-up">

      {/* ── Header row ───────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">

        <div className="flex items-center gap-3">
          <span className="text-2xl shrink-0">💡</span>
          <h3 className="font-bold text-gray-900 dark:text-white text-lg">
            What should you do?
          </h3>
        </div>

        {/* Hindi / English toggle button */}
        {hasHindi && (
          <button
            onClick={() => setShowHindi(prev => !prev)}
            className="shrink-0 flex items-center gap-1.5
                       text-xs px-3 py-1.5 rounded-lg font-semibold
                       bg-orange-100 dark:bg-orange-900/30
                       text-orange-700 dark:text-orange-300
                       border border-orange-200 dark:border-orange-700
                       hover:bg-orange-200 dark:hover:bg-orange-900/50
                       transition-colors duration-150"
          >
            {showHindi ? '🇬🇧 English' : '🇮🇳 हिंदी'}
          </button>
        )}

      </div>

      {/* ── Opening statement ────────────────────────────── */}
      {/* Changes based on risk level — set by backend */}
      {(opening || summary) && (
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50
                        rounded-xl border border-gray-200
                        dark:border-gray-700">
          <p className="text-sm font-medium text-gray-800
                        dark:text-gray-200 leading-relaxed">
            {showHindi && hindi?.opening_hi
              ? hindi.opening_hi
              : opening || summary}
          </p>
          {/* Show Hindi summary if toggle is off but it exists */}
          {!showHindi && hindi?.summary_hi && (
            <p className="text-xs text-gray-500 dark:text-gray-400
                          mt-2 pt-2
                          border-t border-gray-200 dark:border-gray-600
                          leading-relaxed">
              🇮🇳 {hindi.summary_hi}
            </p>
          )}
        </div>
      )}

      {/* ── Emergency strip ──────────────────────────────── */}
      {/* Prominent helpline display for HIGH and CRITICAL */}
      {showEmergency && (
        <div className="flex items-center justify-between gap-4
                        p-4 rounded-xl
                        bg-red-50 dark:bg-red-900/20
                        border-2 border-red-300 dark:border-red-700">

          {/* Left: helpline number */}
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-red-500
                          dark:text-red-400 uppercase tracking-wider">
              🚨 Cybercrime Helpline (Free)
            </p>
            <p className="text-3xl font-black text-red-700
                          dark:text-red-300 leading-none">
              📞 {emergency_number}
            </p>
            <p className="text-xs text-red-500 dark:text-red-400">
              Available 24 × 7 — Report immediately
            </p>
          </div>

          {/* Right: report online button */}
          <a
            href={`https://${portal}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 px-4 py-2 rounded-xl text-sm font-bold
                       bg-red-600 hover:bg-red-700 text-white
                       transition-colors duration-150
                       focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Report Online →
          </a>

        </div>
      )}

      {/* ── Immediate actions ────────────────────────────── */}
      {/* Things the user should do RIGHT NOW */}
      {immediate_actions.length > 0 && (
        <div className="space-y-2.5">

          <p className="text-sm font-bold text-gray-700
                        dark:text-gray-300 flex items-center gap-2">
            <span>⚡</span>
            <span>Do this RIGHT NOW:</span>
          </p>

          <ul className="space-y-2">
            {immediate_actions.map((action, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3 p-3 rounded-xl text-sm
                           bg-red-50 dark:bg-red-900/10
                           border border-red-100 dark:border-red-900/30
                           text-gray-700 dark:text-gray-300"
              >
                {/* Step number badge */}
                <span className="shrink-0 w-5 h-5 rounded-full
                                 bg-red-500 text-white text-xs
                                 font-bold flex items-center
                                 justify-center mt-0.5">
                  {idx + 1}
                </span>

                {/* Action text — show Hindi for first item if toggled */}
                <span className="leading-relaxed">
                  {showHindi && idx === 0 && hindi?.first_action_hi
                    ? hindi.first_action_hi
                    : action}
                </span>
              </li>
            ))}
          </ul>

        </div>
      )}

      {/* ── Divider ──────────────────────────────────────── */}
      {preventive_measures.length > 0 && immediate_actions.length > 0 && (
        <hr className="border-gray-200 dark:border-gray-700" />
      )}

      {/* ── Prevention tips ──────────────────────────────── */}
      {/* Longer term habits to avoid future scams */}
      {preventive_measures.length > 0 && (
        <div className="space-y-2.5">

          <p className="text-sm font-bold text-gray-700
                        dark:text-gray-300 flex items-center gap-2">
            <span>🛡️</span>
            <span>Prevent future scams:</span>
          </p>

          <ul className="space-y-2">
            {preventive_measures.map((tip, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3 text-sm
                           text-gray-600 dark:text-gray-400"
              >
                <span className="shrink-0 text-green-500
                                 font-bold mt-0.5">
                  ✓
                </span>
                <span className="leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>

        </div>
      )}

      {/* ── Divider ──────────────────────────────────────── */}
      {report_to.length > 0 && (
        <hr className="border-gray-200 dark:border-gray-700" />
      )}

      {/* ── Report to ────────────────────────────────────── */}
      {/* Where and how to report the scam */}
      {report_to.length > 0 && (
        <div className="space-y-2.5">

          <p className="text-sm font-bold text-gray-700
                        dark:text-gray-300 flex items-center gap-2">
            <span>📢</span>
            <span>Where to report:</span>
          </p>

          <ul className="space-y-1.5">
            {report_to.map((item, idx) => (
              <li
                key={idx}
                className="text-sm text-gray-600 dark:text-gray-400
                           leading-relaxed pl-2
                           border-l-2 border-indigo-200
                           dark:border-indigo-800"
              >
                {item}
              </li>
            ))}
          </ul>

        </div>
      )}

      {/* ── Safe message footer ──────────────────────────── */}
      {/* Only shown when risk is LOW — reassuring message */}
      {riskLevel === 'LOW' && (
        <div className="flex items-center gap-3 p-3
                        bg-green-50 dark:bg-green-900/20 rounded-xl
                        border border-green-200 dark:border-green-700">
          <span className="text-2xl">✅</span>
          <div>
            <p className="text-sm font-semibold text-green-700
                          dark:text-green-300">
              This appears to be legitimate
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
              Stay vigilant — when in doubt, verify directly
              with the organization
            </p>
          </div>
        </div>
      )}

    </div>
  )
}