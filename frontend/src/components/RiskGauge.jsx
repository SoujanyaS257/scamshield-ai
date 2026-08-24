/**
 * RiskGauge.jsx — Circular SVG gauge showing 0-100 risk score
 *
 * This is the most visually important component.
 * User sees this first and immediately understands the risk level.
 *
 * HOW THE SVG CIRCLE GAUGE WORKS:
 *  - We draw two circles on top of each other
 *  - Bottom circle = gray track (full circle)
 *  - Top circle = colored arc (partial circle showing score)
 *
 *  The trick is strokeDasharray + strokeDashoffset:
 *    strokeDasharray  = total circumference of circle
 *    strokeDashoffset = how much to "hide" from the start
 *
 *  Example: circumference = 339, score = 80%
 *    offset = 339 - (0.80 × 339) = 339 - 271 = 68
 *    So 68px of the stroke is hidden → 80% arc is visible
 *
 * SCORE ANIMATION:
 *  We count up from 0 to the real score using setInterval.
 *  This makes it feel dynamic and draws user attention.
 */

import { useEffect, useState } from 'react'

// ── Risk level configuration ──────────────────────────────────
// Matches backend RISK_LEVELS exactly
// color     = stroke color for SVG arc
// bgClass   = card background tint
// textClass = score number color
// badgeClass = risk label badge style
// emoji     = visual indicator

const RISK_CONFIG = {
  LOW: {
    color:      '#2ecc71',
    bgClass:    'bg-green-50 dark:bg-green-900/20',
    borderClass:'border-green-200 dark:border-green-800',
    textClass:  'text-green-700 dark:text-green-300',
    badgeClass: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700',
    emoji:      '✅',
    label:      'LOW RISK',
    description:'This appears safe',
  },
  MEDIUM: {
    color:      '#f39c12',
    bgClass:    'bg-yellow-50 dark:bg-yellow-900/20',
    borderClass:'border-yellow-200 dark:border-yellow-800',
    textClass:  'text-yellow-700 dark:text-yellow-300',
    badgeClass: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700',
    emoji:      '⚠️',
    label:      'MEDIUM RISK',
    description:'Be cautious',
  },
  HIGH: {
    color:      '#e67e22',
    bgClass:    'bg-orange-50 dark:bg-orange-900/20',
    borderClass:'border-orange-200 dark:border-orange-800',
    textClass:  'text-orange-700 dark:text-orange-300',
    badgeClass: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700',
    emoji:      '🚨',
    label:      'HIGH RISK',
    description:'Very suspicious',
  },
  CRITICAL: {
    color:      '#e74c3c',
    bgClass:    'bg-red-50 dark:bg-red-900/20',
    borderClass:'border-red-200 dark:border-red-800',
    textClass:  'text-red-700 dark:text-red-300',
    badgeClass: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700',
    emoji:      '🔴',
    label:      'CRITICAL',
    description:'Almost certainly a scam',
  },
}

// ── SVG dimensions ─────────────────────────────────────────────
const SIZE   = 160   // SVG viewBox width and height
const RADIUS = 62    // Circle radius (smaller = thinner ring space)
const STROKE = 12    // Ring thickness in pixels
const CENTER = SIZE / 2  // 80

// Pre-calculate circumference (2 × π × r)
const CIRCUMFERENCE = 2 * Math.PI * RADIUS  // ≈ 389.6


