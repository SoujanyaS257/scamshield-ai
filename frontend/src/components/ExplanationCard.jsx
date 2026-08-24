/**
 * ExplanationCard.jsx — "Why is this suspicious?"
 *
 * Shows the user exactly WHY our AI flagged the message.
 * This is what makes ScamShield different from tools that
 * just say "this is spam" with no explanation.
 *
 * THREE sections:
 *  1. Triggered signals  — detected scam patterns (from reason_generator)
 *  2. Word highlights    — SHAP words that pushed the score up/down
 *  3. Translation notice — if input was Hindi
 *
 * DATA COMES FROM:
 *  result.triggered_signals → list of {category, reason, severity}
 *  result.top_words         → list of {word, impact, score}
 *  result.primary_reason    → single most important reason string
 *  result.scam_type         → e.g. "OTP/Credential Theft"
 *  result.was_translated    → boolean (was Hindi input?)
 *  result.hindi             → Hindi translation object
 */

// ── Severity → visual style mapping ──────────────────────────
// Each severity level gets different colors so user
// immediately understands which signals are most dangerous
const SEVERITY_STYLES = {
  CRITICAL: {
    wrapper: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    text:    'text-red-700 dark:text-red-300',
    emoji:   '🔴',
  },
  HIGH: {
    wrapper: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
    text:    'text-orange-700 dark:text-orange-300',
    emoji:   '🚨',
  },
  MEDIUM: {
    wrapper: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    text:    'text-yellow-700 dark:text-yellow-300',
    emoji:   '⚠️',
  },
  LOW: {
    wrapper: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    text:    'text-blue-700 dark:text-blue-300',
    emoji:   'ℹ️',
  },
}

// ── Scam type → emoji mapping ─────────────────────────────────
const SCAM_TYPE_EMOJI = {
  'OTP/Credential Theft':    '🔑',
  'UPI Payment Fraud':       '💸',
  'Lottery/Prize Scam':      '🎰',
  'Phishing Attack':         '🎣',
  'Impersonation Scam':      '🎭',
  'Personal Data Theft':     '📋',
  'Account Takeover Attempt':'🔓',
  'Financial Fraud':         '💰',
  'Unknown Scam':            '⚠️',
}


