/**
 * LoadingSpinner.jsx — Animated loading state
 *
 * Shown while backend is processing the analysis.
 * ML inference on CPU takes 2-10 seconds, so we need
 * a clear loading indicator so user knows it's working.
 *
 * DESIGN DECISIONS:
 *  - Shield emoji in center (on-brand)
 *  - Spinning ring around it
 *  - Bouncing dots below (shows "alive" not frozen)
 *  - Dynamic message prop (different text for OCR vs text)
 */

export default function LoadingSpinner({
  message = 'Analyzing...',
  subMessage = 'Running AI models — this takes a few seconds',
}) {
  return (
    <div className="card p-10 flex flex-col items-center gap-5 animate-fade-in">

      {/* ── Spinner ring + shield icon ─────────────────── */}
      <div className="relative w-20 h-20">

        {/* Outer static ring (gray track) */}
        <div className="absolute inset-0 rounded-full
                        border-4 border-gray-200 dark:border-gray-700" />

        {/* Spinning colored arc */}
        <div className="absolute inset-0 rounded-full
                        border-4 border-transparent
                        border-t-indigo-600 border-r-indigo-400
                        animate-spin" />

        {/* Center icon */}
        <div className="absolute inset-0 flex items-center
                        justify-center text-2xl">
          🛡️
        </div>
      </div>

      {/* ── Text ──────────────────────────────────────── */}
      <div className="text-center space-y-1">
        <p className="font-bold text-gray-800 dark:text-white text-lg">
          {message}
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          {subMessage}
        </p>
      </div>

      {/* ── Bouncing dots ─────────────────────────────── */}
      {/* Each dot has a staggered animation delay so they
          bounce one after another — shows the app is alive */}
      <div className="flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-indigo-500
                       animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>

      {/* ── Processing steps indicator ────────────────── */}
      <div className="w-full max-w-xs space-y-2">
        {[
          { label: 'Detecting language',    delay: '0s'    },
          { label: 'Running ML models',     delay: '0.8s'  },
          { label: 'Generating explanation',delay: '1.6s'  },
        ].map(({ label, delay }) => (
          <div
            key={label}
            className="flex items-center gap-3 opacity-0
                       animate-fade-in"
            style={{ animationDelay: delay, animationFillMode: 'forwards' }}
          >
            {/* Small spinning indicator */}
            <div className="w-3 h-3 rounded-full border-2
                            border-indigo-400 border-t-transparent
                            animate-spin shrink-0"
                 style={{ animationDuration: '0.8s' }} />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {label}
            </span>
          </div>
        ))}
      </div>

    </div>
  )
}