export default function RiskGauge({
  score   = 0,      // 0-100 numeric score from backend
  level   = 'LOW',  // LOW | MEDIUM | HIGH | CRITICAL
  animate = true,   // Whether to count up from 0
}) {

  // displayScore counts up from 0 to score for animation
  const [displayScore, setDisplayScore] = useState(0)

  // ── Count-up animation ─────────────────────────────────
  useEffect(() => {
    // No animation — just set directly
    if (!animate) {
      setDisplayScore(score)
      return
    }

    // Reset to 0 whenever a new score comes in
    setDisplayScore(0)

    // Guard: don't animate if score is 0
    if (score === 0) return

    const duration    = 1200  // Total animation time in ms
    const totalSteps  = 60    // Number of increments
    const stepSize    = score / totalSteps
    const stepDelay   = duration / totalSteps  // ms between steps

    let current = 0

    const timer = setInterval(() => {
      current += stepSize
      if (current >= score) {
        setDisplayScore(score)
        clearInterval(timer)
      } else {
        setDisplayScore(Math.round(current))
      }
    }, stepDelay)

    // Cleanup if component unmounts mid-animation
    return () => clearInterval(timer)

  }, [score, animate])

  // ── SVG arc calculation ────────────────────────────────
  // How much of the circle stroke to show
  const fillRatio = displayScore / 100
  const offset    = CIRCUMFERENCE - fillRatio * CIRCUMFERENCE

  // Get config for current risk level
  const config = RISK_CONFIG[level] || RISK_CONFIG.LOW

  return (
    <div className={`
      card p-6
      flex flex-col items-center gap-4
      border-2 ${config.borderClass} ${config.bgClass}
    `}>

      {/* ── SVG Circular Gauge ──────────────────────────── */}
      <div className="relative">
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          // Rotate -90° so arc starts at TOP (12 o'clock)
          // Default SVG starts arcs at 3 o'clock (right side)
          className="transform -rotate-90"
        >
          {/* Gray background track (full circle) */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE}
            className="text-gray-200 dark:text-gray-700"
          />

          {/* Colored progress arc */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke={config.color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            // Smooth transition as displayScore increments
            style={{ transition: 'stroke-dashoffset 0.05s linear' }}
          />
        </svg>

        {/* Center content — positioned absolutely over SVG */}
        {/* Note: SVG is rotated -90° but this div is NOT rotated */}
        <div className="absolute inset-0
                        flex flex-col items-center justify-center">
          {/* Large score number */}
          <span className={`text-4xl font-black leading-none ${config.textClass}`}>
            {Math.round(displayScore)}
          </span>
          {/* "/100" label */}
          <span className="text-xs text-gray-400 dark:text-gray-500
                           font-medium mt-0.5">
            / 100
          </span>
        </div>
      </div>

      {/* ── Risk Level Badge ────────────────────────────── */}
      <div className={`
        risk-badge border
        ${config.badgeClass}
        text-sm px-4 py-1.5 gap-2
      `}>
        <span>{config.emoji}</span>
        <span>{config.label}</span>
      </div>

      {/* ── Description ─────────────────────────────────── */}
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
        {config.description}
      </p>

      {/* ── Progress bar (secondary visual) ─────────────── */}
      {/* Reinforces the score with a horizontal bar */}
      <div className="w-full space-y-1">
        <div className="flex justify-between text-xs text-gray-400">
          <span>Safe (0)</span>
          <span>Dangerous (100)</span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700
                        rounded-full overflow-hidden">
          <div
            className="h-full rounded-full
                       transition-all duration-100 ease-linear"
            style={{
              width:           `${displayScore}%`,
              backgroundColor: config.color,
            }}
          />
        </div>
      </div>

      {/* ── Score zones legend ───────────────────────────── */}
      <div className="w-full grid grid-cols-4 gap-1 text-center">
        {[
          { label: 'LOW',      range: '0-25',  color: '#2ecc71' },
          { label: 'MED',      range: '26-50', color: '#f39c12' },
          { label: 'HIGH',     range: '51-75', color: '#e67e22' },
          { label: 'CRITICAL', range: '76+',   color: '#e74c3c' },
        ].map(({ label, range, color }) => (
          <div key={label} className="space-y-1">
            <div
              className="h-1.5 rounded-full mx-auto w-full"
              style={{ backgroundColor: color,
                       opacity: level === label || 
                                (label === 'MED' && level === 'MEDIUM')
                                ? 1 : 0.3 }}
            />
            <p className="text-xxs text-gray-400 leading-tight">
              {label}
            </p>
            <p className="text-xxs text-gray-300 dark:text-gray-600">
              {range}
            </p>
          </div>
        ))}
      </div>

    </div>
  )
}