export default function ExplanationCard({ result }) {
  // Don't render anything if no result yet
  if (!result) return null

  const {
    scam_type         = 'Unknown',
    primary_reason    = '',
    triggered_signals = [],
    top_words         = [],
    was_translated    = false,
    hindi             = null,
  } = result

  // Split words into scam indicators vs legitimate indicators
  const scamWords  = top_words.filter(w => w.impact === 'scam')
  const legitWords = top_words.filter(w => w.impact === 'legitimate')

  const scamEmoji = SCAM_TYPE_EMOJI[scam_type] || '⚠️'

  return (
    <div className="card p-6 space-y-5 animate-slide-up">

      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0">🔍</span>
        <div className="min-w-0">
          <h3 className="font-bold text-gray-900 dark:text-white text-lg
                         leading-tight">
            Why is this suspicious?
          </h3>
          {/* Scam type pill */}
          {scam_type && scam_type !== 'Unknown Scam' && (
            <span className="inline-flex items-center gap-1.5 mt-1.5
                             px-3 py-0.5 rounded-full text-xs font-semibold
                             bg-indigo-100 dark:bg-indigo-900/40
                             text-indigo-700 dark:text-indigo-300
                             border border-indigo-200 dark:border-indigo-700">
              {scamEmoji} {scam_type}
            </span>
          )}
        </div>
      </div>

      {/* ── Translation notice ──────────────────────────── */}
      {/* Only shown when user typed in Hindi */}
      {was_translated && (
        <div className="flex items-center gap-2.5 p-3
                        bg-blue-50 dark:bg-blue-900/20 rounded-xl
                        border border-blue-200 dark:border-blue-700">
          <span className="text-lg shrink-0">🇮🇳</span>
          <div>
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Hindi input detected
            </p>
            <p className="text-xs text-blue-500 dark:text-blue-400 mt-0.5">
              Your message was translated to English for analysis
            </p>
          </div>
        </div>
      )}

      {/* ── Primary reason box ───────────────────────────── */}
      {/* The single most important finding — always shown */}
      {primary_reason && (
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl
                        border border-gray-200 dark:border-gray-700
                        space-y-2">
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500
                        uppercase tracking-wider">
            Primary concern
          </p>
          <p className="text-sm text-gray-800 dark:text-gray-200
                        leading-relaxed">
            {primary_reason}
          </p>

          {/* Hindi translation of primary reason */}
          {hindi?.primary_reason_hi && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
              <p className="text-xs text-gray-500 dark:text-gray-400
                            leading-relaxed">
                🇮🇳 {hindi.primary_reason_hi}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Triggered signals list ───────────────────────── */}
      {/* Each signal = one scam pattern detected */}
      {triggered_signals.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold
                        text-gray-700 dark:text-gray-300
                        flex items-center gap-2">
            <span>🚩</span>
            <span>
              Detected patterns
              <span className="ml-1.5 px-1.5 py-0.5 rounded-md
                               bg-gray-200 dark:bg-gray-700
                               text-xs font-bold text-gray-600
                               dark:text-gray-300">
                {triggered_signals.length}
              </span>
            </span>
          </p>

          <div className="space-y-2">
            {triggered_signals.map((signal, idx) => {
              const style = SEVERITY_STYLES[signal.severity]
                         || SEVERITY_STYLES.LOW

              return (
                <div
                  key={idx}
                  className={`
                    flex items-start gap-3 p-3 rounded-xl
                    border text-sm
                    ${style.wrapper}
                  `}
                >
                  {/* Severity emoji */}
                  <span className="shrink-0 mt-0.5 text-base">
                    {style.emoji}
                  </span>

                  <div className="min-w-0 space-y-0.5">
                    {/* Severity label */}
                    <span className={`text-xxs font-bold uppercase
                                     tracking-wider ${style.text}`}>
                      {signal.severity}
                    </span>
                    {/* Reason text */}
                    <p className={`leading-relaxed ${style.text}`}>
                      {signal.reason}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── SHAP Word Highlights ─────────────────────────── */}
      {/* Shows which specific words pushed the score up or down */}
      {(scamWords.length > 0 || legitWords.length > 0) && (
        <div className="space-y-3">
          <p className="text-sm font-semibold
                        text-gray-700 dark:text-gray-300
                        flex items-center gap-2">
            <span>🤖</span>
            <span>Key words identified by AI</span>
          </p>

          <div className="flex flex-wrap gap-2">
            {/* Scam words — red pills with up arrow */}
            {scamWords.map((w, i) => (
              <span
                key={`scam-${i}`}
                title={`SHAP score: +${w.score} (pushes toward scam)`}
                className="inline-flex items-center gap-1
                           px-3 py-1 rounded-full text-xs font-semibold
                           bg-red-100 dark:bg-red-900/30
                           text-red-700 dark:text-red-300
                           border border-red-200 dark:border-red-700
                           cursor-help"
              >
                <span>↑</span>
                <span>{w.word}</span>
              </span>
            ))}

            {/* Legitimate words — green pills with down arrow */}
            {legitWords.map((w, i) => (
              <span
                key={`legit-${i}`}
                title={`SHAP score: -${w.score} (pushes toward safe)`}
                className="inline-flex items-center gap-1
                           px-3 py-1 rounded-full text-xs font-semibold
                           bg-green-100 dark:bg-green-900/30
                           text-green-700 dark:text-green-300
                           border border-green-200 dark:border-green-700
                           cursor-help"
              >
                <span>↓</span>
                <span>{w.word}</span>
              </span>
            ))}
          </div>

          {/* Legend explaining what the arrows mean */}
          <div className="flex flex-wrap gap-4 text-xxs text-gray-400">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-red-400
                               inline-block" />
              ↑ Increased scam score
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-green-400
                               inline-block" />
              ↓ Decreased scam score
            </span>
            <span className="italic">
              Hover words for SHAP values
            </span>
          </div>
        </div>
      )}

      {/* ── Empty state ──────────────────────────────────── */}
      {/* Shown when no signals detected but score is low */}
      {triggered_signals.length === 0 && top_words.length === 0 && (
        <div className="text-center py-4 space-y-2">
          <p className="text-3xl">✅</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No suspicious patterns detected
          </p>
          <p className="text-xs text-gray-400">
            This message appears to be legitimate
          </p>
        </div>
      )}

    </div>
  )
}